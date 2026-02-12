<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Auth\OtpController;
use App\Http\Requests\Auth\LoginRequest;
use App\Mail\OtpMail;
use App\Providers\RouteServiceProvider;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Inertia\Response;
use Inertia\Inertia;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        // Set a longer timeout for login requests to prevent hanging
        set_time_limit(30); // 30 seconds max execution time
        
        Log::info('Login attempt started', [
            'email' => $request->email,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);
        
        try {
            $request->authenticate();
            $user = Auth::user();
            $request->session()->regenerate();
            
            Log::info('Authentication successful', [
                'user_id' => $user->id,
                'email' => $user->email
            ]);
            
            // Update last seen at
            $user->update([
                'last_seen_at' => now(),
            ]);
    
        // Check if user's email is verified
        if (!$user->hasVerifiedEmail()) {
            Log::info('User email not verified', [
                'user_id' => $user->id,
                'email' => $user->email
            ]);
            
            // Send OTP for email verification
            try {
                $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
                Mail::to($user->email)->queue(new OtpMail($otp, $user->email));
            } catch (\Exception $e) {
                Log::error('Failed to send OTP after login: ' . $e->getMessage());
            }

            // Store email in session for OTP page
            session(['user_email' => $user->email]);
            
            // Logout user and redirect to OTP verification
            Auth::logout();
            // Regenerate session to prevent CSRF issues
            session()->regenerate();
            
            return redirect()->route('otp.verify.page', ['email' => $user->email])
                ->with('warning', 'Silakan verifikasi email Anda dengan kode OTP yang telah dikirim.');
        }
    
        $redirectTo = $request->get('redirect');
        
        $defaultRedirect = RouteServiceProvider::HOME;
        
        Log::info('Redirecting user', [
            'user_id' => $user->id,
            'redirect_to' => $redirectTo ?: $defaultRedirect
        ]);
    
        if ($redirectTo) {
            return redirect($redirectTo);
        }
    
        return redirect()->intended($defaultRedirect);
        
        } catch (\Exception $e) {
            Log::error('Login error occurred', [
                'email' => $request->email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Re-throw the exception to let the LoginRequest handle validation errors
            throw $e;
        }
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Log::info('Logout process started', [
            'user_id' => Auth::guard('web')->user()?->id,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'session_id' => session()->getId()
        ]);

        if (Auth::guard('web')->check()) {
            $user = Auth::guard('web')->user();
            $user->update([
                'last_seen_at' => now(),
            ]);
            
            Log::info('User last_seen_at updated', [
                'user_id' => $user->id,
                'last_seen_at' => $user->last_seen_at
            ]);
        }

        Auth::guard('web')->logout();
        
        Log::info('User logged out', [
            'session_id' => session()->getId()
        ]);

        $request->session()->invalidate();

        Log::info('Session invalidated', [
            'old_session_id' => session()->getId()
        ]);

        $request->session()->regenerateToken();

        Log::info('Session token regenerated', [
            'new_session_id' => session()->getId()
        ]);

        // Create response with cache control headers to prevent caching
        $response = redirect('/');
        $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', 'Thu, 01 Jan 1970 00:00:00 GMT');

        return $response;
    }
}
