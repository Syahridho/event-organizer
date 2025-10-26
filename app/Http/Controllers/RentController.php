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
        return Inertia::render('Mitra/RentProperty/Create');
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

    }

    public function edit($id)
    {
        $rent = RentProperty::findOrFail($id);
        return Inertia::render('Mitra/RentProperty/Update', [
            'id' => $id,
            'rent' => $rent,
        ]);
    }

    public function update(Request $request, $id)
    {

        try {
            // dd($request->price);
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
    }

      public function destroy($id)
    {
        try {
            $rent = RentProperty::with('itemPhotos')->findOrFail($id);

            Storage::disk('public')->delete('thumbnails/' . $rent->thumbnail);

            foreach ($rent->itemPhotos as $photo) {
                Storage::disk('public')->delete('item-photos/' . $photo->photo);
                $photo->delete();
            }

            $rent->delete();

            return Redirect::route('rents.index')->with('success', 'Berhasil Menghapus Property');
           } catch (\Exception $e) {
            return Redirect::back()->withErrors(['error' => 'Gagal menghapus jasa: ' . $e->getMessage()]);
        }
    }

    /**
     * Show rent property detail with tax calculation
     */
    public function show($id)
    {
        $rent = RentProperty::with(['itemPhotos'])->findOrFail($id);

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
            ],
            'tax_info' => $taxInfo,
        ]);
    }
}
