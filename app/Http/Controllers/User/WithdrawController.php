<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Withdraw;
use App\Models\User;
use App\Models\Wallet;
use App\Notifications\WithdrawalRequestedNotification;

class WithdrawController extends Controller
{
    /**
     * Submit a withdrawal request for the authenticated user.
     *
     * Validates inputs, ensures wallet balance suffices, and creates a pending
     * Withdraw record atomically. Sends notifications to admin and user.
     */
    public function store(Request $request)
    {
        // Normalize amount to pure numeric (supports "16.000" -> 16000, "16,000" -> 16000)
        $rawAmount = $request->input('amount');
        if ($rawAmount !== null) {
            $normalizedAmount = (float) preg_replace('/[^\d]/', '', (string) $rawAmount);
            $request->merge(['amount' => $normalizedAmount]);
        }

        // 1. Validate user input
        $request->validate([
            'amount' => 'required|numeric|min:10000',
            'method' => 'required|string',
            'account_holder_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:255',
            'other_method' => 'nullable|string|max:255',
        ]);

        // 2. Check current wallet balance prior to submitting (robust: always resolve wallet)
        $user = Auth::user();
        $wallet = Wallet::firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0]
        );

        $amount = (float) $request->input('amount');
        $balance = (float) $wallet->balance;

        if ($balance < $amount) {
            return redirect()->back()->withErrors([
                'amount' => 'Saldo Anda tidak mencukupi untuk melakukan penarikan.',
            ]);
        }

        // 3. Atomic create of withdraw request and notifications
        DB::beginTransaction();

        try {
            $withdraw = new Withdraw();
            $withdraw->user_id = $user->id;
            // Save sanitized numeric amount to ensure consistency (e.g., "16.000" -> 16000)
            $withdraw->amount = $amount;
            $withdraw->method = ($request->method === 'lainnya' && $request->has('other_method'))
                ? $request->other_method
                : $request->method;
            $withdraw->account_holder_name = $request->account_holder_name;
            $withdraw->account_number = $request->account_number;
            $withdraw->status = 'pending';
            $withdraw->save();

            // Notify admin of new request
            $adminUser = User::where('role', 'admin')->first();
            if ($adminUser) {
                $adminUser->notify(new WithdrawalRequestedNotification($withdraw, true));
            }

            // Notify user confirmation of submission
            $user->notify(new WithdrawalRequestedNotification($withdraw, false));

            DB::commit();

            return redirect()->back()->with('success', 'Permintaan penarikan berhasil diajukan. Kami akan segera memprosesnya.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Terjadi kesalahan saat memproses permintaan penarikan.');
        }
    }
}