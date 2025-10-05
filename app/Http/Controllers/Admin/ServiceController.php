<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class ServiceController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Services/Index', [
            'services' => Service::latest()->get(),
        ]);
    }

    public function show($id)
    {
        $event = Service::findOrFail($id);

        return Inertia::render('Admin/Services/Show', [
            'id' => $id,
            'service' => $event
        ]);
    }

    public function banned($id)
    {
        $service = Service::findOrFail($id);
        $service->status = 'banned';
        $service->save();

        return Redirect::back()->with('success', 'Service berhasil dibanned.');
    }
}
