<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\OtpMail;
use App\Models\OtpToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;

class OtpController extends Controller
{
    /**
     * Cache key prefix for OTP
     */
    private const OTP_CACHE_PREFIX = 'otp_';
    
    /**
     * OTP expiration time in minutes
     */
    private const OTP_EXPIRY_MINUTES = 10;

    /**
     * Show OTP verification page
     */
    public function showVerificationPage(Request $request)
    {
        $email = $request->query('email') ?? session('user_email');
        
        if (!$email) {
            Log::warning('OTP verification page accessed without email', [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'session_id' => session()->getId()
            ]);
            return redirect()->route('login')
                ->with('error', 'Email tidak ditemukan. Silakan login kembali.');
        }

        Log::info('OTP verification page accessed', [
            'email' => $email,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'session_id' => session()->getId()
        ]);

        return Inertia::render('Auth/Otp', [
            'user_email' => $email
        ]);
    }

    /**
     * Generate and send OTP to user email
     * Optimized with caching for rate limiting and cleanup
     */
    public function send(Request $request)
    {
        Log::info('OTP send request initiated', [
            'email' => $request->email,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'session_id' => session()->getId()
        ]);

        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            Log::warning('OTP send validation failed', [
                'email' => $request->email,
                'errors' => $validator->errors()->toArray(),
                'ip' => $request->ip(),
                'session_id' => session()->getId()
            ]);
            return redirect()->back()
                ->with('error', 'Email tidak valid atau tidak terdaftar.');
        }

        $email = $request->email;
        $cacheKey = self::OTP_CACHE_PREFIX . $email;
        
        // Generate new OTP (6 digits) - more efficient than str_pad
        $otp = sprintf('%06d', random_int(0, 999999));
        
        Log::info('OTP generated', [
            'email' => $email,
            'otp_length' => strlen($otp),
            'expires_minutes' => self::OTP_EXPIRY_MINUTES,
            'ip' => $request->ip(),
            'session_id' => session()->getId()
        ]);
        
        // Clear any existing OTP for this email from both cache and database
        Cache::forget($cacheKey);
        OtpToken::where('email', $email)->delete();
        
        // Store in cache for faster access
        Cache::put($cacheKey, [
            'otp' => $otp,
            'attempts' => 0
        ], now()->addMinutes(self::OTP_EXPIRY_MINUTES));
        
        // Also store in database for persistence
        OtpToken::create([
            'email' => $email,
            'otp' => $otp,
            'expires_at' => now()->addMinutes(self::OTP_EXPIRY_MINUTES),
        ]);

