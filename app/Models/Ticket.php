<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    use HasFactory;

    public $timestamps = true;

    protected $fillable = [
        'event_id',
        'name',
        'price',
        'quota',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function transactionItems()
    {
        return $this->morphMany(TransactionItem::class, 'item');
    }

    public function user()
    {
        return $this->hasOneThrough(
            User::class,
            Event::class,
            'id', 
            'id', 
            'event_id', 
            'user_id'   
        );
    }
}
