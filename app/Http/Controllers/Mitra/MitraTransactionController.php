<?php

namespace App\Http\Controllers\Mitra;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\TransactionItem;
use App\Models\Service;
use App\Models\Building;
use App\Models\RentProperties;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;

class MitraTransactionController extends Controller
{
    public function index()
    {
        // Ambil pengguna yang sedang login
        $user = Auth::user();

        // Tentukan model-model yang relevan untuk relasi polimorfik
        $itemModels = [
            Service::class,
            Building::class,
            RentProperties::class,
        ];

        // Buat query yang mengambil TransactionItem berdasarkan user_id dari item terkait
        $transactionItems = TransactionItem::whereHasMorph(
            'item', // Nama relasi polimorfik di model TransactionItem
            $itemModels, // Array dari model yang mungkin
            function ($query) use ($user) {
                $query->where('user_id', $user->id);
            }
        )
        ->with([
            'transaction',
            'transaction.items',
            'transaction.address',
            'item'
        ])
        ->latest()
        ->get();

        return Inertia::render('Mitra/Transactions/Index', [
            'transactionItems' => $transactionItems,
        ]);
    }

    // Fungsi baru untuk mengonfirmasi item transaksi
    public function confirm(Request $request, $transactionItemId)
    {
        $transactionItem = TransactionItem::where('id', $transactionItemId)
            ->whereHasMorph('item', [Service::class, Building::class, RentProperties::class], function ($query) {
                $query->where('user_id', auth()->id());
            })->firstOrFail();

        $transactionItem->status = 'confirmed';
        $transactionItem->save();

        return redirect()->back()->with('success', 'Item transaksi berhasil dikonfirmasi.');
    }

    // Fungsi baru untuk membatalkan item transaksi dengan alasan
    public function cancel(Request $request, $transactionItemId)
    {
        $request->validate([
            'note' => 'required|string|min:10',
        ], [
            'note.required' => 'Alasan pembatalan wajib diisi.',
            'note.min' => 'Alasan pembatalan harus memiliki minimal 10 karakter.',
        ]);

        $transactionItem = TransactionItem::where('id', $transactionItemId)
            ->whereHasMorph('item', [Service::class, Building::class, RentProperties::class], function ($query) {
                $query->where('user_id', auth()->id());
            })->firstOrFail();

        $transactionItem->status = 'cancel';
        $transactionItem->note_admin = $request->input('note');
        $transactionItem->save();

        return redirect()->back()->with('success', 'Item transaksi berhasil dibatalkan.');
    }

    public function otw(Request $request, $transactionItemId)
    {
        $transactionItem = TransactionItem::where('id', $transactionItemId)
            ->whereHasMorph('item', [Service::class, Building::class, RentProperties::class], function ($query) {
                $query->where('user_id', auth()->id());
            })->firstOrFail();

        // Periksa status sebelum memperbarui
        if ($transactionItem->status === 'confirmed') {
            $transactionItem->status = 'otw'; // Atau nama status 'otw'
            $transactionItem->save();

            return redirect()->back()->with('success', 'Status transaksi berhasil diubah menjadi OTW.');
        }

        return redirect()->back()->with('error', 'Transaksi tidak dapat diubah menjadi OTW.');
    }

     public function work(Request $request, $transactionItemId)
    {
        // Ambil item transaksi berdasarkan ID dan pastikan itu milik user yang login
        $transactionItem = TransactionItem::where('id', $transactionItemId)
            ->whereHasMorph('item', [Service::class, Building::class, RentProperties::class], function ($query) {
                $query->where('user_id', Auth::id());
            })->firstOrFail();

        // Tentukan status baru berdasarkan status saat ini
        switch ($transactionItem->status) {
            case 'otw':
                $transactionItem->status = 'work'; 
                break;
            
            default:
                return redirect()->back()->with('error', 'Transaksi tidak dapat diproses.');
        }

        $transactionItem->save();

        return redirect()->back()->with('success', 'Status transaksi berhasil diperbarui.');
    }

    
    public function complete(Request $request, $transactionItemId)
    {
        
        // Ambil item transaksi berdasarkan ID dan pastikan itu milik user yang login
        $transactionItem = TransactionItem::where('id', $transactionItemId)
            ->whereHasMorph('item', [Service::class, Building::class, RentProperties::class], function ($query) {
                $query->where('user_id', Auth::id());
            })->firstOrFail();

        // Tentukan status baru berdasarkan status saat ini
        switch ($transactionItem->status) {
            case 'work':
                $transactionItem->status = 'completed';
        
                // Ambil pengguna saat ini
                $user = Auth::user();
        
                // Cari atau buat dompet pengguna
                $wallet = $user->wallet;
                
                // Perbaikan: Jika dompet null, buat yang baru
                if (is_null($wallet)) {
                    $wallet = new \App\Models\Wallet();
                    $wallet->user_id = $user->id;
                    $wallet->balance = 0; // Atur saldo awal
                }
        
                // Tambahkan harga item transaksi ke saldo dompet
                $wallet->balance += $transactionItem->price;
        
                // Simpan perubahan pada dompet
                $wallet->save();
                
                $transactionItem->save(); // Jangan lupakan untuk menyimpan status transaksi yang sudah diubah
                
                return redirect()->back()->with('success', 'Transaksi berhasil diselesaikan. Saldo Anda telah diperbarui.');
        
                break;
            
            default:
                return redirect()->back()->with('error', 'Transaksi tidak dapat diselesaikan.');
        }

        $transactionItem->save();

        return redirect()->back()->with('success', 'Status transaksi berhasil diselesaikan dan saldo dompet diperbarui.');
    }
}