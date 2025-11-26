<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Auth\OtpController;
use App\Mail\OtpMail;
use Illuminate\Support\Facades\Mail;
use App\Models\User;
use App\Models\OtpToken;
use App\Providers\RouteServiceProvider;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{   
    /**
     * OTP expiration time in minutes
     */
    private const OTP_EXPIRY_MINUTES = 10;

    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|alpha_num|unique:'.User::class,
            'email' => 'required|string|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'uuid' => Str::uuid(),
            'last_seen_at' => now(),
        ]);

        // Send OTP for email verification
        try {
            $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            OtpToken::create([
                'email' => $request->email,
                'otp' => $otp,
                'expires_at' => now()->addMinutes(self::OTP_EXPIRY_MINUTES),
            ]);
            Mail::to($request->email)->queue(new OtpMail($otp, $request->email));
        } catch (\Exception $e) {
            // Log error but continue with registration
            \Log::error('Failed to send OTP after registration: ' . $e->getMessage());
        }

        // Store email in session for OTP page
        session(['user_email' => $request->email]);

        // Redirect to OTP verification page instead of logging in directly
        return redirect()->route('otp.verify.page', ['email' => $request->email])
            ->with('success', 'Registrasi berhasil! Silakan periksa email Anda untuk kode OTP.');
    }
}
