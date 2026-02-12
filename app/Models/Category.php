<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'description',
        'color',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        // Add global scope to automatically filter by authenticated user
        static::addGlobalScope('user', function ($query) {
            if (auth()->check()) {
                $query->where('user_id', auth()->id());
            }
        });

        static::creating(function ($category) {
            if (empty($category->slug)) {
                $category->slug = Str::slug($category->name);
            }
            // Set user_id from authenticated user
            if (auth()->check() && empty($category->user_id)) {
                $category->user_id = auth()->id();
            }
        });

        static::updating(function ($category) {
            if ($category->isDirty('name') && empty($category->slug)) {
                $category->slug = Str::slug($category->name);
            }
        });
    }

    /**
     * Get the user that owns the category.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the products that belong to this category.
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class);
    }

    /**
     * Get the events that belong to this category.
     */
    public function events(): BelongsToMany
    {
        return $this->belongsToMany(Event::class, 'category_event', 'category_id', 'event_id')
                    ->using(CategoryEvent::class);
    }

    /**
     * Get services that belong to this category.
     */
    public function services()
    {
        return $this->morphedByMany(Service::class, 'categorizable', 'category_product');
    }

    /**
     * Get buildings that belong to this category.
     */
    public function buildings()
    {
        return $this->morphedByMany(Building::class, 'categorizable', 'category_product');
    }

    /**
     * Get active categories.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get categories without global scope (for admin use).
     */
    public function scopeWithoutUserScope($query)
    {
        return $query->withoutGlobalScope('user');
    }

    /**
     * Validate that the category belongs to the authenticated user.
     */
    public function belongsToAuthenticatedUser(): bool
    {
        return auth()->check() && $this->user_id === auth()->id();
    }
}