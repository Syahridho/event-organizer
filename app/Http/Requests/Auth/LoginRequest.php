<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\Rule|array|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();
        
        Log::info('Attempting authentication', [
            'email' => $this->input('email'),
            'remember' => $this->boolean('remember')
        ]);

        if (! Auth::attempt($this->only('email', 'password'), $this->boolean('remember'))) {
            Log::warning('Authentication failed', [
                'email' => $this->input('email'),
                'ip' => $this->ip(),
                'reason' => 'invalid_credentials'
            ]);
            
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => 'Email atau password yang Anda masukkan salah.',
            ]);
        }

        // Check if user is banned
        $user = Auth::user();
        if ($user && $user->is_banned) {
            Log::warning('Authentication failed - user banned', [
                'user_id' => $user->id,
                'email' => $user->email,
                'ip' => $this->ip()
            ]);
            
            Auth::logout();
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => 'Akun Anda telah diblokir. Hubungi admin untuk informasi lebih lanjut.',
            ]);
        }
        
        Log::info('Authentication successful', [
            'user_id' => $user->id,
            'email' => $user->email
        ]);

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => 'Terlalu banyak percobaan login. Silakan coba lagi dalam ' . ceil($seconds / 60) . ' menit.',
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->input('email')).'|'.$this->ip());
    }
}
