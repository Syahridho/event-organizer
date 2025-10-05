<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Building;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class BuildingController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Buildings/Index', [
            'buildings' => Building::latest()->get(),
        ]);
    }

    public function banned($id)
    {
        $building = Building::findOrFail($id);
        $building->status = 'banned';
        $building->save();

        return Redirect::back()->with('success', 'Building berhasil dibanned.');
    }
}
