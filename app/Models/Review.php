<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'item_id',
        'item_type',
        'rating',
        'transaction_item_id',
        'comment',
    ];

    // Eager load user to avoid N+1 queries
    protected $with = ['user'];

    protected $casts = [
        'rating' => 'integer',
        'created_at' => 'datetime',
    ];

    /**
     * Get the user that wrote the review.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the transaction item related to this review.
     */
    public function transactionItem(): BelongsTo
    {
        return $this->belongsTo(TransactionItem::class);
    }

    /**
     * Get the parent model that was reviewed (polymorphic).
     */
    public function reviewable(): MorphTo
    {
        return $this->morphTo('item');
    }

    /**
     * Scope to get reviews for a specific item.
     */
    public function scopeForItem($query, $itemType, $itemId)
    {
        // Konversi Namespace Penuh menjadi alias database (service)
        $dbAliasType = strtolower(Str::afterLast($itemType, '\\'));

        return $query->where('item_type', $dbAliasType)
                     ->where('item_id', $itemId);
    }

    /**
     * Scope to get reviews by a specific user.
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Get average rating for a specific item (static method for reusability).
     */
    public static function getAverageRating($itemType, $itemId)
    {
        return static::where('item_type', $itemType)
                     ->where('item_id', $itemId)
                     ->avg('rating');
    }

    /**
     * Get total reviews count for a specific item.
     */
    public static function getTotalReviews($itemType, $itemId)
    {
        return static::where('item_type', $itemType)
                     ->where('item_id', $itemId)
                     ->count();
    }

    /**
     * Check if user already reviewed an item.
     */
    public static function hasUserReviewed($userId, $itemType, $itemId)
    {
        return static::where('user_id', $userId)
                     ->where('item_type', $itemType)
                     ->where('item_id', $itemId)
                     ->exists();
    }

    /**
     * Get formatted date for display.
     */
    public function getFormattedDateAttribute(): string
    {
        return $this->created_at->diffForHumans();
    }
}