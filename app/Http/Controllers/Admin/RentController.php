<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RentProperty;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class RentController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/RentProperty/Index', [
            'rents' => RentProperty::latest()->get(),
        ]);
    }

    public function banned($id)
    {
        $rent = RentProperty::findOrFail($id);
        $rent->status = 'banned';
        $rent->save();

        return Redirect::back()->with('success', 'Sewa berhasil dibanned.');
    }
}

