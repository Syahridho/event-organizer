<?php

namespace App\Http\Controllers;

use App\Models\ItemPhoto;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use App\Helpers\TaxHelper;

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
        return Inertia::render('Mitra/Services/Create');
    }

    public function store(Request $request)
    {
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
            return Redirect::back()->withErrors(['error' => 'Gagal Menghapus Jasa: ' . $e->getMessage()]);
        }
    }

    public function destroy($id)
    {
        try {
            $service = Service::with('itemPhotos')->findOrFail($id);

            Storage::disk('public')->delete('thumbnails/' . $service->thumbnail);

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

        $service = Service::findOrFail($id);

        return Inertia::render('Mitra/Services/Update', [
            'id' => $id,
            'service' => $service,
        ]);
    }

    public function update(Request $request, $id)
    {
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
    }

    /**
     * Show service detail with tax calculation
     */
    public function show($id)
    {
        $service = Service::with(['itemPhotos'])->findOrFail($id);

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
            ],
            'tax_info' => $taxInfo,
        ]);
    }
}

