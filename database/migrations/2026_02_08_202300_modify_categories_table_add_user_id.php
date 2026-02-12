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
            
            // Add other columns if they don't exist
            if (!Schema::hasColumn('categories', 'slug')) {
                $table->string('slug')->after('name');
            }
            
            if (!Schema::hasColumn('categories', 'description')) {
                $table->text('description')->nullable()->after('slug');
            }
            
            if (!Schema::hasColumn('categories', 'color')) {
                $table->string('color')->nullable()->after('description');
            }
            
            if (!Schema::hasColumn('categories', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('color');
            }
            
            // Add unique constraints for user-specific categories
            $table->unique(['user_id', 'name'], 'categories_user_name_unique');
            $table->unique(['user_id', 'slug'], 'categories_user_slug_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropUnique(['categories_user_name_unique']);
            $table->dropUnique(['categories_user_slug_unique']);
            $table->dropColumn(['user_id', 'slug', 'description', 'color', 'is_active']);
        });
    }
};