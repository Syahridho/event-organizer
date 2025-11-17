<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class MitraProfileController extends Controller
{
    /**
     * Display the mitra's profile page with all their items
     *
     * @param string $username
     * @return \Inertia\Response
     */
    public function show(string $username)
    {
        $user = User::where('username', $username)
            ->with(['events', 'services', 'buildings', 'rentProperties'])
            ->firstOrFail();
        
            $getThumbnailUrl = function($filename) {
                if (!$filename) {
                    return null;
                }
               
                $cleanFilename = Str::startsWith($filename, '/') ? Str::after($filename, '/') : $filename;
               
                if (Str::contains($cleanFilename, 'default-event-images')) {
                    return asset('storage/' . $cleanFilename);
                } else {
                    return asset('storage/thumbnails/' . $cleanFilename);
                }
            };
            
            /**
             * Generate safe URL for item details
             */
            $getDetailUrl = function($type, $id) {
                $routes = [
                    'event' => 'events.show',
                    'service' => 'services.show',
                    'building' => 'buildings.show',
                    'rent_property' => 'propertys.show'
                ];
                
                return route($routes[$type] ?? 'events.show', $id);
            };
             
            $allItems = collect([])
                ->concat($user->events->map(function($item) use ($getThumbnailUrl) {
                    $item->setAttribute('item_type', 'event');
                    if ($item->thumbnail) {
                        // Gunakan helper function
                        $item->thumbnail_url = $getThumbnailUrl($item->thumbnail); 
                    }
                    return $item;
                }))
                ->concat($user->services->map(function($item) use ($getThumbnailUrl) {
                    $item->setAttribute('item_type', 'service');
                    if ($item->thumbnail) {
                        $item->thumbnail_url = $getThumbnailUrl($item->thumbnail);
                    }
                    return $item;
                }))
                ->concat($user->buildings->map(function($item) use ($getThumbnailUrl) {
                    $item->setAttribute('item_type', 'building');
                    if ($item->thumbnail) {
                        $item->thumbnail_url = $getThumbnailUrl($item->thumbnail);
                    }
                    return $item;
                }))
                ->concat($user->rentProperties->map(function($item) use ($getThumbnailUrl) {
                    $item->setAttribute('item_type', 'rent_property');
                    if ($item->thumbnail) {
                        $item->thumbnail_url = $getThumbnailUrl($item->thumbnail);
                    }
                    return $item;
                }))
                ->sortByDesc('created_at');


        return Inertia::render('Mitra/Profile', [
            'mitra' => $user->only(['id', 'name', 'username', 'profile_photo']),
            'allItems' => $allItems
        ]);
    }
}