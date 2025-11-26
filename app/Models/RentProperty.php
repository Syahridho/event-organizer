<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\TransactionItem;

class RentProperty extends Model
{
    use HasFactory;

    protected $table = 'rent_propertys';

    protected $fillable = [
        'user_id',
        'name',
        'location',
        'description',
        'delivered', 
        'picked_up',
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

    public function transactionItems()
    {
        return $this->hasMany(TransactionItem::class, 'item_id')->where('item_type', 'rent_property');
    }
}