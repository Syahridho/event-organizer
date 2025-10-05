<?php

namespace App\Http\Controllers\Mitra;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRatingRequest;
use App\Models\Review;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Inertia\Inertia;

class RatingController extends Controller
{
    public function store(StoreRatingRequest $request, string $orderId)
    {
        $transactionItem = TransactionItem::where('item_id', $orderId)
            ->where('item_type', $request->item_type)
            ->where('status', 'completed')
            ->first();

        if (!$transactionItem) {
            return back()->with('error', 'Transaksi tidak ditemukan.');
        }

        $review = new Review([
            'user_id' => auth()->id(),
            'rating' => $request->rating,
            'comment' => $request->comment,
            'item_id' => $transactionItem->item_id,
            'item_type' => $transactionItem->item_type,
        ]);
        $review->save();

        if (!$review) {
            return back()->with('error', 'Item yang diulas tidak valid.');
        }

        $transactionItem->rating = $review->id;
        $transactionItem->save();

        return back()->with('success', 'Ulasan berhasil disimpan!');
    }
}