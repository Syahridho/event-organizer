<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Building extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'location',
        'description',
        'thumbnail',
        'pin',
        'capacity',
        'price',
        'status',
    ];

    protected $with = ['itemPhotos'];
    
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function itemPhotos()
    {
        return $this->morphMany(ItemPhoto::class, 'item');
    }

}
