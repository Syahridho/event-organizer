<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str; // Tambahkan ini untuk helper string

class ReviewController extends Controller
{
    /**
     * Get reviews for a specific item with pagination and statistics.
     */
    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'item_type' => 'required|string', 
            'item_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // --- ALGORITMA TERCEPAT: Konversi Item Type ke Alias Database ---
        // Ini mengatasi masalah pencarian 'App\Models\Service' vs 'service' di DB.
        $dbAliasType = strtolower(Str::afterLast($request->item_type, '\\'));
        // ---------------------------------------------------------------

        // Get reviews with eager loading (Muat data user yang memberikan ulasan)
        $reviews = Review::forItem($dbAliasType, $request->item_id)
        ->with([
            'user', 
            'transactionItem.transaction.user' 
        ])
        ->paginate(10);

        // Get statistics, menggunakan alias tipe yang sudah benar
        $stats = [
            'average_rating' => Review::getAverageRating($dbAliasType, $request->item_id),
            'total_reviews' => Review::getTotalReviews($dbAliasType, $request->item_id),
        ];

        return response()->json([
            'reviews' => $reviews,
            'stats' => $stats,
        ]);
    }

    // --- Bagian STORE diubah untuk menggunakan alias pendek yang konsisten ---
    public function store(Request $request)
    {
        // Peringatan: Gunakan namespace penuh di sini untuk validasi, tetapi gunakan alias pendek di DB.
        $validator = Validator::make($request->all(), [
            'item_type' => 'required|string|in:App\Models\Event,App\Models\Service,App\Models\Building,App\Models\RentProperty', // Use RentProperty (singular)
            'item_id' => 'required|integer',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $userId = auth()->id();
        $fullItemType = $request->item_type;

        // Konversi ke alias database untuk pengecekan review
        $dbAliasType = strtolower(Str::afterLast($fullItemType, '\\'));

        // --- 1. Cek apakah user sudah mereview (menggunakan alias pendek) ---
        // Asumsi Review::hasUserReviewed di Model Anda juga menggunakan alias pendek
        if (Review::hasUserReviewed($userId, $dbAliasType, $request->item_id)) {
            return response()->json([
                'error' => 'Anda sudah memberikan review untuk produk ini.'
            ], 422);
        }

        // --- 2. Validasi pembelian (menggunakan full namespace karena hasUserPurchasedItem memvalidasi TransactionItem) ---
        $hasPurchased = $this->hasUserPurchasedItem(
            $userId,
            $fullItemType, // Gunakan fullItemType di sini jika TransactionItem menyimpan namespace penuh
            $request->item_id
        );

        if (!$hasPurchased) {
            return response()->json([
                'error' => 'Anda hanya bisa memberikan review setelah membeli produk ini.'
            ], 403);
        }

        try {
            // --- 3. CREATE REVIEW (gunakan alias pendek untuk konsistensi DB) ---
            $review = Review::create([
                'user_id' => $userId,
                // Simpan alias pendek yang benar-benar digunakan di Model Scope
                'item_type' => $dbAliasType, 
                'item_id' => $request->item_id,
                'rating' => $request->rating,
                'comment' => $request->comment,
            ]);

            return response()->json([
                'message' => 'Review berhasil ditambahkan',
                'review' => $review,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Gagal menambahkan review. ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update, Destroy, CanReview - optimized and consistent with DB aliases
     */
    
    /**
     * Check if user has purchased an item.
     * Uses optimized query with joins and consistent type aliasing.
     */
    private function hasUserPurchasedItem($userId, $itemType, $itemId)
    {
        // Selaraskan tipe item ke alias DB (e.g. "App\Models\Service" => "service")
        $aliasType = strtolower(\Illuminate\Support\Str::afterLast($itemType, '\\'));
    
        return TransactionItem::whereHas('transaction', function ($query) use ($userId) {
                $query->where('user_id', $userId)
                      ->where('status', 'settlement'); // Only completed purchases
            })
            ->where('item_type', $aliasType)
            ->where('item_id', $itemId)
            ->exists();
    }
    
    /**
     * Update a review (only by owner).
     */
    public function update(Request $request, Review $review)
    {
        if ($review->user_id !== auth()->id()) {
            return response()->json(['error' => 'Tidak diizinkan mengubah review ini.'], 403);
        }
    
        $validator = Validator::make($request->all(), [
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);
    
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
    
        $review->rating = $request->rating;
        $review->comment = $request->comment;
        $review->save();
    
        return response()->json([
            'message' => 'Review berhasil diperbarui',
            'review' => $review->fresh('user'),
        ]);
    }
    
    /**
     * Delete a review (only by owner).
     */
    public function destroy(Review $review)
    {
        if ($review->user_id !== auth()->id()) {
            return response()->json(['error' => 'Tidak diizinkan menghapus review ini.'], 403);
        }
    
        $review->delete();
    
        return response()->json(['message' => 'Review berhasil dihapus']);
    }
    
    /**
     * Check if user can review an item (for frontend).
     */
    public function canReview(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'item_type' => 'required|string',
            'item_id' => 'required|integer',
        ]);
    
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
    
        $userId = auth()->id();
    
        // Gunakan alias pendek yang konsisten dengan kolom DB untuk semua pengecekan
        $dbAliasType = strtolower(\Illuminate\Support\Str::afterLast($request->item_type, '\\'));
    
        $alreadyReviewed = Review::hasUserReviewed(
            $userId,
            $dbAliasType,
            $request->item_id
        );
    
        $hasPurchased = $this->hasUserPurchasedItem(
            $userId,
            $dbAliasType,
            $request->item_id
        );
    
        return response()->json([
            'can_review' => $hasPurchased && !$alreadyReviewed,
            'has_purchased' => $hasPurchased,
            'already_reviewed' => $alreadyReviewed,
        ]);
    }
}
