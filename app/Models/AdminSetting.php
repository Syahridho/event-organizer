<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdminSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'site_name',
        'logo',
        'currency',
        'payment_time',
        'tax_type',
        'tax_value',
        'contact_email',
        'contact_phone',
        'address',
        'about_us',
    ];

    /**
     * Cast attributes for type safety and performance
     */
    protected $casts = [
        'payment_time' => 'integer',
        'tax_value' => 'decimal:2',
        'tax_type' => 'string',
    ];

    /**
     * Get tax configuration
     * ALGORITHM: O(1) - single attribute access
     */
    public function getTaxConfigAttribute(): array
    {
        return [
            'type' => $this->tax_type,
            'value' => $this->tax_value,
        ];
    }
}
