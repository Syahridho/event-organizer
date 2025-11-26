<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Support\Facades\Log;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        //
    ];

    /**
     * Add cache control headers to prevent caching of pages with CSRF tokens
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Illuminate\Http\Response  $response
     * @return \Illuminate\Http\Response
     */
    protected function addCacheControlHeaders($request, $response)
    {
        // Add cache control headers to prevent browser caching
        $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', 'Thu, 01 Jan 1970 00:00:00 GMT');
        
        // Add Vary header to ensure proper caching behavior
        $response->headers->set('Vary', 'Cookie, Authorization');
        
        return $response;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     *
     * @throws \Illuminate\Session\TokenMismatchException
     */
    public function handle($request, $next)
    {
        try {
            $response = parent::handle($request, $next);
            
            // Add cache control headers to prevent caching of pages with CSRF tokens
            if ($response && method_exists($response, 'headers')) {
                $this->addCacheControlHeaders($request, $response);
            }
            
            return $response;
        } catch (TokenMismatchException $e) {
            Log::warning('CSRF token mismatch detected', [
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'session_id' => session()->getId(),
                'csrf_token' => $request->input('_token') ?: 'not provided',
                'header_token' => $request->header('X-CSRF-TOKEN') ?: 'not provided',
            ]);

            // For AJAX requests, return JSON response
            if ($request->expectsJson()) {
                $response = response()->json([
                    'message' => 'CSRF token mismatch. Please refresh the page and try again.',
                    'csrf_refresh' => true
                ], 419);
                
                return $this->addCacheControlHeaders($request, $response);
            }

            // For Inertia requests, redirect back with error
            if ($request->header('X-Inertia')) {
                return back()
                    ->withErrors([
                        'csrf' => 'Your session has expired. Please refresh the page and try again.'
                    ]);
            }

            // For regular form submissions, redirect back
            return back()
                ->withInput($request->except(['password', '_token']))
                ->withErrors(['csrf' => 'Your session has expired. Please refresh the page and try again.']);
        }
    }
}
