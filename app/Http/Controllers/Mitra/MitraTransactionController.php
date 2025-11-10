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
use Illuminate\Support\Facades\Log;

class MitraTransactionController extends Controller
{
    public function index()
    {
        // Ambil pengguna yang sedang login
        $user = Auth::user();
        
        // Ambil ID item yang dimiliki oleh user untuk filtering kepemilikan
        $serviceIds = Service::where('user_id', $user->id)->pluck('id');
        $buildingIds = Building::where('user_id', $user->id)->pluck('id');
        $rentPropertyIds = RentProperty::where('user_id', $user->id)->pluck('id');
        
        // Sub-query untuk mendapatkan status transaksi Delivery Fee (sinkron dengan transaksi DEL-ORD terpisah)
        $deliveryFeeStatusSubquery = DB::table('transaction_items as tf')
            // Hanya ambil baris biaya antar
            ->where('tf.type', 'Delivery Fee')
            // Gabung ke transaksi untuk baca status
            ->join('transactions as t', 'tf.transaction_id', '=', 't.id')
            // Sinkronisasi berdasarkan item yang sama
            ->whereColumn('tf.item_id', 'transaction_items.item_id')
            ->whereColumn('tf.item_type', 'transaction_items.item_type')
            // Selaraskan hari sewa, termasuk kasus keduanya null
            ->where(function ($q) {
                $q->whereColumn('tf.rent_days', 'transaction_items.rent_days')
                  ->orWhere(function ($qq) {
                      $qq->whereNull('tf.rent_days')
                         ->whereNull('transaction_items.rent_days');
                  });
            })
            // Ambil status transaksi (terbaru)
            ->select('t.status')
            ->orderByDesc('t.updated_at')
            ->orderByDesc('tf.id')
            ->limit(1);
        
        $transactionItems = TransactionItem::query()
            // Melampirkan status pembayaran biaya antar ke item utama
            ->addSelect(['delivery_fee_payment_status' => $deliveryFeeStatusSubquery])
            
            // Filter item yang BUKAN 'Delivery Fee' secara GLOBAL
            ->where('type', '!=', 'Delivery Fee')
            
            // Membungkus semua klausa OR untuk filtering kepemilikan
            ->where(function ($query) use ($serviceIds, $buildingIds, $rentPropertyIds) {
                
                // --- KLAUSA A: Service, Building, RentProperty DENGAN Status Settlement ---
                $query->where(function ($q) use ($serviceIds, $buildingIds, $rentPropertyIds) {
                    
                    // Logika Kepemilikan (Service, Building, RentProperty)
                    $q->where(function ($qq) use ($serviceIds) {
                        $qq->where('item_type', 'service')->whereIn('item_id', $serviceIds);
                    })->orWhere(function ($qq) use ($buildingIds) {
                        $qq->where('item_type', 'building')->whereIn('item_id', $buildingIds);
                    })->orWhere(function ($qq) use ($rentPropertyIds) {
                        // Menggunakan whereIn untuk mencakup semua kemungkinan item_type RentProperty
                        $qq->whereIn('item_type', ['rent_property', 'property', 'App\\Models\\RentProperty'])
                            ->whereIn('item_id', $rentPropertyIds);
                    })
                    // WAJIB: Item-item ini harus memiliki status transaksi 'settlement' (lunas)
                    ->whereHas('transaction', function ($qqq) {
                        $qqq->where('status', 'settlement');
                    });
                })
                
                // --- KLAUSA B: OR Kondisi untuk RentProperty Status Pending ---
                ->orWhere(function ($q) use ($rentPropertyIds) { 
                    // Item harus berupa RentProperty dan dimiliki Mitra
                    $q->whereIn('item_type', ['rent_property', 'property', 'App\\Models\\RentProperty'])
                      ->whereIn('item_id', $rentPropertyIds)
                      // Status transaksinya harus 'pending' (masih menunggu pembayaran)
                      ->whereHas('transaction', function ($qq) {
                          $qq->where('status', 'pending');
                      });
                });
                
            }) // <-- Akhir Blok WHERE utama
            
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
        try {
            // 1. VALIDASI DATA MASUK
            $request->validate([
                'deliveryFee' => 'nullable|numeric|min:0',
            ]);

            // 2. AMBIL ITEM TRANSAKSI & CEK KEPEMILIKAN
            $transactionItem = TransactionItem::with('item', 'transaction')->findOrFail($transactionItemId);

            $type = $transactionItem->item_type;
            $userId = auth()->id();
            $owns = false;

            // Logika Kepemilikan (Memastikan Mitra memiliki item yang dikonfirmasi)
            if (in_array($type, ['service', Service::class, 'App\\Models\\Service'])) {
                $owns = Service::where('id', $transactionItem->item_id)->where('user_id', $userId)->exists();
            } elseif (in_array($type, ['building', Building::class, 'App\\Models\\Building'])) {
                $owns = Building::where('id', $transactionItem->item_id)->where('user_id', $userId)->exists();
            } elseif (in_array($type, ['rent_property', 'property', RentProperty::class, 'App\\Models\\RentProperty'])) {
                $owns = RentProperty::where('id', $transactionItem->item_id)->where('user_id', $userId)->exists();
            }

            if (!$owns) {
                // Hentikan eksekusi jika tidak memiliki item
                abort(403, 'Anda tidak berhak mengonfirmasi item transaksi ini.');
            }

            // 3. LOGIKA DELIVERY FEE (Normalisasi dan Simpan)
            $fee = 0;
            if ($transactionItem->delivery_type === 'delivery') {
                $feeInput = $request->input('deliveryFee'); 
                // Mengambil digit dan cast ke integer
                $fee = is_null($feeInput) ? 0 : (int) preg_replace('/[^0-9]/', '', (string) $feeInput);
                
                $transactionItem->delivery_fee = $fee;

                // Tandai status fee
                // Periksa apakah kolom delivery_fee_status ada di fillable model
                if (in_array('delivery_fee_status', $transactionItem->getFillable())) {
                    $transactionItem->delivery_fee_status = 'submitted';
                }
            } else {
                // Untuk pickup, biaya antar harus 0
                $transactionItem->delivery_fee = 0;
            }

            // 4. UPDATE STATUS DAN SIMPAN
            $transactionItem->status = 'confirmed';
            $transactionItem->save();

            // 5. NOTIFIKASI PEMBELI - ITEM DIKONFIRMASI
            $buyer = $transactionItem->transaction?->user;
            if ($buyer) {
                $itemName = $transactionItem->item->name ?? $transactionItem->type ?? 'Item';
                $buyer->notify(new \App\Notifications\PaymentStatusNotification(
                    'Pesanan dikonfirmasi',
                    'Mitra telah mengonfirmasi pesanan untuk ' . $itemName . '.',
                    [
                        'type' => 'item_confirmed',
                        'status' => 'confirmed',
                        'order_id' => $transactionItem->transaction?->order_id,
                        'amount' => ($transactionItem->price * (int)($transactionItem->qty ?? 1)),
                        'role' => 'user',
                        'items' => [[
                            'item_type' => $transactionItem->item_type,
                            'item_id' => $transactionItem->item_id,
                            'name' => $itemName,
                            'qty' => (int)($transactionItem->qty ?? 1),
                            'price' => $transactionItem->price
                        ]],
                        'delivery_type' => $transactionItem->delivery_type,
                        'delivery_fee' => $transactionItem->delivery_fee,
                        'rent_days' => $transactionItem->rent_days,
                    ]
                ));
            }

            // 6. RESPON SUKSES
            return redirect()->back()->with('success', 'Item transaksi berhasil dikonfirmasi.');

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            // Tangani error jika item tidak ditemukan (404)
            Log::warning("Transaction item not found: " . $transactionItemId);
            abort(404, 'Item transaksi tidak ditemukan.');
            
        } catch (\Throwable $e) {
            // Tangani error PHP/Server lainnya
            
            // Log error detail ke file log Laravel
            Log::error('Confirmation Error for ID ' . $transactionItemId . ': ' . $e->getMessage(), ['exception' => $e]);
            
            // Beri respon gagal yang ramah kepada pengguna
            return redirect()->back()->with('error', 'Gagal mengonfirmasi item. Terjadi kesalahan server.');
        }
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

            // Notifikasi pembeli - item dibatalkan oleh mitra
            $buyer = $transactionItem->transaction?->user;
            if ($buyer) {
                $itemName = $transactionItem->item->name ?? $transactionItem->type ?? 'Item';
                $buyer->notify(new \App\Notifications\PaymentStatusNotification(
                    'Pesanan dibatalkan oleh Mitra',
                    'Item ' . $itemName . ' dibatalkan oleh Mitra. Dana dikreditkan ke dompet Anda.',
                    [
                        'type' => 'item_cancelled_by_mitra',
                        'status' => 'cancelled',
                        'order_id' => $transactionItem->transaction?->order_id,
                        'amount' => ($transactionItem->price * (int)($transactionItem->qty ?? 1)) + (int)($transactionItem->delivery_fee ?? 0),
                        'role' => 'user',
                        'items' => [[
                            'item_type' => $transactionItem->item_type,
                            'item_id' => $transactionItem->item_id,
                            'name' => $itemName,
                            'qty' => (int)($transactionItem->qty ?? 1),
                            'price' => $transactionItem->price
                        ]],
                        'delivery_type' => $transactionItem->delivery_type,
                        'delivery_fee' => $transactionItem->delivery_fee,
                        'note' => $transactionItem->note_admin,
                    ]
                ));
            }

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
        // Ambil item transaksi tanpa whereHasMorph untuk menghindari 404 karena inkonsistensi morph alias
        $transactionItem = TransactionItem::with('item','transaction')->findOrFail($transactionItemId);

        // Jangan izinkan item biaya antar (Delivery Fee) diubah ke OTW
        if (strcasecmp($transactionItem->type ?? '', 'Delivery Fee') === 0) {
            return redirect()->back()->with('error', 'Item biaya antar tidak dapat diubah ke OTW.');
        }

        $userId = Auth::id();
        $type = $transactionItem->item_type;
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
            abort(403, 'Anda tidak berhak mengubah status item transaksi ini.');
        }

