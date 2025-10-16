<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'item_id',
        'item_type',
        'item_qty',
        'rent_days',
        'type',
        'is_unavailable',
    ];

    // OPTIMIZED: Removed 'date' cast from rent_days to prevent timezone conversion
    // rent_days will be returned as raw string (YYYY-MM-DD) to avoid date shift bugs
    protected $casts = [
        'is_unavailable' => 'boolean',
        'item_qty' => 'integer',
    ]; 

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function item()
    {
        return $this->morphTo();
    }
}