<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
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

        $validated = $validator->validated();

        // --- ALGORITMA TERCEPAT: Konversi Item Type ke Alias Database ---
        // Ini mengatasi masalah pencarian 'App\Models\Service' vs 'service' di DB.
         // --- ALGORITMA TERCEPAT: Konversi Item Type ke Alias Database ---
        // Ini mengatasi masalah pencarian 'App\Models\Service' vs 'service' di DB.
        $itemTypeInput = $request->item_type;

        // Cek apakah input mengandung namespace (tanda \)
        if (Str::contains($itemTypeInput, '\\')) {
            // Jika input adalah App\Models\RentProperty
            $baseName = Str::afterLast($itemTypeInput, '\\'); // Hasil: RentProperty
        
            // Konversi CamelCase (RentProperty) menjadi snake_case (rent_property)
            $dbAliasType = Str::snake($baseName); // Hasil: rent_property
        
        } else {
            // Jika input sudah alias (e.g., 'property' atau 'rent_property')
            $dbAliasType = strtolower($itemTypeInput); // Hasil: property atau rent_property
        }

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
            'transaction_item_id' => 'nullable|integer', // Add support for transaction_item_id
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $userId = auth()->id();
        $fullItemType = $request->item_type;
        $transactionItemId = $request->transaction_item_id;

        // Konversi ke alias database untuk pengecekan review
        $dbAliasType = strtolower(Str::afterLast($fullItemType, '\\'));

        // If transaction_item_id is provided, validate it
        if ($transactionItemId) {
            $transactionItem = TransactionItem::where('id', $transactionItemId)
                ->where('user_id', $userId)
                ->where('item_id', $request->item_id)
                ->where('item_type', $dbAliasType)
                ->first();

            if (!$transactionItem) {
                return response()->json([
                    'error' => 'Transaction item tidak valid.'
                ], 422);
            }

            // Check if this transaction item already has a review
            if ($transactionItem->reviews_id) {
                return response()->json([
                    'error' => 'Item ini sudah diulas.'
                ], 422);
            }
        }

        // --- 1. Cek apakah user sudah mereview (menggunakan alias pendek) ---
        // Asumsi Review::hasUserReviewed di Model Anda juga menggunakan alias pendek
        if (Review::hasUserReviewed($userId, $dbAliasType, $request->item_id)) {
            return response()->json([
                'error' => 'Anda sudah memberikan review untuk produk ini.'
            ], 422);
        }

        // --- 2. Validasi pembelian (menggunakan full namespace karena hasUserPurchasedItem memvalidasi TransactionItem) ---
        // Skip purchase validation if transaction_item_id is provided (already validated above)
        if (!$transactionItemId) {
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
        }

        try {
            // --- 3. CREATE REVIEW (gunakan alias pendek untuk konsistensi DB) ---
            $reviewData = [
                'user_id' => $userId,
                // Simpan alias pendek yang benar-benar digunakan di Model Scope
                'item_type' => $dbAliasType,
                'item_id' => $request->item_id,
                'rating' => $request->rating,
                'comment' => $request->comment,
            ];

            // Add transaction_item_id if provided
            if ($transactionItemId) {
                $reviewData['transaction_item_id'] = $transactionItemId;
            }

            $review = Review::create($reviewData);

            // If transaction_item_id was provided, update the transaction item
            if ($transactionItemId && isset($transactionItem)) {
                $transactionItem->reviews_id = $review->id;
                $transactionItem->save();
            }

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
    
        // OPTIMIZED: Handle different item types with fastest algorithm
        if ($aliasType === 'event') {
            // For events, check if user purchased any ticket for this event
            return TransactionItem::whereHas('transaction', function ($query) use ($userId) {
                    $query->where('user_id', $userId)
                          ->where('status', 'settlement'); // Only completed purchases
                })
                ->where('item_type', 'ticket')
                ->whereHas('item', function ($query) use ($itemId) {
                    // Get tickets that belong to this event
                    $query->whereHas('ticket', function ($ticketQuery) use ($itemId) {
                        $ticketQuery->where('event_id', $itemId);
                    });
                })
                ->exists();
        } else {
            // For other types (service, building, rent_property, ticket), use direct item_id
            return TransactionItem::whereHas('transaction', function ($query) use ($userId) {
                    $query->where('user_id', $userId)
                          ->where('status', 'settlement'); // Only completed purchases
                })
                ->where('item_type', $aliasType)
                ->where('item_id', $itemId)
                ->exists();
        }
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
            $request->item_type, // Use full item_type to handle special cases like events
            $request->item_id
        );
    
        return response()->json([
            'can_review' => $hasPurchased && !$alreadyReviewed,
            'has_purchased' => $hasPurchased,
            'already_reviewed' => $alreadyReviewed,
        ]);
    }

    /**
     * Store a review from transaction page (Mitra rating functionality)
     * This method combines the functionality from RatingController
     */
    public function storeFromTransaction(Request $request, string $orderId)
    {
        try {
            return DB::transaction(function () use ($request, $orderId) {
                // FAST: Validation and retrieval in one step
                $validated = $request->validate([
                    'rating'    => 'required|integer|min:1|max:5',
                    'comment'   => 'nullable|string|max:500',
                    'item_type' => 'required|string',
                    'item_id'   => 'required|integer',
                    'day_rent'  => 'nullable|date',
                    'transaction_item_id' => 'required|integer'
                ]);

                // Efficient access to new data points
                $itemId  = $validated['item_id'];
                $rentDay = $validated['day_rent'] ?? null;

                // Convert full namespace to database alias for consistency
                $dbAliasType = strtolower(Str::afterLast($validated['item_type'], '\\'));

                // OPTIMIZED: Handle different item types with fastest algorithm
                $transactionItem = null;

                
                $transactionItem = TransactionItem::where('id', $validated['transaction_item_id'])
                    ->where('item_type', $dbAliasType)
                    ->first();

                if (!$transactionItem) {
                    Log::warning('ReviewController@storeFromTransaction: Transaction item not found', [
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
                    // For events, use the event_id instead of ticket_id for proper review association
                    'item_id'             => $dbAliasType === 'ticket' ? $itemId : $transactionItem->item_id,
                    'item_type'           => $dbAliasType === 'ticket' ? 'ticket' : $transactionItem->item_type,
                    'transaction_item_id' => $transactionItem->id,
                ]);

                $saved = $review->save();

                if (!$saved || !$review->id) {
                    Log::warning('ReviewController@storeFromTransaction: Review save failed', [
                        'order_id' => $orderId,
                        'item_type' => $validated['item_type'],
                        'item_id' => $itemId,
                        'user_id' => auth()->id(),
                        'payload' => [
                            'rating'  => $validated['rating'],
                            'comment' => $validated['comment'] ?? null,
                            'day_rent'=> $rentDay ?? null,
                        ],
                    ]);
                    return back()->with('error', 'Item yang diulas tidak valid.');
                }

                 // Link review id to transaction item
                $transactionItem->reviews_id = $review->id;
                $transactionItem->save();

                // Optional debug: log the rent day for traceability
                Log::info('ReviewController@storeFromTransaction: Review stored', [
                    'order_id' => $orderId,
                    'review_id' => $review->id,
                    'item_id' => $itemId,
                    'day_rent' => $rentDay ?? null,
                    'user_id' => auth()->id(),
                ]);

                return back()->with('success', 'Ulasan berhasil disimpan!');
            });
        } catch (\Throwable $e) {
            Log::error('ReviewController@storeFromTransaction: Exception', [
                'order_id' => $orderId,
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // For debug: expose the exception message in flash. Consider hiding in production.
            return back()->with('error', 'Terjadi kesalahan saat menyimpan ulasan: ' . $e->getMessage());
        }
    }

    /**
     * Get user's review for a specific transaction item
     * This helps frontend determine if user can edit their review
     */
    public function getUserReviewForTransaction(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'transaction_item_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $userId = auth()->id();
        $transactionItemId = $request->transaction_item_id;

        $review = Review::where('user_id', $userId)
            ->where('transaction_item_id', $transactionItemId)
            ->with('user')
            ->first();

        return response()->json([
            'review' => $review,
            'has_reviewed' => $review !== null,
        ]);
    }
}
