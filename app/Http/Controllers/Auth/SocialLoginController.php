<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialLoginController extends Controller
{
    /**
     * Redirect to Google OAuth
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle Google callback
     */
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Exception $e) {
            return redirect('/login')->withErrors(['msg' => 'Google login failed: ' . $e->getMessage()]);
        }

        // Check if user already exists by google_id
        $user = User::where('google_id', $googleUser->getId())->first();

        // If not, check by email (existing user without google_id)
        if (!$user) {
            $user = User::where('email', $googleUser->getEmail())->first();
            if ($user) {
                // Update existing user with google_id
                $user->google_id = $googleUser->getId();
                $user->save();
            } else {
                // Create new user
                $user = User::create([
                    'uuid' => (string) Str::uuid(),
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'email_verified_at' => now(),
                    'password' => null,
                    'username' => $this->generateUsername($googleUser->getEmail()),
                ]);
            }
        }

        // Log the user in
        Auth::login($user, true);

        return redirect()->intended('/');
    }

    /**
     * Generate a unique username from email
     */
    private function generateUsername($email)
    {
        $base = strtolower(explode('@', $email)[0]);
        $username = $base;
        $counter = 1;

        while (User::where('username', $username)->exists()) {
            $username = $base . $counter;
            $counter++;
        }

        return $username;
    }
}