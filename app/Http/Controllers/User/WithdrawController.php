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

        // Menggunakan transaction untuk memastikan konsistensi data
        DB::beginTransaction();

        try {
            $user = Auth::user();
            
            // CRITICAL FIX: Gunakan lockForUpdate() untuk mencegah race condition
            // Ini akan mengunci row wallet sampai transaction selesai
            $wallet = Wallet::where('user_id', $user->id)
                ->lockForUpdate()
                ->first();

            // Jika wallet belum ada, buat dengan lock
            if (!$wallet) {
                $wallet = Wallet::create([
                    'user_id' => $user->id,
                    'balance' => 0
                ]);
            }

            // ALGORITMA TERCEPAT: Single aggregate query untuk hitung total pending withdrawals
            // O(1) time complexity - hanya 1 query dengan SUM aggregate
            // CRITICAL FIX: Tambahkan lockForUpdate() untuk mencegah race condition
            $pendingAmount = Withdraw::where('user_id', $user->id)
                ->where('status', 'pending')
                ->lockForUpdate()
                ->sum('amount');

            // Hitung saldo yang tersedia (saldo wallet - total pending)
            $availableBalance = $wallet->balance - $pendingAmount;

            $amount = (float) $request->input('amount');

            // Validasi 1: Cek apakah saldo tersedia cukup untuk penarikan baru
            if ($availableBalance < $amount) {
                DB::rollBack();
                
                $errorMessage = $pendingAmount > 0
                    ? "Saldo tersedia tidak mencukupi. Anda memiliki penarikan pending sebesar " . number_format($pendingAmount, 0, ',', '.') . ". Saldo tersedia: Rp " . number_format($availableBalance, 0, ',', '.')
                    : "Saldo Anda tidak mencukupi untuk melakukan penarikan.";
                
                return redirect()->back()->withErrors(['amount' => $errorMessage]);
            }

            // Validasi 2: Cek apakah total penarikan (pending + request baru) tidak melebihi saldo wallet
            $totalWithdrawalAmount = $pendingAmount + $amount;
            if ($totalWithdrawalAmount > $wallet->balance) {
                DB::rollBack();
                
                return redirect()->back()->withErrors([
                    'amount' => "Total penarikan (termasuk yang pending) melebihi saldo Anda. Saldo: Rp " . number_format($wallet->balance, 0, ',', '.') . ", Pending: Rp " . number_format($pendingAmount, 0, ',', '.') . ", Tersedia: Rp " . number_format($availableBalance, 0, ',', '.')
                ]);
            }

            // Buat dan simpan data penarikan hanya SATU KALI
            $withdraw = new Withdraw();
            $withdraw->user_id = $user->id;
            $withdraw->amount = $amount;
            $withdraw->method = ($request->method === 'lainnya' && $request->has('other_method')) ? $request->other_method : $request->method;
            $withdraw->account_holder_name = $request->account_holder_name;
            $withdraw->account_number = $request->account_number;
            $withdraw->status = 'pending';
            $withdraw->save();

            // PICU NOTIFIKASI
            // 1. Kirim notifikasi ke admin
            $adminUser = User::where('role', 'admin')->first();
            if ($adminUser) {
                $adminUser->notify(new WithdrawalRequestedNotification($withdraw, true));
            }

            // 2. Kirim notifikasi ke pengguna yang mengajukan penarikan
            $user->notify(new WithdrawalRequestedNotification($withdraw, false));

            // Commit transaction
            DB::commit();

            return redirect()->back()->with('success', 'Permintaan penarikan berhasil diajukan. Kami akan segera memprosesnya.');
        } catch (\Exception $e) {
            // Rollback transaction jika terjadi kesalahan
            DB::rollBack();

            return redirect()->back()->with('error', 'Terjadi kesalahan saat memproses permintaan penarikan.');
        }
    }
}