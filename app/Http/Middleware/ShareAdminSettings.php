<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\AdminSetting;
use Inertia\Inertia;

class ShareAdminSettings
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        $setting = AdminSetting::first();
        
        if ($setting) {
            Inertia::share('adminSettings', [
                'contact_phone' => $setting->contact_phone,
                'contact_email' => $setting->contact_email,
                'default_event_images' => $setting->default_image_event ?? [],
            ]);
        }

        return $next($request);
    }
}