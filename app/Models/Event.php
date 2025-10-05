<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    use HasFactory;

    protected $with = ['speakers', 'tickets', 'user'];

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

    public function transactionItems()
    {
        return $this->morphMany(TransactionItem::class, 'item');
    }
}