        // Periksa status sebelum memperbarui
        if ($transactionItem->status === 'confirmed') {
            $transactionItem->status = 'otw';
            $transactionItem->save();

            // Notifikasi pembeli - item dalam perjalanan (OTW)
            $buyer = $transactionItem->transaction?->user;
            if ($buyer) {
                $itemName = $transactionItem->item->name ?? $transactionItem->type ?? 'Item';
                $buyer->notify(new \App\Notifications\PaymentStatusNotification(
                    'Pesanan dalam perjalanan',
                    'Mitra sedang OTW untuk item ' . $itemName . '.',
                    [
                        'type' => 'item_otw',
                        'status' => 'otw',
                        'order_id' => $transactionItem->transaction?->order_id,
                        'amount' => ($transactionItem->price * (int)($transactionItem->qty ?? 1)),
                        'role' => 'user',
                        'items' => [[
                            'item_type' => $transactionItem->item_type,
                            'item_id' => $transactionItem->item_id,
                            'name' => $itemName,
                            'qty' => (int)($transactionItem->qty ?? 1),
                            'price' => $transactionItem->price
                        ]]
                    ]
                ));
            }

            return redirect()->back()->with('success', 'Status transaksi berhasil diubah menjadi OTW.');
        }

        return redirect()->back()->with('error', 'Transaksi tidak dapat diubah menjadi OTW.');
    }

     public function work(Request $request, $transactionItemId)
     {
         // Ambil item transaksi berdasarkan ID tanpa whereHasMorph untuk menghindari 404 karena inkonsistensi alias/class
         $transactionItem = TransactionItem::with('item','transaction')->findOrFail($transactionItemId);

         // Cegah item biaya antar
         if (strcasecmp($transactionItem->type ?? '', 'Delivery Fee') === 0) {
             return redirect()->back()->with('error', 'Item biaya antar tidak dapat diubah ke status Kerja.');
         }

         $userId = Auth::id();
         $type = $transactionItem->item_type;
         $owns = false;

         if (in_array($type, ['service', Service::class, 'App\\Models\\Service'])) {
             $owns = Service::where('id', $transactionItem->item_id)->where('user_id', $userId)->exists();
         } elseif (in_array($type, ['building', Building::class, 'App\\Models\\Building'])) {
             $owns = Building::where('id', $transactionItem->item_id)->where('user_id', $userId)->exists();
         } elseif (in_array($type, ['rent_property', 'property', RentProperty::class, 'App\\Models\\RentProperty'])) {
             $owns = RentProperty::where('id', $transactionItem->item_id)->where('user_id', $userId)->exists();
         }

         if (!$owns) {
             abort(403, 'Anda tidak berhak memperbarui status item transaksi ini.');
         }

         // Tentukan status baru berdasarkan status saat ini
         if ($transactionItem->status === 'otw') {
             $transactionItem->status = 'work';
             $transactionItem->save();
 
             // Notifikasi pembeli - pekerjaan dimulai
             $buyer = $transactionItem->transaction?->user;
             if ($buyer) {
                 $itemName = $transactionItem->item->name ?? $transactionItem->type ?? 'Item';
                 $buyer->notify(new \App\Notifications\PaymentStatusNotification(
                     'Pekerjaan dimulai',
                     'Mitra mulai mengerjakan pesanan untuk item ' . $itemName . '.',
                     [
                         'type' => 'item_work_started',
                         'status' => 'work',
                         'order_id' => $transactionItem->transaction?->order_id,
                         'amount' => ($transactionItem->price * (int)($transactionItem->qty ?? 1)),
                         'role' => 'user',
                         'items' => [[
                             'item_type' => $transactionItem->item_type,
                             'item_id' => $transactionItem->item_id,
                             'name' => $itemName,
                             'qty' => (int)($transactionItem->qty ?? 1),
                             'price' => $transactionItem->price
                         ]]
                     ]
                 ));
             }
 
             return redirect()->back()->with('success', 'Status transaksi berhasil diperbarui.');
         }

         return redirect()->back()->with('error', 'Transaksi tidak dapat diproses.');
     }

    
    public function complete(Request $request, $transactionItemId)
    {
        // Ambil item transaksi berdasarkan ID tanpa whereHasMorph untuk menghindari 404 karena inkonsistensi alias/class
        $transactionItem = TransactionItem::with('item','transaction')->findOrFail($transactionItemId);


        // Cegah item biaya antar
        if (strcasecmp($transactionItem->type ?? '', 'Delivery Fee') === 0) {
            return redirect()->back()->with('error', 'Item biaya antar tidak dapat diubah ke status Selesai.');
        }

        $userId = Auth::id();
        $type = $transactionItem->item_type;
        $owns = false;

        if (in_array($type, ['service', Service::class, 'App\\Models\\Service'])) {
            $owns = Service::where('id', $transactionItem->item_id)->where('user_id', $userId)->exists();
        } elseif (in_array($type, ['building', Building::class, 'App\\Models\\Building'])) {
            $owns = Building::where('id', $transactionItem->item_id)->where('user_id', $userId)->exists();
        } elseif (in_array($type, ['rent_property', 'property', RentProperty::class, 'App\\Models\\RentProperty'])) {
            $owns = RentProperty::where('id', $transactionItem->item_id)->where('user_id', $userId)->exists();
        }

        if (!$owns) {
            abort(403, 'Anda tidak berhak menyelesaikan item transaksi ini.');
        }

        // Tentukan status baru berdasarkan status saat ini
        if ($transactionItem->status === 'work' || ($transactionItem->item_type === 'building' && $transactionItem->status === 'confirmed')) {
            $transactionItem->status = 'completed';

            // Ambil pengguna saat ini
            $user = Auth::user();

            // Cari atau buat dompet pengguna
            $wallet = Wallet::firstOrCreate(
                ['user_id' => $user->id],
                ['balance' => 0]
            );

            // Tambahkan harga item transaksi ke saldo dompet
            $wallet->balance += $transactionItem->price;

            $wallet->balance += $transactionItem->delivery_fee;

            // Simpan perubahan pada dompet
            $wallet->save();

            $transactionItem->save(); // Simpan status transaksi yang diubah

            // Notifikasi pembeli - pekerjaan selesai
            $buyer = $transactionItem->transaction?->user;
            if ($buyer) {
                $itemName = $transactionItem->item->name ?? $transactionItem->type ?? 'Item';
                $buyer->notify(new \App\Notifications\PaymentStatusNotification(
                    'Pesanan selesai',
                    'Mitra telah menyelesaikan pesanan untuk ' . $itemName . '.',
                    [
                        'type' => 'item_completed',
                        'status' => 'completed',
                        'order_id' => $transactionItem->transaction?->order_id,
                        'amount' => ($transactionItem->price * (int)($transactionItem->qty ?? 1)) + (int)($transactionItem->delivery_fee ?? 0),
                        'role' => 'user',
                        'items' => [[
                            'item_type' => $transactionItem->item_type,
                            'item_id' => $transactionItem->item_id,
                            'name' => $itemName,
                            'qty' => (int)($transactionItem->qty ?? 1),
                            'price' => $transactionItem->price
                        ]],
                        'delivery_fee' => $transactionItem->delivery_fee,
                        'delivery_type' => $transactionItem->delivery_type,
                        'rent_days' => $transactionItem->rent_days,
                    ]
                ));
            }
            
            return redirect()->back()->with('success', 'Transaksi berhasil diselesaikan. Saldo Anda telah diperbarui.');
        }

        return redirect()->back()->with('error', 'Transaksi tidak dapat diselesaikan.');
    }
}
