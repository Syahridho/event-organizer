<?php

namespace App\Http\Controllers;

use App\Models\Building;
use App\Models\Category;
use App\Models\ItemPhoto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use App\Helpers\TaxHelper;
use Illuminate\Support\Facades\DB;

class BuildingController extends Controller
{
    public function index() 
    {
        return Inertia::render('Mitra/Buildings/Index', [
            'buildings' => Building::where('user_id', Auth::id())->latest()->get()
        ]);
    }

    public function create()
    {
        $categories = Category::active()->get();

        return Inertia::render('Mitra/Buildings/Create', [
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

            
                $building = Building::create([
                    'user_id' => Auth::id(),
                    'name' => $request->name,
                    'thumbnail' => $photo,
                    'description' => $request->description,
                    'capacity' => $request->capacity,
                    'location' => $request->location,
                    'price' => intval(str_replace('.', '', $request->price)),
                    'pin' => implode(',', $request->pin),
                    'status' => "active",
                ]);

                // Handle categories
                $selectedCategories = $request->input('selected_categories', []);
                $categoryIds = collect($selectedCategories)->pluck('id')->toArray();
                
                if (!empty($categoryIds)) {
                    $building->categories()->attach($categoryIds);
                }

                if ($request->has('itemPhoto')) {
                    foreach ($request->file('itemPhoto') as $index => $item) {
                        if (isset($item['photo'])) {
                            $photoFile = $item['photo'];
                            $filename = Str::uuid() . "." . $photoFile->getClientOriginalExtension();
                            $path = $photoFile->storeAs('item-photos', $filename, 'public');

                            ItemPhoto::create([
                                'item_id' => $building->id,
                                'item_type' => Building::class,
                                'photo' => $filename,
                                'caption' => $request->input("itemPhoto.$index.caption"),
                            ]);
                        }
                    }
                }

                return redirect()->route('buildings.index')->with('success', 'Gedung Berhasil Ditambahkan');
            } catch (\Exception $e) {
                return Redirect::back()->withErrors(['error' => 'Gagal Menambah Gedung: ' . $e->getMessage()]);
            }
        });
    }

    public function edit($id)
    {
        $building = Building::with([
            'categories' => function ($query) {
                $query->withoutGlobalScope('user');
            }
        ])->findOrFail($id);
        
        $categories = Category::active()->get();

        return Inertia::render('Mitra/Buildings/Update', [
            'id' => $id,
            'building' => $building,
            'categories' => $categories,
        ]);
    }

    public function update(Request $request, $id)
    {
        return DB::transaction(function () use ($request, $id) {
            try {
                $building = Building::findOrFail($id);

                if ($request->hasFile('thumbnail')) {
                    if ($building->thumbnail && Storage::disk('public')->exists('thumbnails/' . $building->thumbnail)) {
                        Storage::disk('public')->delete('thumbnails/' . $building->thumbnail);
                    }

                    $file = $request->file('thumbnail');
                    $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('thumbnails', $filename, 'public');
                    $building->thumbnail = str_replace('thumbnails/', '', $path);
                }

                $building->name = $request->name;
                $building->description = $request->description;
                $building->location = $request->location;
                $building->pin = implode(',', $request->pin);
                $building->price = intval(str_replace('.', '', $request->price));
                $building->capacity = $request->capacity;
                $building->save();

                // Handle categories
                $selectedCategories = $request->input('selected_categories', []);
                $categoryIds = collect($selectedCategories)->pluck('id')->toArray();
                
                if (!empty($categoryIds)) {
                    $building->categories()->sync($categoryIds);
                } else {
                    $building->categories()->detach();
                }

                $keepIds = collect($request->input('itemPhoto'))
                    ->pluck('id')
                    ->filter()
                    ->map(fn($id) => intval($id))
                    ->toArray();

                $building->itemPhotos()
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

                            $building->itemPhotos()->create([
                                'photo' => $filename,
                                'item_type' => Building::class,
                                'caption' => $request->input("itemPhoto.$index.caption"),
                            ]);
                        }
                    }
                }

                return redirect()->route('buildings.index')->with('success', 'Gedung berhasil diperbarui');

            } catch (\Exception $e) {
                return redirect()->back()->withErrors([
                    'error' => 'Gagal memperbarui gedung: ' . $e->getMessage()
                ]);
            }
        });
    }

    /**
     * Helper function to check if a building has settled or pending transactions.
     */
    private function hasSettledTransactions(Building $building)
    {
        return $building->transactionItems()
            ->whereHas('transaction', function ($query) {
                $query->whereIn('status', ['settlement', 'pending']);
            })
            ->exists();
    }

    public function destroy($id)
    {
        try {
            $building = Building::with('itemPhotos')->findOrFail($id);

            // === VALIDASI BARU ===
            // Cek otorisasi
            if ($building->user_id !== Auth::id()) {
                abort(403);
            }

            $message = 'Gedung ini tidak dapat dihapus karena sudah memiliki transaksi (settlement/pending). Harap hubungi administrator jika Anda perlu melakukan perubahan.';
            if ($this->hasSettledTransactions($building)) {
                abort(403, $message);
            }
            // === AKHIR VALIDASI ===

            if ($building->thumbnail && Storage::disk('public')->exists('thumbnails/' . $building->thumbnail)) {
                Storage::disk('public')->delete('thumbnails/' . $building->thumbnail);
            }

            foreach ($building->itemPhotos as $photo) {
                Storage::disk('public')->delete('item-photos/' . $photo->photo);
                $photo->delete();
            }

            $building->delete();

            return Redirect::route('buildings.index')->with('success', 'Berhasil menghapus gedung');
           } catch (\Exception $e) {
            return Redirect::back()->withErrors(['error' => 'Gagal menghapus gedung: ' . $e->getMessage()]);
        }
    }

    /**
     * Show building detail with tax calculation
     */
    public function show($id)
    {
        $building = Building::with(['itemPhotos', 'user'])->findOrFail($id);

        // Calculate tax-inclusive price
        $finalPrice = TaxHelper::calculateFinalPrice($building->price);
        
        // Get tax info for display
        $taxInfo = TaxHelper::getTaxInfo();

        return Inertia::render('Mitra/Buildings/Show', [
            'id' => $id,
            'building' => [
                'id' => $building->id,
                'name' => $building->name,
                'price' => $building->price,
                'final_price' => $finalPrice, // Tax-inclusive price
                'tax_amount' => round($finalPrice - $building->price, 2),
                'description' => $building->description,
                'location' => $building->location,
                'capacity' => $building->capacity,
                'thumbnail' => $building->thumbnail,
                'item_photos' => $building->itemPhotos,
                'user_name' => $building->user->name,
            ],
            'tax_info' => $taxInfo,
        ]);
    }
}
