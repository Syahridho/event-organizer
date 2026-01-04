<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class HandleRole
{
    public function handle(Request $request, Closure $next, $role): Response
    {
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        $user = $request->user();

        if ($user->role !== $role) {
            // Redirect berdasarkan role user saat ini
            return match ($user->role) {
                'admin' => redirect()->route('admin.index'),
                'mitra' => redirect()->route('mitra.dashboard'),
                'member' => redirect()->route('welcome'),
                default => abort(403, 'Unauthorized.')
            };
        }

        return $next($request);
    }
}
