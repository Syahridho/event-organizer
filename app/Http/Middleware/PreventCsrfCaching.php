<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PreventCsrfCaching
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        
        // Add cache control headers to prevent browser caching of pages with CSRF tokens
        if (method_exists($response, 'headers')) {
            $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, private');
            $response->headers->set('Pragma', 'no-cache');
            $response->headers->set('Expires', 'Thu, 01 Jan 1970 00:00:00 GMT');
            
            // Add Vary header to ensure proper caching behavior
            $response->headers->set('Vary', 'Cookie, Authorization, X-CSRF-TOKEN, X-Requested-With');
            
            // Add additional security headers
            $response->headers->set('X-Content-Type-Options', 'nosniff');
        }
        
        return $response;
    }
}