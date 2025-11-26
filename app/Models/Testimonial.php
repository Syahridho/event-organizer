<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Testimonial extends Model
{
    use HasFactory;

    protected $fillable = [
        'author_name',
        'author_title',
        'quote',
        'star_rating',
        'author_image_url',
        'is_featured',
    ];

    protected $casts = [
        'star_rating' => 'integer',
        'is_featured' => 'boolean',
    ];
}
