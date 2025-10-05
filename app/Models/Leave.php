<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Leave extends Model
{
     use HasFactory;

    protected $fillable = ['user_id','date','day_of_week', 'item_id', 'item_type'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
