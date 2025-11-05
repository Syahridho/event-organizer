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
            // Only handle HTTP exceptions for Inertia requests
            if ($request->header('X-Inertia') && $e instanceof HttpException) {
                return Inertia::render('Error', [
                    'status' => $e->getStatusCode(),
                    'message' => $e->getMessage() ?: 'An error occurred',
                ])->toResponse($request)->setStatusCode($e->getStatusCode());
            }
        });
    }
}
