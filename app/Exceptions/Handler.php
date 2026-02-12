<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Inertia\Inertia;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });

        $this->renderable(function (Throwable $e, $request) {
            // Handle Inertia requests
            if ($request->header('X-Inertia')) {
                // Only handle actual exceptions, not successful requests
                // For login requests that actually failed with an exception
                if ($request->is('login') && $request->isMethod('POST') && $e instanceof \Exception) {
                    // Log the exception for debugging
                    \Log::error('Login exception caught', [
                        'message' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                        'request_data' => $request->except(['password'])
                    ]);
                    
                    return redirect()->back()
                        ->with('error', 'Terjadi kesalahan saat login. Silakan coba lagi.')
                        ->withErrors(['email' => 'Terjadi kesalahan saat login. Silakan coba lagi.']);
                }
                
                // Handle HTTP exceptions
                if ($e instanceof HttpException) {
                    return Inertia::render('Error', [
                        'status' => $e->getStatusCode(),
                        'message' => $e->getMessage() ?: 'An error occurred',
                    ])->toResponse($request)->setStatusCode($e->getStatusCode());
                }
                
                // Handle other exceptions for Inertia requests
                return Inertia::render('Error', [
                    'status' => 500,
                    'message' => 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.',
                ])->toResponse($request)->setStatusCode(500);
            }
        });
    }
}
