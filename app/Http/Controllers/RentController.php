<?php

namespace App\Http\Controllers;

use App\Models\ItemPhoto;
use App\Models\RentProperty;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use App\Helpers\TaxHelper;
use Illuminate\Support\Facades\DB;

class RentController extends Controller
{
      public function index() 
    {
        return Inertia::render('Mitra/RentProperty/Index', [
            'rentPropertys' => RentProperty::where('user_id', Auth::id())->latest()->get()
        ]);
    }

    public function create()
    {
        $categories = \App\Models\Category::active()->get();

        return Inertia::render('Mitra/RentProperty/Create', [
            'categories' => $categories
        ]);
    }

    public function store(Request $request)
    {
        return DB::transaction(function () use ($request) {
            try {
                if ($request->hasFile('thumbnail')) {
                    $file = $request->file('thumbnail');
                    $filename = Str::uuid() . "." . $file->getClientOriginalExtension();
                    $path = $file->storeAs('thumbnails', $filename, 'public');
                    $photo = str_replace('thumbnails/', '', $path);
                } else {
                    $photo = null;
                }

            
                $rent = RentProperty::create([
                    'user_id' => Auth::id(),
                    'name' => $request->name,
                    'thumbnail' => $photo,
                    'description' => $request->description,
                    'location' => $request->location,
                    'price' => intval(str_replace('.', '', $request->price)),
                    'pin' => implode(',', $request->pin),
                    'delivered' => $request->delivered,
                    'picked_up' => $request->picked_up,
                    'status' => "active",
                ]);

                // Handle categories
                $selectedCategories = $request->input('selected_categories', []);
                $categoryIds = collect($selectedCategories)->pluck('id')->toArray();
                
                if (!empty($categoryIds)) {
                    $rent->categories()->attach($categoryIds);
                }

                if ($request->has('itemPhoto')) {
                    foreach ($request->file('itemPhoto') as $index => $item) {
                        if (isset($item['photo'])) {
                            $photoFile = $item['photo'];
                            $filename = Str::uuid() . "." . $photoFile->getClientOriginalExtension();
                            $path = $photoFile->storeAs('item-photos', $filename, 'public');

                            ItemPhoto::create([
                                'item_id' => $rent->id,
                                'item_type' => RentProperty::class,
                                'photo' => $filename,
                                'caption' => $request->input("itemPhoto.$index.caption"),
                            ]);
                        }
                    }
                }

                return redirect()->route('rents.index')->with('success', 'Property Berhasil Ditambahkan');
            } catch (\Exception $e) {
                return Redirect::back()->withErrors(['error' => 'Gagal Menambah Property: ' . $e->getMessage()]);
            }
        });
    }

    public function edit($id)
    {
        $rent = RentProperty::with([
            'categories' => function ($query) {
                $query->withoutGlobalScope('user');
            }
        ])->findOrFail($id);
        
        $categories = \App\Models\Category::active()->get();

        return Inertia::render('Mitra/RentProperty/Update', [
            'id' => $id,
            'rent' => $rent,
            'categories' => $categories,
        ]);
    }

