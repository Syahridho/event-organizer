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
        'seo_title',
        'seo_description',
        'seo_keywords',
        'seo_image',
        'default_image_event',
        'seo_twitter_card',
        'seo_og_type',
        'seo_canonical_url',
        'seo_robots',
        'seo_author',
        'seo_publisher',
        'maintenance_mode',
    ];

    /**
     * Cast attributes for type safety and performance
     */
    protected $casts = [
        'payment_time' => 'integer',
        'tax_value' => 'decimal:2',
        'tax_type' => 'string',
        'default_image_event' => 'array',
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
