<?php

namespace App\Http\Controllers;

use App\Models\Building;
use App\Models\ItemPhoto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use App\Helpers\TaxHelper;

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
        return Inertia::render('Mitra/Buildings/Create');
    }

    public function store(Request $request)
    {
        if ($request->hasFile('thumbnail')) {
            $file = $request->file('thumbnail');
            $filename = Str::uuid() . "." . $file->getClientOriginalExtension();
            $path = $file->storeAs('thumbnails', $filename, 'public');
            $photo = str_replace('thumbnails/', '', $path);
        } else {
            $photo = null;
        }

    
        $service = Building::create([
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

        if ($request->has('itemPhoto')) {
            foreach ($request->file('itemPhoto') as $index => $item) {
                if (isset($item['photo'])) {
                    $photoFile = $item['photo'];
                    $filename = Str::uuid() . "." . $photoFile->getClientOriginalExtension();
                    $path = $photoFile->storeAs('item-photos', $filename, 'public');

                    ItemPhoto::create([
                        'item_id' => $service->id,
                        'item_type' => Building::class,
                        'photo' => $filename,
                        'caption' => $request->input("itemPhoto.$index.caption"),
                    ]);
                }
            }
        }

        return redirect()->route('buildings.index')->with('success', 'Gedung Berhasil Ditambahkan');

    }

    public function edit($id)
    {
        $building = Building::findOrFail($id);
        
        return Inertia::render('Mitra/Buildings/Update', [
            'id' => $id,
            'building' => $building,
        ]);
    }

    public function update(Request $request, $id)
    {

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
            $building->save();

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
    }

    public function destroy($id)
    {
        try {
            $building = Building::with('itemPhotos')->findOrFail($id);

            Storage::disk('public')->delete('thumbnails/' . $building->thumbnail);

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
        $building = Building::with(['itemPhotos'])->findOrFail($id);

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
            ],
            'tax_info' => $taxInfo,
        ]);
    }
}
