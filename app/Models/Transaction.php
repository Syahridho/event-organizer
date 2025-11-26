<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $table = 'transactions';

    use HasFactory;

    protected $fillable = [
        'user_id',
        'order_id',
        'redirect_url',
        'status',
        'token',
        'expired_at',
        'payment_type',
        'total',
        'subtotal',
        'tax',
        'va_number',
        'bank_name',
        'bill_key', 
        'biller_code',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(TransactionItem::class);
    }

    public function address()
    {
        return $this->hasOne(TransactionAddress::class);
    }
}
