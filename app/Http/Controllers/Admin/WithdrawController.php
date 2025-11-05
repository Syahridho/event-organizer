<?php

namespace App\Http\Controllers\Admin;

use Inertia\Inertia;
use App\Models\Withdraw;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\WalletTransaction;
use App\Notifications\WithdrawalRequestedNotification;
use App\Notifications\WithdrawalStatusNotification;

class WithdrawController extends Controller
{
    public function index(Request $request)
    {
        // Ambil status dari permintaan (default: 'pending')
        $filterStatus = $request->input('status', 'pending');

        // Bangun query berdasarkan filter status
        $query = Withdraw::with('user');

        if ($filterStatus !== 'all') {
            $query->where('status', $filterStatus);
        }
        
        $withdrawals = $query->latest()->get();

        // Kirim data dan status filter ke tampilan Inertia
        return Inertia::render('Admin/Withdraw/Index', [
            'withdrawals' => $withdrawals,
            'filters' => ['status' => $filterStatus],
        ]);
    }

    /**
     * Mark a withdraw request as completed and deduct the amount.
     * This method is intended for the admin.
     */
    public function markAsCompleted(Request $request, $id)
    {
        // Validasi input, termasuk file
        $request->validate([
            'proof' => 'required|image|max:2048', 
        ]);

        DB::beginTransaction();
        try {
            $withdraw = Withdraw::findOrFail($id);
            $user = $withdraw->user;
            $wallet = $user->wallet;
            
            if (!$wallet || $wallet->balance < $withdraw->amount) {
                DB::rollBack();
                return redirect()->back()->with('error', 'Saldo pengguna tidak mencukupi untuk penarikan ini.');
            }
            
            if ($withdraw->status === 'pending') {
                $withdraw->status = 'completed';
                
                // Simpan file bukti transfer jika ada
                if ($request->hasFile('proof')) {
                    $filePath = $request->file('proof')->store('proofs', 'public');
                    $withdraw->proof = $filePath;
                }

                $withdraw->save();

                $wallet->balance -= $withdraw->amount;
                $wallet->save();

                // Log wallet transaction as DEBIT referencing this withdrawal
                WalletTransaction::create([
                    'wallet_id'      => $wallet->id,
                    'user_id'        => $user->id,
                    'amount'         => $withdraw->amount,
                    'type'           => 'DEBIT',
                    'reference_type' => 'withdraw',
                    'reference_id'   => $withdraw->id,
                    'description'    => 'Withdrawal completed #' . $withdraw->id,
                ]);

                $user->notify(new WithdrawalStatusNotification($withdraw, 'completed'));
                
                DB::commit();
                return redirect()->back()->with('success', 'Permintaan penarikan berhasil disetujui.');
            }

            DB::rollBack();
            return redirect()->back()->with('error', 'Permintaan penarikan ini sudah diproses.');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Terjadi kesalahan saat memproses permintaan penarikan.');
        }
    }

    /**
     * Mark a withdraw request as rejected and does nothing to the balance.
     * This method is intended for the admin.
     */
    public function markAsRejected($id)
    {
        $withdraw = Withdraw::findOrFail($id);
        
        // Memeriksa status saat ini
        if ($withdraw->status === 'pending') {
            $withdraw->status = 'rejected';
            $withdraw->save();
            
            // Perbaikan: Tidak ada pengembalian saldo karena saldo belum dikurangi
            
            return redirect()->back()->with('success', 'Permintaan penarikan berhasil ditolak.');
        }

        return redirect()->back()->with('error', 'Permintaan penarikan ini sudah diproses.');
    }
}
