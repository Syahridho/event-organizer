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
        'delivery_type',
        'is_unavailable',
    ];

    // OPTIMIZED: Removed 'date' cast from rent_days to prevent timezone conversion
    // rent_days will be returned as raw string (YYYY-MM-DD) to avoid date shift bugs
    protected $casts = [
        'item_qty' => 'integer',
    ];

    // CRITICAL: Append dynamic attributes untuk sold-out detection
    // Attributes ini akan di-set oleh CartController setelah query
    protected $appends = [
        'is_sold_out',
        'is_booked_by_other',
        'is_already_booked_by_me',
        'is_mitra_on_leave',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
        // Accessor methods for dynamic attributes
        public function getIsSoldOutAttribute()
        {
            return $this->attributes['is_sold_out'] ?? false;
        }
    
        public function getIsBookedByOtherAttribute()
        {
            return $this->attributes['is_booked_by_other'] ?? false;
        }
    
        public function getIsAlreadyBookedByMeAttribute()
        {
            return $this->attributes['is_already_booked_by_me'] ?? false;
        }

        public function getIsMitraOnLeaveAttribute()
        {
            return $this->attributes['is_mitra_on_leave'] ?? false;
        }

    public function item()
    {
        return $this->morphTo();
    }
}