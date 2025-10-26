<?php

namespace App\Http\Controllers\Mitra;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\TransactionItem;
use App\Models\Service;
use App\Models\Building;
use App\Models\Wallet;
use App\Models\RentProperty;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use App\Services\WalletService;
use Illuminate\Support\Facades\DB;

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
            RentProperty::class,
        ];

        // Robust direct filter by item_type and owned item ids to include legacy aliases
        $serviceIds = Service::where('user_id', $user->id)->pluck('id');
        $buildingIds = Building::where('user_id', $user->id)->pluck('id');
        $rentPropertyIds = RentProperty::where('user_id', $user->id)->pluck('id');

        $transactionItems = TransactionItem::query()
            ->where(function ($q) use ($serviceIds, $buildingIds, $rentPropertyIds) {
                $q->where(function ($qq) use ($serviceIds) {
                    $qq->where('item_type', 'service')->whereIn('item_id', $serviceIds);
                })->orWhere(function ($qq) use ($buildingIds) {
                    $qq->where('item_type', 'building')->whereIn('item_id', $buildingIds);
                })->orWhere(function ($qq) use ($rentPropertyIds) {
                    // Support multiple legacy morph-type storage values
                    $qq->whereIn('item_type', ['rent_property', 'property', 'App\\Models\\RentProperty'])
                       ->whereIn('item_id', $rentPropertyIds);
                });
            })
            ->whereHas('transaction', function ($q) {
                $q->where('status', 'settlement');
            })
            ->orWhere(function ($q) use ($rentPropertyIds) {
                $q->whereIn('item_type', ['rent_property', 'property', 'App\\Models\\RentProperty'])
                  ->whereIn('item_id', $rentPropertyIds)
                  ->whereHas('transaction', function ($qq) {
                      $qq->where('status', 'pending');
                  });
            })
            ->with([
                'transaction',
                'transaction.user',
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
        // Validasi: fee boleh null, tapi jika ada, harus angka >= 0
        $request->validate([
            'deliveryFee' => 'nullable|numeric|min:0',
        ]);



        // Hindari kegagalan whereHasMorph akibat inkonsistensi alias/class di item_type
        $transactionItem = TransactionItem::with('item', 'transaction')->findOrFail($transactionItemId);

        $type = $transactionItem->item_type;
        $userId = auth()->id();
        $owns = false;

        if (in_array($type, ['service', Service::class, 'App\\Models\\Service'])) {
            $owns = Service::where('id', $transactionItem->item_id)
                ->where('user_id', $userId)
                ->exists();
        } elseif (in_array($type, ['building', Building::class, 'App\\Models\\Building'])) {
            $owns = Building::where('id', $transactionItem->item_id)
                ->where('user_id', $userId)
                ->exists();
        } elseif (in_array($type, ['rent_property', 'property', RentProperty::class, 'App\\Models\\RentProperty'])) {
            $owns = RentProperty::where('id', $transactionItem->item_id)
                ->where('user_id', $userId)
                ->exists();
        }

        if (!$owns) {
            abort(403, 'Anda tidak berhak mengonfirmasi item transaksi ini.');
        }

        // Normalisasi dan simpan delivery fee
        // Jika opsi adalah pickup, pastikan fee = 0
        $fee = 0;
        if ($transactionItem->delivery_option === 'delivery') {
            $feeInput = $request->input('deliveryFee'); // camelCase dari frontend
            // Ambil hanya digit dan cast ke integer
            $fee = is_null($feeInput) ? 0 : (int) preg_replace('/[^0-9]/', '', (string) $feeInput);
            $transactionItem->delivery_fee = $fee;

            // Tandai status fee jika kolomnya tersedia
            if (in_array('delivery_fee_status', $transactionItem->getFillable())) {
                $transactionItem->delivery_fee_status = 'submitted';
            }
        } else {
            $transactionItem->delivery_fee = 0;
        }

        // Update status item
        $transactionItem->status = 'confirmed';
        $transactionItem->save();

        return redirect()->back()->with('success', 'Item transaksi berhasil dikonfirmasi.');
    }

    // Fungsi baru untuk membatalkan item transaksi dengan alasan + refund ke dompet pembeli
    public function cancel(Request $request, TransactionItem $transactionItem, WalletService $walletService)
    {
        $request->validate([
            'note' => 'required|string|min:10',
        ], [
            'note.required' => 'Alasan pembatalan wajib diisi.',
            'note.min' => 'Alasan pembatalan harus memiliki minimal 10 karakter.',
        ]);

        // Pastikan item milik mitra yang login dan termasuk tipe yang dapat dibatalkan
        $transactionItem->loadMissing(['item', 'transaction.user']);

        if (
            !in_array($transactionItem->item_type, [Service::class, Building::class, RentProperty::class, 'service', 'building', 'rent_property']) ||
            ($transactionItem->item?->user_id !== Auth::id())
        ) {
            abort(403, 'Anda tidak berhak membatalkan item transaksi ini.');
        }

        try {
            DB::transaction(function () use ($request, $transactionItem, $walletService) {
                // Update status item ke cancelled dan simpan alasan
                $transactionItem->status = 'cancelled';
                $transactionItem->note_admin = $request->input('note');
                $transactionItem->save();

                // Kreditkan refund ke dompet pembeli
                $buyer = $transactionItem->transaction?->user;
                if (!$buyer) {
                    throw new \RuntimeException('Pembeli tidak ditemukan dalam transaksi.');
                }

                $walletService->creditRefund($buyer, $transactionItem);
            });

            return redirect()->back()->with('success', 'Item transaksi dibatalkan dan refund dikreditkan ke dompet pembeli.');
        } catch (\Throwable $e) {
            \Log::error('Gagal membatalkan item transaksi atau melakukan refund', [
                'transaction_item_id' => $transactionItem->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Gagal memproses pembatalan. Silakan coba lagi.');
        }
    }

    public function otw(Request $request, $transactionItemId)
    {
        $transactionItem = TransactionItem::where('id', $transactionItemId)
            ->whereHasMorph('item', [Service::class, Building::class, RentProperty::class], function ($query) {
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
            ->whereHasMorph('item', [Service::class, Building::class, RentProperty::class], function ($query) {
                $query->where('user_id', Auth::id());
            })->firstOrFail();

        // Tentukan status baru berdasarkan status saat ini
        if ($transactionItem->status === 'otw') {
            $transactionItem->status = 'work';
            $transactionItem->save();

            return redirect()->back()->with('success', 'Status transaksi berhasil diperbarui.');
        }

        return redirect()->back()->with('error', 'Transaksi tidak dapat diproses.');
    }

    
    public function complete(Request $request, $transactionItemId)
    {

        // Ambil item transaksi berdasarkan ID dan pastikan itu milik user yang login
        $transactionItem = TransactionItem::where('id', $transactionItemId)
            ->whereHasMorph('item', [Service::class, Building::class, RentProperty::class], function ($query) {
                $query->where('user_id', Auth::id());
            })->firstOrFail();
                // Tentukan status baru berdasarkan status saat ini
                if ($transactionItem->status === 'work' || ($transactionItem->item_type === 'building' && $transactionItem->status === 'confirmed' )) {
                    $transactionItem->status = 'completed';
        
                    // Ambil pengguna saat ini
                    $user = Auth::user();
        
                    // Cari atau buat dompet pengguna dengan algoritma yang lebih efisien
                    // Gunakan firstOrCreate untuk mencegah duplikasi dan operasi atomik
                    $wallet = Wallet::firstOrCreate(
                        ['user_id' => $user->id],
                        ['balance' => 0]
                    );
        
                    // Tambahkan harga item transaksi ke saldo dompet
                    $wallet->balance += $transactionItem->price;
        
                    // Simpan perubahan pada dompet
                    $wallet->save();
        
                    $transactionItem->save(); // Jangan lupakan untuk menyimpan status transaksi yang sudah diubah
                    
                    return redirect()->back()->with('success', 'Transaksi berhasil diselesaikan. Saldo Anda telah diperbarui.');
                } else {
                    return redirect()->back()->with('error', 'Transaksi tidak dapat diselesaikan.');
                }
    }
}