    public function update(Request $request, $id)
    {
        return DB::transaction(function () use ($request, $id) {
            try {
                $rent = RentProperty::findOrFail($id);

                if ($request->hasFile('thumbnail')) {
                    if ($rent->thumbnail && Storage::disk('public')->exists('thumbnails/' . $rent->thumbnail)) {
                        Storage::disk('public')->delete('thumbnails/' . $rent->thumbnail);
                    }

                    $file = $request->file('thumbnail');
                    $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('thumbnails', $filename, 'public');
                    $rent->thumbnail = str_replace('thumbnails/', '', $path);
                }

                $rent->name = $request->name;
                $rent->description = $request->description;
                $rent->location = $request->location;
                $rent->pin = implode(',', $request->pin);
                $rent->price = intval(str_replace('.', '', $request->price));
                $rent->delivered = $request->delivered;
                $rent->picked_up = $request->picked_up;
                $rent->save();

                // Handle categories
                $selectedCategories = $request->input('selected_categories', []);
                $categoryIds = collect($selectedCategories)->pluck('id')->toArray();
                
                if (!empty($categoryIds)) {
                    $rent->categories()->sync($categoryIds);
                } else {
                    $rent->categories()->detach();
                }

                $keepIds = collect($request->input('itemPhoto'))
                    ->pluck('id')
                    ->filter()
                    ->map(fn($id) => intval($id))
                    ->toArray();

                $rent->itemPhotos()
                    ->whereNotIn('id', $keepIds)
                    ->each(function ($photo) {
                        if ($photo->photo && Storage::disk('public')->exists('item-photos/' . $photo->photo)) {
                            Storage::disk('public')->delete('item-photos/' . $photo->photo);
                        }
                        $photo->delete();
                    });

                $files = $request->file('itemPhoto');

                if (is_array($files)) {
                    foreach ($files as $index => $fileSet) {
                        if (!isset($request->input("itemPhoto")[$index]['id']) && isset($fileSet['photo'])) {
                            $photoFile = $fileSet['photo'];
                            $filename = Str::uuid() . "." . $photoFile->getClientOriginalExtension();
                            $photoFile->storeAs('item-photos', $filename, 'public');

                            $rent->itemPhotos()->create([
                                'photo' => $filename,
                                'item_type' => RentProperty::class,
                                'caption' => $request->input("itemPhoto.$index.caption"),
                            ]);
                        }
                    }
                }

                return redirect()->route('rents.index')->with('success', 'Property berhasil diperbarui');

            } catch (\Exception $e) {
                return redirect()->back()->withErrors([
                    'error' => 'Gagal memperbarui Property: ' . $e->getMessage()
                ]);
            }
        });
    }

    /**
     * Helper function to check if a rent property has settled or pending transactions.
     */
    private function hasSettledTransactions(RentProperty $rent)
    {
        return $rent->transactionItems()
            ->whereHas('transaction', function ($query) {
                $query->whereIn('status', ['settlement', 'pending']);
            })
            ->exists();
    }

      public function destroy($id)
    {
        try {
            $rent = RentProperty::with('itemPhotos')->findOrFail($id);

            // === VALIDASI BARU ===
            // Cek otorisasi
            if ($rent->user_id !== Auth::id()) {
                abort(403);
            }

            $message = 'Properti ini tidak dapat dihapus karena sudah memiliki transaksi (settlement/pending). Harap hubungi administrator jika Anda perlu melakukan perubahan.';
            if ($this->hasSettledTransactions($rent)) {
                abort(403, $message);
            }
            // === AKHIR VALIDASI ===

            // Detach categories to clean up pivot table entries
            $rent->categories()->detach();

            if ($rent->thumbnail && Storage::disk('public')->exists('thumbnails/' . $rent->thumbnail)) {
                Storage::disk('public')->delete('thumbnails/' . $rent->thumbnail);
            }

            foreach ($rent->itemPhotos as $photo) {
                Storage::disk('public')->delete('item-photos/' . $photo->photo);
                $photo->delete();
            }

            $rent->delete();

            return Redirect::route('rents.index')->with('success', 'Berhasil Menghapus Property');
           } catch (\Exception $e) {
            return Redirect::back()->withErrors(['error' => 'Gagal menghapus Property: ' . $e->getMessage()]);
        }
    }

    /**
     * Show rent property detail with tax calculation
     */
    public function show($id)
    {
        $rent = RentProperty::with(['itemPhotos', 'user'])->findOrFail($id);

        // Calculate tax-inclusive price
        $finalPrice = TaxHelper::calculateFinalPrice($rent->price);
        
        // Get tax info for display
        $taxInfo = TaxHelper::getTaxInfo();

        return Inertia::render('Mitra/RentProperty/Show', [
            'id' => $id,
            'rent' => [
                'id' => $rent->id,
                'name' => $rent->name,
                'price' => $rent->price,
                'final_price' => $finalPrice, // Tax-inclusive price
                'tax_amount' => round($finalPrice - $rent->price, 2),
                'description' => $rent->description,
                'location' => $rent->location,
                'thumbnail' => $rent->thumbnail,
                'item_photos' => $rent->itemPhotos,
                'user_name' => $rent->user->name,
                'picked_up' => $rent->picked_up,
                'delivered' => $rent->delivered,
            ],
            'tax_info' => $taxInfo,
        ]);
    }
}
