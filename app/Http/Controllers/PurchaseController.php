<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;
use App\Models\Ticket;
use App\Models\Service; 
use App\Models\Building;
use App\Models\RentProperty;
use Inertia\Inertia;

class PurchaseController extends Controller
{
    public function index()
    {
        $transactions = Transaction::with([
            'items.item' => function ($morph) {
                $morph->morphWith([
                    Ticket::class => ['event'],
                    Service::class => ['itemPhotos'],
                    Building::class => ['itemPhotos'],
                    RentProperty::class => ['itemPhotos'],
                ]);
            },
            'items.review'
        ])
        ->where('user_id', auth()->id())
        ->latest()
        ->get();

        // Check for sold out items and cancel transactions accordingly
        foreach ($transactions as $transaction) {
            $hasSoldOutItems = false;

            foreach ($transaction->items as $item) {
                // Check if item is ticket and has quota
                if ($item->item_type === 'ticket' && isset($item->item->quota)) {
                    // Check if there are successful transactions for the same ticket/date
                    $successfulTransactions = Transaction::where('status', 'settlement')
                        ->whereHas('items', function ($q) use ($item) {
                            $q->where('item_id', $item->item_id)
                                ->where('item_type', 'ticket')
                                ->where('rent_days', $item->rent_days);
                        })
                        ->where('id', '!=', $transaction->id) // Exclude current transaction
                        ->count();

                    // If there are successful transactions and quota is low, mark as sold_out
                    if ($successfulTransactions > 0 && $item->item->quota <= 1) {
                        $item->status = 'sold_out';
                        $item->save();
                        $hasSoldOutItems = true;
                    }
                }

                // Check if item is already marked as sold_out
                if ($item->status === 'sold_out') {
                    $hasSoldOutItems = true;
                }
            }

            // If transaction has sold out items and is still pending, cancel the entire transaction
            if ($hasSoldOutItems && $transaction->status === 'pending') {
                $transaction->update(['status' => 'cancelled']);

                // Also cancel in Midtrans if possible
                try {
                    \Midtrans\Config::$serverKey = config('midtrans.server_key');
                    \Midtrans\Config::$isProduction = config('midtrans.is_production');
                    \Midtrans\Transaction::cancel($transaction->order_id);
                } catch (\Exception $e) {
                    \Log::info('Could not cancel in Midtrans (might already be cancelled)', [
                        'order_id' => $transaction->order_id,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        }

        // dd($transactions);

        return Inertia::render('Purchase/Index', [
            'transactions' => $transactions,
            'tab' => 'all'
        ]);
    }

    // Belum bayar (pending)
    public function unpaid()
    {
        $transactions = Transaction::with(['items.item.event', 'items.review'])
            ->where('user_id', auth()->id())
            ->where('status', 'pending')
            ->latest()
            ->get();

        return Inertia::render('Purchase/Index', [
            'transactions' => $transactions,
            'tab' => 'unpaid'
        ]);
    }

    // Sudah bayar (settlement, capture)
    public function paid()
    {
        $transactions = Transaction::with(['items.item.event', 'items.review'])
            ->where('user_id', auth()->id())
            ->whereIn('status', ['settlement', 'capture'])
            ->latest()
            ->get();

        return Inertia::render('Purchase/Index', [
            'transactions' => $transactions,
            'tab' => 'paid'
        ]);
    }

    // Dalam perjalanan (shipped)
    public function shipped()
    {
        $transactions = Transaction::with(['items.item.event', 'items.review'])
            ->where('user_id', auth()->id())
            ->where('status', 'shipped')
            ->latest()
            ->get();

        return Inertia::render('Purchase/Index', [
            'transactions' => $transactions,
            'tab' => 'shipped'
        ]);
    }

    // Selesai (completed)
    public function completed()
    {
        $transactions = Transaction::with(['items.item.event', 'items.review'])
            ->where('user_id', auth()->id())
            ->where('status', 'completed')
            ->latest()
            ->get();

        return Inertia::render('Purchase/Index', [
            'transactions' => $transactions,
            'tab' => 'completed'
        ]);
    }

    // Dibatalkan (cancel, deny, expire, refund)
    public function cancel($orderId)
    {
        try {
            $transaction = Transaction::where('order_id', $orderId)
                ->where('user_id', auth()->id())
                ->firstOrFail();
            
            // Cek apakah transaksi masih bisa dibatalkan
            if (!in_array($transaction->status, ['pending', 'challenge'])) {
                return redirect()->back()->with('error', 'Transaksi tidak dapat dibatalkan. Status: ' . $transaction->status);
            }
            
            // Batalkan di Midtrans jika ada transaksi
            if ($transaction->order_id) {
                try {
                    \Midtrans\Config::$serverKey = config('midtrans.server_key');
                    \Midtrans\Config::$isProduction = config('midtrans.is_production');
                    
                    // Cancel transaction di Midtrans
                    $cancelResponse = \Midtrans\Transaction::cancel($transaction->order_id);
                    
                    \Log::info('Midtrans cancel response', ['response' => $cancelResponse]);
                    
                } catch (\Exception $midtransError) {
                    \Log::error('Midtrans cancel error', [
                        'error' => $midtransError->getMessage(),
                        'order_id' => $orderId
                    ]);
                    
                    // Jika Midtrans error karena transaksi sudah expire/cancel, lanjutkan
                    if (!str_contains($midtransError->getMessage(), 'already')) {
                        return redirect()->back()->with('error', 'Gagal membatalkan di payment gateway');
                    }
                }
            }
            
            // Update status transaksi utama
            $transaction->update([
                'status' => 'cancelled',
            ]);
            
            // Update status semua transaction items
            $transaction->items()->update([
                'status' => 'cancelled'
            ]);
            
            return redirect()->back()->with('success', 'Transaksi berhasil dibatalkan');
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return redirect()->back()->with('error', 'Transaksi tidak ditemukan');
        } catch (\Exception $e) {
            \Log::error('Cancel transaction error', [
                'error' => $e->getMessage(),
                'order_id' => $orderId
            ]);
            return redirect()->back()->with('error', 'Gagal membatalkan transaksi');
        }
    }

    public function show($id)
    {
        $transaction = Transaction::with([
            'items.item' => function ($morph) {
                $morph->morphWith([
                    \App\Models\Ticket::class => ['event'],
                    \App\Models\Service::class => ['itemphotos'],
                ]);
            },
            'items.review'
        ])
        ->where('id', $id)
        ->where('user_id', auth()->id())
        ->firstOrFail();

        return Inertia::render('Purchase/Show', [
            'transaction' => $transaction,
        ]);
    }
}
