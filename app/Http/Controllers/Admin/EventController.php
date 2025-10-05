<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class EventController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Events/Index', [
            'events' => Event::with('speakers')->latest()->get(),
        ]);
    }

    public function show($id)
    {
        $event = Event::findOrFail($id);

        return Inertia::render('admin/events/show', [
            'id' => $id,
            'event' => $event
        ]);
    }
    
    public function banned($id)
    {
        $event = Event::findOrFail($id);
        $event->status = 'banned';
        $event->save();

        return Redirect::back()->with('success', 'Event berhasil dibanned.');
    }
}
