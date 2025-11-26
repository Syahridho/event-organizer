<?php

namespace App\Http\Controllers\Mitra;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Withdraw;
use App\Models\Wallet;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\User; // Import model User
use App\Notifications\WithdrawalRequestedNotification;

class WithDrawController extends Controller
{
    public function index()
    {
        // Dapatkan pengguna yang sedang login
        $user = Auth::user();

        // Pastikan user memiliki wallet, jika belum ada maka buat otomatis
        $wallet = Wallet::firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0]
        );

        // Ambil data riwayat penarikan milik pengguna
        $withdrawals = Withdraw::where('user_id', $user->id)
                                ->latest()
                                ->get();

        // ALGORITMA TERCEPAT: Hitung total pending withdrawals dengan single aggregate query
        $pendingAmount = Withdraw::where('user_id', $user->id)
            ->where('status', 'pending')
            ->sum('amount');

        // Hitung saldo tersedia
        $availableBalance = $wallet->balance - $pendingAmount;

        // Kirim data riwayat penarikan dan informasi saldo ke tampilan Inertia
        return Inertia::render('Mitra/Withdraw/Index', [
            'withdrawals' => $withdrawals,
            'walletBalance' => $wallet->balance,
            'pendingAmount' => $pendingAmount,
            'availableBalance' => $availableBalance,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     * This method now only creates the withdrawal request.
     */
    public function store(Request $request)
    {
        // 1. Validasi Input dari formulir
        $request->validate([
            'amount' => 'required|numeric|min:10000',
            'method' => 'required|string',
            'account_holder_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:255',
            'other_method' => 'nullable|string|max:255',
        ]);

        
        // Cek saldo di sini agar pengguna tahu saldo mereka tidak mencukupi saat mengajukan
        $user = Auth::user();
        
        // Pastikan user memiliki wallet, jika belum ada maka buat otomatis
        $wallet = Wallet::firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0]
        );

        // ALGORITMA TERCEPAT: Single aggregate query untuk hitung total pending withdrawals
        // O(1) time complexity - hanya 1 query dengan SUM aggregate
        $pendingAmount = Withdraw::where('user_id', $user->id)
            ->where('status', 'pending')
            ->sum('amount');

        // Hitung saldo yang tersedia (saldo wallet - total pending)
        $availableBalance = $wallet->balance - $pendingAmount;

        // Validasi 1: Cek apakah saldo tersedia cukup untuk penarikan baru
        if ($availableBalance < $request->amount) {
            $errorMessage = $pendingAmount > 0 
                ? "Saldo tersedia tidak mencukupi. Anda memiliki penarikan pending sebesar " . number_format($pendingAmount, 0, ',', '.') . ". Saldo tersedia: Rp " . number_format($availableBalance, 0, ',', '.')
                : "Saldo Anda tidak mencukupi untuk melakukan penarikan.";
            
            return redirect()->back()->withErrors(['amount' => $errorMessage]);
        }

        // Validasi 2: Cek apakah total penarikan (pending + request baru) tidak melebihi saldo wallet
        $totalWithdrawalAmount = $pendingAmount + $request->amount;
        if ($totalWithdrawalAmount > $wallet->balance) {
            return redirect()->back()->withErrors([
                'amount' => "Total penarikan (termasuk yang pending) melebihi saldo Anda. Saldo: Rp " . number_format($wallet->balance, 0, ',', '.') . ", Pending: Rp " . number_format($pendingAmount, 0, ',', '.') . ", Tersedia: Rp " . number_format($availableBalance, 0, ',', '.')
            ]);
        }

        // Menggunakan transaction untuk memastikan konsistensi data
        DB::beginTransaction();

        try {
            // --- KODE YANG SUDAH DIPERBAIKI ---
            // Buat dan simpan data penarikan hanya SATU KALI
            $withdraw = new Withdraw();
            $withdraw->user_id = $user->id;
            $withdraw->amount = $request->amount;
            $withdraw->method = ($request->method === 'lainnya' && $request->has('other_method')) ? $request->other_method : $request->method;
            $withdraw->account_holder_name = $request->account_holder_name;
            $withdraw->account_number = $request->account_number;
            $withdraw->status = 'pending'; // Status awal penarikan adalah 'pending'
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
    
    public function cancel($id)
    {
        DB::beginTransaction();
        try {
            $withdraw = Withdraw::findOrFail($id);

            // Periksa izin pengguna
            if ($withdraw->user_id !== Auth::id()) {
                DB::rollBack();
                return redirect()->back()->with('error', 'Anda tidak memiliki izin untuk membatalkan permintaan ini.');
            }
            
            // Batalkan hanya jika statusnya masih 'pending'
            if ($withdraw->status === 'pending') {
                $withdraw->status = 'cancelled';
                $withdraw->save();

                // *** CATATAN: KODE UNTUK MENGEMBALIKAN SALDO DIHAPUS ***
                // Saldo tidak perlu dikembalikan karena belum dikurangi saat pengajuan.
                
                DB::commit();
                return redirect()->back()->with('success', 'Permintaan penarikan berhasil dibatalkan.');
            }

            DB::rollBack();
            return redirect()->back()->with('error', 'Permintaan penarikan ini tidak dapat dibatalkan.');
            
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Terjadi kesalahan saat membatalkan permintaan penarikan.');
        }
    }
}