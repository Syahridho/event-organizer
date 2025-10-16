<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RentProperties extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'location',
        'description',
        'price',
        'pin',
        'thumbnail',
        'status',
    ];

    protected $with = ['itemPhotos'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function itemPhotos()
    {
        return $this->hasMany(ItemPhoto::class, 'item_id')->where('item_type', self::class);
    }
}
