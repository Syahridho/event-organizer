<?php

namespace App\Http\Controllers;

use App\Models\ItemPhoto;
use App\Models\Service;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use App\Helpers\TaxHelper;
use Illuminate\Support\Facades\DB;

class ServiceController extends Controller
{
    public function index() 
    {
        return Inertia::render('Mitra/Services/Index', [
            'services' => Service::where('user_id', Auth::id())->latest()->get()
        ]);
    }

    public function create()
    {
        $categories = Category::active()->get();

        return Inertia::render('Mitra/Services/Create', [
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

                $service = Service::create([
                    'user_id' => Auth::id(),
                    'name' => $request->name,
                    'thumbnail' => $photo,
                    'description' => $request->description,
                    'location' => $request->location,
                    'price' => intval(str_replace('.', '', $request->price)),
                    'status' => "active",
                ]);

                // Handle categories
                $selectedCategories = $request->input('selected_categories', []);
                $categoryIds = collect($selectedCategories)->pluck('id')->toArray();
                
                if (!empty($categoryIds)) {
                    $service->categories()->attach($categoryIds);
                }

                if ($request->has('itemPhoto')) {
                    foreach ($request->file('itemPhoto') as $index => $item) {
                        if (isset($item['photo'])) {
                            $photoFile = $item['photo'];
                            $filename = Str::uuid() . "." . $photoFile->getClientOriginalExtension();
                            $path = $photoFile->storeAs('item-photos', $filename, 'public');

                            ItemPhoto::create([
                                'item_id' => $service->id,
                                'item_type' => Service::class,
                                'photo' => $filename,
                                'caption' => $request->input("itemPhoto.$index.caption"),
                            ]);
                        }
                    }
                }

                return redirect()->route('services.index')->with('success', 'Jasa Berhasil Ditambahkan');
            } catch (\Exception $e) {
                return Redirect::back()->withErrors(['error' => 'Gagal Menambah Jasa: ' . $e->getMessage()]);
            }
        });
    }

    /**
     * Helper function to check if a service has settled or pending transactions.
     */
    private function hasSettledTransactions(Service $service)
    {
        return $service->transactionItems()
            ->whereHas('transaction', function ($query) {
                $query->whereIn('status', ['settlement', 'pending']);
            })
            ->exists();
    }

    public function destroy($id)
    {
        try {
            $service = Service::with('itemPhotos')->findOrFail($id);

            // === VALIDASI BARU ===
            // Cek otorisasi
            if ($service->user_id !== Auth::id()) {
                abort(403);
            }

            $message = 'Jasa ini tidak dapat dihapus karena sudah memiliki transaksi (settlement/pending). Harap hubungi administrator jika Anda perlu melakukan perubahan.';
            if ($this->hasSettledTransactions($service)) {
                abort(403, $message);
            }
            // === AKHIR VALIDASI ===

            // Detach categories to clean up pivot table entries
            $service->categories()->detach();

            if ($service->thumbnail && Storage::disk('public')->exists('thumbnails/' . $service->thumbnail)) {
                Storage::disk('public')->delete('thumbnails/' . $service->thumbnail);
            }

            foreach ($service->itemPhotos as $photo) {
                Storage::disk('public')->delete('item-photos/' . $photo->photo);
                $photo->delete();
            }

            $service->delete();

            return Redirect::route('services.index')->with('success', 'Berhasil Menghapus Jasa');
           } catch (\Exception $e) {
            return Redirect::back()->withErrors(['error' => 'Gagal menghapus Jasa: ' . $e->getMessage()]);
        }
    }

    public function edit($id)
    {
        $service = Service::with([
            'categories' => function ($query) {
                $query->withoutGlobalScope('user');
            }
        ])->findOrFail($id);
        
        $categories = Category::active()->get();

        return Inertia::render('Mitra/Services/Update', [
            'id' => $id,
            'service' => $service,
            'categories' => $categories,
        ]);
    }

    public function update(Request $request, $id)
    {
        return DB::transaction(function () use ($request, $id) {
            try {
                $service = Service::findOrFail($id);

                if ($request->hasFile('thumbnail')) {
                    if ($service->thumbnail && Storage::disk('public')->exists('thumbnails/' . $service->thumbnail)) {
                        Storage::disk('public')->delete('thumbnails/' . $service->thumbnail);
                    }

                    $file = $request->file('thumbnail');
                    $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('thumbnails', $filename, 'public');
                    $service->thumbnail = str_replace('thumbnails/', '', $path);
                }

                // Update field lainnya
                $service->name = $request->name;
                $service->description = $request->description;
                $service->location = $request->location;
                $service->price = intval(str_replace('.', '', $request->price));
                $service->save();

                // Handle categories
                $selectedCategories = $request->input('selected_categories', []);
                $categoryIds = collect($selectedCategories)->pluck('id')->toArray();
                
                if (!empty($categoryIds)) {
                    $service->categories()->sync($categoryIds);
                } else {
                    $service->categories()->detach();
                }

                $keepIds = collect($request->input('itemPhoto'))
                    ->pluck('id')
                    ->filter()
                    ->map(fn($id) => intval($id))
                    ->toArray();

                $service->itemPhotos()
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

                            $service->itemPhotos()->create([
                                'photo' => $filename,
                                'item_type' => Service::class,
                                'caption' => $request->input("itemPhoto.$index.caption"),
                            ]);
                        }
                    }
                }

                return redirect()->route('services.index')->with('success', 'Jasa berhasil diperbarui');

            } catch (\Exception $e) {
                return redirect()->back()->withErrors([
                    'error' => 'Gagal memperbarui layanan: ' . $e->getMessage()
                ]);
            }
        });
    }

    /**
     * Show service detail with tax calculation
     */
    public function show($id)
    {
        $service = Service::with(['itemPhotos', 'user'])->findOrFail($id);

        // Calculate tax-inclusive price
        $finalPrice = TaxHelper::calculateFinalPrice($service->price);
        
        // Get tax info for display
        $taxInfo = TaxHelper::getTaxInfo();

        return Inertia::render('Mitra/Services/Show', [
            'id' => $id,
            'service' => [
                'id' => $service->id,
                'name' => $service->name,
                'price' => $service->price,
                'final_price' => $finalPrice, // Tax-inclusive price
                'tax_amount' => round($finalPrice - $service->price, 2),
                'description' => $service->description,
                'location' => $service->location,
                'thumbnail' => $service->thumbnail,
                'item_photos' => $service->itemPhotos,
                'user_name' => $service->user->name,
            ],
            'tax_info' => $taxInfo,
        ]);
    }
}
