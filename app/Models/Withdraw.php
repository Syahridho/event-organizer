<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Withdraw extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'withdraws';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'amount',
        'method',
        'account_holder_name',
        'account_number',
        'other_method',
        'status',
    ];

    /**
     * Get the user that owns the withdraw.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}