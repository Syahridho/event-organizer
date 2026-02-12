<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class CategoryEvent extends Pivot
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'category_event';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'category_id',
        'event_id',
    ];

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = true;

    /**
     * Get the event that owns the category event.
     */
    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Get the category that owns the category event.
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}