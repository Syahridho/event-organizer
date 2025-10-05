<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne; 
use Illuminate\Database\Eloquent\Model;

class TransactionItem extends Model
{
    use HasFactory;

    protected $table = 'transaction_items';

    protected $fillable = [
        'transaction_id',
        'item_id',
        'item_type',
        'type',
        'price',
        'rent_days',
        'status',
        'qty',
        'reviews_id',
    ];

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    public function item()
    {
        return $this->morphTo();
    }
    
    public function review(): HasOne
    {
        return $this->hasOne(Review::class, 'id', 'reviews_id');
    }
}