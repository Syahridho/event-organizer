<?php

namespace App\Http\Controllers\Mitra;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Review;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class RatingController extends Controller
{
    public function store(Request $request, string $orderId)
    {
        try {
            return DB::transaction(function () use ($request, $orderId) {
                // FAST: Validation and retrieval in one step
                $validated = $request->validate([
                    'rating'    => 'required|integer|min:1|max:5',
                    'comment'   => 'nullable|string|max:500',
                    'item_type' => 'required|string',
                    'item_id'   => 'required|integer',
                    'day_rent'  => 'required|date',
                ]);

                // Efficient access to new data points
                $itemId  = $validated['item_id'];
                $rentDay = $validated['day_rent'];

                // Locate the TransactionItem by orderId (from parent Transaction), item_id, item_type, and completed status
                $transactionItem = TransactionItem::where('status', 'completed')
                    ->where('item_id', $itemId)
                    ->where('item_type', $validated['item_type'])
                    ->whereHas('transaction', function ($q) use ($orderId) {
                        $q->where('order_id', $orderId);
                    })
                    ->first();

                if (!$transactionItem) {
                    Log::warning('RatingController@store: Transaction item not found', [
                        'order_id' => $orderId,
                        'item_type' => $validated['item_type'],
                        'item_id' => $itemId,
                        'user_id' => auth()->id(),
                    ]);
                    return back()->with('error', 'Transaksi tidak ditemukan.');
                }
                
                if ($transactionItem->reviews_id) {
                    return back()->with('error', 'Item ini sudah diulas.');
                }  

                // Create review (ensure FK transaction_item_id is set to satisfy NOT NULL constraint)
                $review = new Review([
                    'user_id'             => auth()->id(),
                    'rating'              => $validated['rating'],
                    'comment'             => $validated['comment'] ?? null,
                    'item_id'             => $transactionItem->item_id,
                    'item_type'           => $transactionItem->item_type,
                    'transaction_item_id' => $transactionItem->id,
                ]);

                $saved = $review->save();

                if (!$saved || !$review->id) {
                    Log::warning('RatingController@store: Review save failed', [
                        'order_id' => $orderId,
                        'item_type' => $validated['item_type'],
                        'item_id' => $itemId,
                        'user_id' => auth()->id(),
                        'payload' => [
                            'rating'  => $validated['rating'],
                            'comment' => $validated['comment'] ?? null,
                            'day_rent'=> $rentDay,
                        ],
                    ]);
                    return back()->with('error', 'Item yang diulas tidak valid.');
                }

                 // Link review id to transaction item
                $transactionItem->reviews_id = $review->id;
                $transactionItem->save();

                // Optional debug: log the rent day for traceability
                Log::info('RatingController@store: Review stored', [
                    'order_id' => $orderId,
                    'review_id' => $review->id,
                    'item_id' => $itemId,
                    'day_rent' => $rentDay,
                    'user_id' => auth()->id(),
                ]);

                return back()->with('success', 'Ulasan berhasil disimpan!');
            });
        } catch (\Throwable $e) {
            Log::error('RatingController@store: Exception', [
                'order_id' => $orderId,
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // For debug: expose the exception message in flash. Consider hiding in production.
            return back()->with('error', 'Terjadi kesalahan saat menyimpan ulasan: ' . $e->getMessage());
        }
    }
}