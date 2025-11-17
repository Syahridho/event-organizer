<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Ticket;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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

        // Convert item type to database alias
        $itemTypeInput = $validated['item_type'];

        // Convert namespace to database alias
        if (Str::contains($itemTypeInput, '\\')) {
            // Extract class name from namespace
            $baseName = Str::afterLast($itemTypeInput, '\\'); // Result: RentProperty
            
            // Convert CamelCase (RentProperty) to snake_case (rent_property)
            $dbAliasType = Str::snake($baseName); // Result: rent_property
        } else {
            // If input is already alias, use directly
            $dbAliasType = strtolower($itemTypeInput); // Result: property or rent_property
        }

        // Handle Event reviews by looking up associated Ticket IDs
        if ($dbAliasType === 'event') {
            // 1. Get all ticket IDs related to the event ID
            $ticketIds = Ticket::where('event_id', $validated['item_id'])->pluck('id');
            
            // 2. Query reviews using the Ticket IDs and Ticket item_type
            $ticketIds = Ticket::where('event_id', $validated['item_id'])->pluck('id');
            
            // Query reviews using the Ticket IDs and Ticket item_type
            $reviews = Review::whereIn('item_id', $ticketIds)
                ->where('item_type', 'ticket')
                ->with(['user', 'transactionItem.transaction.user'])
                ->paginate(10);
        } else {
            // Handle non-event (Service, Building, etc.) as before
            $reviews = Review::forItem($dbAliasType, $validated['item_id'])
                ->with(['user', 'transactionItem.transaction.user'])
                ->paginate(10);
            }

        // Get statistics - handle Event type specially
        if ($dbAliasType === 'event') {
            $ticketIds = Ticket::where('event_id', $validated['item_id'])->pluck('id');
            
            $stats = [
                'average_rating' => Review::whereIn('item_id', $ticketIds)
                ->where('item_type', 'ticket')
                ->avg('rating'),
            'total_reviews' => Review::whereIn('item_id', $ticketIds)
                ->where('item_type', 'ticket')
                ->count(),
            ];
        } else {
            $stats = [
                'average_rating' => Review::getAverageRating($dbAliasType, $validated['item_id']),
                'total_reviews' => Review::where('item_id', $validated['item_id'])
                ->where('item_type', $dbAliasType)
                ->count(),
            ];
        }

        return response()->json([
            'reviews' => $reviews,
            'stats' => $stats,
        ]);
    }

    /**
     * Store a new review.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'item_type' => 'required|string',
            'item_id' => 'required|integer',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
            'transaction_item_id' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validated = $validator->validated();

        $userId = auth()->id();
        $fullItemType = $validated['item_type'];
        $transactionItemId = $validated['transaction_item_id'] ?? null;

        // Convert to database alias for review checking
        $dbAliasType = strtolower(Str::afterLast($fullItemType, '\\'));
        
        // If transaction_item_id is provided, validate it
        if ($transactionItemId) {
            $transactionItem = TransactionItem::where('id', $transactionItemId)
                ->where('user_id', $userId)
                ->where('item_id', $validated['item_id'])
                ->where('item_type', $dbAliasType)
                ->first();

            if (!$transactionItem) {
                return response()->json([
                    'error' => 'Transaction item tidak valid.'
                ], 422);
            }

            // Check if this transaction item already has a review
            if (Review::hasUserReviewedTransactionItem($userId, $transactionItemId)) {
                return response()->json([
                    'error' => 'Anda sudah memberikan review untuk transaksi ini.'
                ], 422);
            }
        }

        try {
            // Create review data
            $reviewData = [
                'user_id' => $userId,
                'item_type' => $dbAliasType,
                'item_id' => $validated['item_id'],
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
            ];

            // Add transaction_item_id if provided
            if ($transactionItemId) {
                $reviewData['transaction_item_id'] = $transactionItemId;
            }

            $review = Review::create($reviewData);

            return response()->json([
                'message' => 'Review berhasil ditambahkan',
                'review' => $review->load('user'),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Gagal menambahkan review. ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check if user has purchased an item.
     * Uses optimized query with joins and consistent type aliasing.
     */
    private function hasUserPurchasedItem($userId, $itemType, $itemId)
    {
        // Convert item type to database alias
        $aliasType = strtolower(Str::afterLast($itemType, '\\'));
    
        // Handle different item types
        if ($aliasType === 'event') {
            // For events, check if user purchased any ticket for this event
            return TransactionItem::whereHas('transaction', function ($query) use ($userId) {
                $query->where('user_id', $userId)
                      ->where('status', 'settlement'); // Only completed purchases
            })
            ->where('item_type', 'ticket')
            ->where('item_id', $itemId)
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

        // Use short alias consistent with DB column for all checking
        $dbAliasType = strtolower(Str::afterLast($request->item_type, '\\'));
    
        $alreadyReviewed = Review::hasUserReviewed(
            $userId,
            $dbAliasType,
            $request->item_id
        );

        $hasPurchased = $this->hasUserPurchasedItem(
            $userId,
            $request->item_type,
            $request->item_id
        );

        $transactionItemId = $request->transaction_item_id ?? null;
        $alreadyReviewedThisTransaction = false;
        
        if ($transactionItemId) {
            $alreadyReviewedThisTransaction = Review::hasUserReviewedTransactionItem(
                $userId,
                $transactionItemId
            );
        }
        
        return response()->json([
            'can_review' => $hasPurchased && !$alreadyReviewedThisTransaction,
            'has_purchased' => $hasPurchased,
            'already_reviewed' => $alreadyReviewed,
            'already_reviewed_this_transaction' => $alreadyReviewedThisTransaction,
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
                
                // Validate data
                $validated = $request->validate([
                    'rating' => 'required|integer|min:1|max:5',
                    'comment' => 'nullable|string|max:500',
                    'item_type' => 'required|string',
                    'item_id' => 'required|integer',
                    'day_rent' => 'nullable|date',
                    'transaction_item_id' => 'required|integer'
                ]);

                $transactionItemId = $validated['transaction_item_id'];
                $userId = auth()->id();

                // Get and authorize transaction item
                $transactionItem = TransactionItem::with('transaction')
                    ->where('id', $transactionItemId)
                    ->whereHas('transaction', function ($q) use ($userId, $orderId) {
                    $q->where('order_id', $orderId)->where('user_id', $userId);
                })
                    ->first();
                
                if (!$transactionItem) {
                    abort(404, 'Item transaksi tidak ditemukan atau Anda tidak berhak mengulas.');
                }

                // Use updateOrCreate to avoid duplicate entry errors
                $review = Review::updateOrCreate(
                    [
                        'user_id' => $userId,
                        'transaction_item_id' => $transactionItemId,
                    ],
                    [
                        'rating' => $validated['rating'],
                        'comment' => $validated['comment'] ?? null,
                        'item_id' => $transactionItem->item_id,
                        'item_type' => $transactionItem->item_type,
                    ]
                );
                
                // Update the transaction_item with the note from the review
                if ($review && $transactionItemId) {
                    $transactionItem->note = $validated['comment'] ?? null;
                    $transactionItem->save();
                }

                $transactionItem->reviews_id = $review->id;

                $transactionItem->save();

                return back();
            });
        } catch (\Throwable $e) {
            Log::error('Review Submission Fatal Error', [
                'order_id' => $orderId, 
                'user_id' => auth()->id(),
                'error' => $e->getMessage()
            ]);
                
            return back()->with('error', 'Terjadi kesalahan sistem yang fatal. Mohon coba lagi.');
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
