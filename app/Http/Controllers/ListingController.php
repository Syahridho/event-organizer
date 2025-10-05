<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Event; // ganti atau gabungkan model sesuai kebutuhan
use App\Models\Service;
use App\Models\Building;
use App\Models\RentProperties;

class ListingController extends Controller
{
    public function index(Request $request)
    {
        $perPage = 12;

        // contoh query; sesuaikan dengan hubungan, eager loading, filters
        $items = Service::latest()->paginate($perPage);

        // Kalau request XHR/Fetch, kembalikan JSON (frontend akan fetch next_page_url)
        if ($request->ajax()) {
            return response()->json($items);
        }

        // Normal Inertia render untuk initial page load
        return Inertia::render('Home/Index', [
            'items' => $items
        ]);
    }

    // optional: jika mau route json terpisah
    public function indexJson(Request $request)
    {
        $perPage = 12;
        $items = Event::latest()->paginate($perPage);
        return response()->json($items);
    }

    public function listEvent(Request $request)
    {
        $perPage = 12;
        $items = Event::latest()->paginate($perPage);

        if ($request->ajax()) {
            return response()->json($items);
        }

        return Inertia::render('Home/Ticket', [
            'items' => $items
        ]);
    }

    public function listService(Request $request)
    {
        $perPage = 12;
        $items = Service::latest()->paginate($perPage);

        if ($request->ajax()) {
            return response()->json($items);
        }

        return Inertia::render('Home/Services', [
            'items' => $items
        ]);
    }

    public function listBuilding(Request $request)
    {
        $perPage = 12;
        $items = Building::latest()->paginate($perPage);

        if ($request->ajax()) {
            return response()->json($items);
        }

        return Inertia::render('Home/Building', [
            'items' => $items
        ]);
    }

    public function listProperty(Request $request)
    {
        $perPage = 12;
        $items = RentProperties::latest()->paginate($perPage);

        if ($request->ajax()) {
            return response()->json($items);
        }

        return Inertia::render('Home/Property', [
            'items' => $items
        ]);
    }
}
