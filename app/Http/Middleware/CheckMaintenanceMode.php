<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\AdminSetting;
use Inertia\Inertia;

class CheckMaintenanceMode
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        $setting = AdminSetting::first();

        // Check if maintenance mode is enabled and user is not accessing admin routes
        if ($setting && $setting->maintenance_mode && !$request->is('admin/*')) {
            // Return maintenance page for non-admin users
            return Inertia::render('Maintenance');
        }

        return $next($request);
    }
}
