<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            // Add composite index for fast queries
            $table->index(['item_type', 'item_id', 'created_at'], 'reviews_item_index');

            // Add unique constraint: 1 user can only review 1 product once
            $table->unique(['user_id', 'item_id', 'item_type'], 'reviews_user_item_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex('reviews_item_index');
            $table->dropUnique('reviews_user_item_unique');
        });
    }
};
