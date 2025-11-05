<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        // Ensure wallet exists for the current user
        $wallet = \App\Models\Wallet::firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0]
        );

        // Fetch recent wallet transactions for the current user
        $transactions = \App\Models\WalletTransaction::where('user_id', $user->id)
            ->orderByDesc('id')
            ->limit(100)
            ->get()
            ->map(function ($tx) {
                return [
                    'id' => $tx->id,
                    'amount' => (float) $tx->amount,
                    'type' => $tx->type,
                    'description' => $tx->description,
                    'reference_type' => $tx->reference_type,
                    'reference_id' => $tx->reference_id,
                    'created_at' => $tx->created_at?->toDateTimeString(),
                ];
            });

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            // Wallet props so the embedded Wallet component syncs correctly
            'balance' => (float) $wallet->balance,
            'transactions' => $transactions,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $user->fill($request->validated());

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        // Handle profile photo upload
        if ($request->hasFile('profile_photo')) {
            // Delete old photo if exists
            if ($user->profile_photo) {
                Storage::disk('public')->delete($user->profile_photo);
            }

            // Store new photo
            $path = $request->file('profile_photo')->store('profile-photos', 'public');
            $user->profile_photo = $path;
        }

        $user->save();

        return Redirect::route('profile.edit')->with('status', 'profile-updated');
    }

    /**
     * Delete the user's profile photo.
     */
    public function destroyPhoto(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->profile_photo) {
            Storage::disk('public')->delete($user->profile_photo);
            $user->profile_photo = null;
            $user->save();
        }

        return Redirect::route('profile.edit')->with('status', 'photo-deleted');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    /**
     * Show user's wallet: current balance and transaction history.
     */
    public function wallet(Request $request): Response
    {
        $user = $request->user();

        // Ensure wallet exists
        $wallet = \App\Models\Wallet::firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0]
        );

        // Fetch recent transactions (latest first)
        $transactions = \App\Models\WalletTransaction::where('user_id', $user->id)
            ->orderByDesc('id')
            ->limit(100)
            ->get()
            ->map(function ($tx) {
                return [
                    'id' => $tx->id,
                    'amount' => (float) $tx->amount,
                    'type' => $tx->type,
                    'description' => $tx->description,
                    'reference_type' => $tx->reference_type,
                    'reference_id' => $tx->reference_id,
                    'created_at' => $tx->created_at?->toDateTimeString(),
                ];
            });

        return Inertia::render('Profile/Wallet', [
            'balance' => (float) $wallet->balance,
            'transactions' => $transactions,
        ]);
    }
}
