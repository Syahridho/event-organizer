<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Event extends Model
{
    use HasFactory;

    protected $with = ['speakers', 'tickets', 'user', 'categories'];

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'event_mode',
        'location',
        'pin',
        'link_meeting',
        'thumbnail',
        'event_date_start',
        'event_date_end',
        'ticket_date_start',
        'ticket_date_end',
        'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function speakers(): HasMany
    {
        return $this->hasMany(Speaker::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    /**
     * Get the categories that belong to this event.
     */
    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'category_event', 'event_id', 'category_id')
                    ->using(CategoryEvent::class);
    }

    /**
     * Get the categories that belong to this event (polymorphic relationship).
     */
    public function categoryProducts(): MorphToMany
    {
        return $this->morphToMany(Category::class, 'categorizable', 'category_product');
    }

    public function transactionItems()
    {
        return $this->hasManyThrough(
            TransactionItem::class,
            Ticket::class,
            'event_id',     // Foreign key on tickets table
            'item_id',      // Foreign key on transaction_items table
            'id',           // Local key on events table
            'id'            // Local key on tickets table
        )->where('transaction_items.item_type', 'ticket');
    }

    public function categoriesWithoutScope(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'category_event', 'event_id', 'category_id')
                    ->withoutGlobalScope('user')
                    ->using(CategoryEvent::class);
    }

    public function getCategoriesAttribute()
    {
        return $this->categories()->withoutGlobalScope('user')->get();
    }
}
