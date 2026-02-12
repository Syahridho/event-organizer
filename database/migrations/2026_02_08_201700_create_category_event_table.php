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
        // Check if the table already exists
        if (!Schema::hasTable('category_event')) {
            Schema::create('category_event', function (Blueprint $table) {
                $table->id();
                $table->foreignId('category_id')->constrained()->onDelete('cascade');
                $table->foreignId('event_id')->constrained()->onDelete('cascade');
                $table->timestamps();

                $table->unique(['category_id', 'event_id']);
            });
        } else {
            // If the table exists, we need to add the missing foreign key constraints
            Schema::table('category_event', function (Blueprint $table) {
                // Check if the foreign key constraints already exist
                if (!Schema::hasColumn('category_event', 'category_id')) {
                    $table->foreignId('category_id')->constrained()->onDelete('cascade');
                }
                
                if (!Schema::hasColumn('category_event', 'event_id')) {
                    $table->foreignId('event_id')->constrained()->onDelete('cascade');
                }
                
                // Add unique constraint if it doesn't exist
                $table->unique(['category_id', 'event_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('category_event');
    }
};