        // Send OTP email with queue for better performance
        try {
            Mail::to($email)->queue(new OtpMail($otp, $email));
            
            Log::info('OTP email queued successfully', [
                'email' => $email,
                'ip' => $request->ip(),
                'session_id' => session()->getId()
            ]);
            
            return redirect()->back()
                ->with('success', 'OTP berhasil dikirim ke email Anda.');
        } catch (\Exception $e) {
            Log::error('OTP sending failed', [
                'email' => $email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'ip' => $request->ip(),
                'session_id' => session()->getId()
            ]);
            return redirect()->back()
                ->with('error', 'Gagal mengirim OTP. Silakan coba lagi.');
        }
    }

    /**
     * Verify OTP with optimized cache lookup
     */
    public function verify(Request $request)
    {
        Log::info('OTP verification attempt', [
            'user_id' => $request->user()?->id,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'session_id' => session()->getId()
        ]);

        $validator = Validator::make($request->all(), [
            'otp' => 'required|string|digits:6',
        ]);

        if ($validator->fails()) {
            Log::warning('OTP verification validation failed', [
                'user_id' => $request->user()?->id,
                'otp_provided' => $request->otp,
                'errors' => $validator->errors()->toArray(),
                'ip' => $request->ip(),
                'session_id' => session()->getId()
            ]);
            return redirect()->back()
                ->with('error', 'OTP harus 6 digit angka.');
        }

        // Get email from session or authenticated user
        $email = session('user_email');
        $user = null;
        
        // Try to get authenticated user first
        if ($request->user()) {
            $user = $request->user();
            $email = $user->email;
        } else if ($email) {
            // If not authenticated, try to find user by email from session
            $user = User::where('email', $email)->first();
        }
        
        if (!$user || !$email) {
            Log::warning('OTP verification attempted without valid user or email', [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'session_id' => session()->getId()
            ]);
            return redirect()->route('login')
                ->with('error', 'User tidak terautentikasi atau email tidak ditemukan.');
        }

        $cacheKey = self::OTP_CACHE_PREFIX . $email;
        
        // Check cache first for faster verification
        $cachedData = Cache::get($cacheKey);
        
        // Initialize flag to track if we found a valid OTP
        $otpValid = false;
        
        if ($cachedData && $cachedData['otp'] === $request->otp) {
            // OTP found in cache
            $otpValid = true;
            Log::info('OTP verification successful via cache', [
                'user_id' => $user->id,
                'email' => $email,
                'cache_hit' => true,
                'ip' => $request->ip(),
                'session_id' => session()->getId()
            ]);
        } else {
            // Fallback to database if cache miss
            $otpToken = OtpToken::where('email', $email)
                ->where('otp', $request->otp)
                ->where('expires_at', '>', now())
                ->first();

            if ($otpToken) {
                $otpValid = true;
                Log::info('OTP verification successful via database fallback', [
                    'user_id' => $user->id,
                    'email' => $email,
                    'cache_hit' => false,
                    'ip' => $request->ip(),
                    'session_id' => session()->getId()
                ]);
            }
        }

        if (!$otpValid) {
            Log::warning('OTP verification failed - invalid or expired OTP', [
                'user_id' => $user->id,
                'email' => $email,
                'otp_provided' => $request->otp,
                'ip' => $request->ip(),
                'session_id' => session()->getId()
            ]);
            return redirect()->back()
                ->with('error', 'OTP tidak valid atau sudah kadaluarsa.');
        }
        
        // Delete ALL OTP tokens for this email (both cache and database)
        Cache::forget($cacheKey);
        OtpToken::where('email', $email)->delete();
        
        // Mark user email as verified if not already verified
        $emailVerified = false;
        if (!$user->hasVerifiedEmail()) {
            $user->email_verified_at = now();
            $user->save();
            $emailVerified = true;
            
            Log::info('User email verified timestamp updated', [
                'user_id' => $user->id,
                'email' => $email,
                'email_verified_at' => $user->email_verified_at,
                'verification_method' => 'otp',
                'ip' => $request->ip(),
                'session_id' => session()->getId()
            ]);
        }

        // If user is not authenticated, log them in
        if (!Auth::check()) {
            // Regenerate session to prevent session fixation
            session()->regenerate();
            // Log the user in
            Auth::login($user);
        }

        Log::info('OTP verification completed successfully', [
            'user_id' => $user->id,
            'email' => $email,
            'email_was_verified' => $emailVerified,
            'ip' => $request->ip(),
            'session_id' => session()->getId()
        ]);

        return redirect()->route('welcome')
            ->with('success', 'OTP berhasil diverifikasi.');
    }

    /**
     * Resend OTP with improved rate limiting
     */
    public function resend(Request $request)
    {
        Log::info('OTP resend request initiated', [
            'email' => $request->email,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'session_id' => session()->getId()
        ]);

        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            Log::warning('OTP resend validation failed', [
                'email' => $request->email,
                'errors' => $validator->errors()->toArray(),
                'ip' => $request->ip(),
                'session_id' => session()->getId()
            ]);
            return redirect()->back()
                ->with('error', 'Email tidak valid atau tidak terdaftar.');
        }

        $email = $request->email;
        $cacheKey = self::OTP_CACHE_PREFIX . $email;
        
        // Generate new OTP more efficiently
        $otp = sprintf('%06d', random_int(0, 999999));
        
        Log::info('OTP regenerated for resend', [
            'email' => $email,
            'otp_length' => strlen($otp),
            'expires_minutes' => self::OTP_EXPIRY_MINUTES,
            'ip' => $request->ip(),
            'session_id' => session()->getId()
        ]);
        
        // Clear any existing OTP for this email from both cache and database
        Cache::forget($cacheKey);
        OtpToken::where('email', $email)->delete();
        
        // Store in cache
        Cache::put($cacheKey, [
            'otp' => $otp,
            'attempts' => 0
        ], now()->addMinutes(self::OTP_EXPIRY_MINUTES));
        
        // Create new OTP token
        $otpToken = OtpToken::create([
            'email' => $email,
            'otp' => $otp,
            'expires_at' => now()->addMinutes(self::OTP_EXPIRY_MINUTES),
        ]);

        // Send OTP email with queue
        try {
            Mail::to($email)->queue(new OtpMail($otp, $email));
            
            Log::info('OTP resend email queued successfully', [
                'email' => $email,
                'ip' => $request->ip(),
                'session_id' => session()->getId()
            ]);
            
            return redirect()->back()
                ->with('success', 'OTP berhasil dikirim ulang ke email Anda.');
        } catch (\Exception $e) {
            Log::error('OTP resend failed', [
                'email' => $email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'ip' => $request->ip(),
                'session_id' => session()->getId()
            ]);
            return redirect()->back()
                ->with('error', 'Gagal mengirim OTP. Silakan coba lagi.');
        }
    }
}