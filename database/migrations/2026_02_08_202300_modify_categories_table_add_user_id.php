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
        Schema::table('categories', function (Blueprint $table) {
            // Add user_id column if it doesn't exist
            if (!Schema::hasColumn('categories', 'user_id')) {
                $table->foreignId('user_id')->after('id')->constrained()->onDelete('cascade');
            }
            
            // Add unique constraints for user-specific categories
            try {
                $table->unique(['user_id', 'name'], 'categories_user_name_unique');
                $table->unique(['user_id', 'slug'], 'categories_user_slug_unique');
            } catch (\Exception $e) {
                // If the unique constraints already exist, just continue
                // This might happen if the migration is run multiple times
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            // Try to drop the unique constraints, but continue if they don't exist
            try {
                $table->dropUnique('categories_user_name_unique');
            } catch (\Exception $e) {
                // Ignore if the constraint doesn't exist
            }
            
            try {
                $table->dropUnique('categories_user_slug_unique');
            } catch (\Exception $e) {
                // Ignore if the constraint doesn't exist
            }
            
            // Drop the user_id column if it exists
            if (Schema::hasColumn('categories', 'user_id')) {
                $table->dropColumn(['user_id']);
            }
            
            // Restore the original unique constraint on slug
            try {
                $table->unique('slug', 'categories_slug_unique');
            } catch (\Exception $e) {
                // Ignore if the constraint already exists
            }
        });
    }
};