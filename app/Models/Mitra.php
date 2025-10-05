<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Mitra extends Model
{
    use HasFactory;

  
    protected $table = 'mitra'; 

  
    protected $fillable = [
        'user_id',
        'address',
        'npwp_number',
        'npwp_file_path',
        'business_file_path',
        'description',
        'status',
    ];
    
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    
    public function getNpwpFileUrlAttribute(): ?string
    {
        return $this->npwp_file_path ? asset('storage/' . $this->npwp_file_path) : null;
    }
}