<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Speaker extends Model
{
    use HasFactory;

    public $timestamps = true;

    protected $fillable = ['event_id', 'name', 'photo', 'description'];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
