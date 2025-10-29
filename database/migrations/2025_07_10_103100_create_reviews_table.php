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
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('transaction_item_id')->constrained()->onDelete('cascade');

            // Essential columns for polymorphic 'morphTo' relationship
            // These are simple columns WITHOUT foreign key constraints or indexes
            $table->integer('item_id');
            $table->string('item_type');

            $table->integer('rating');
            $table->text('comment')->nullable();
            $table->timestamps();
            
            // Unique constraint ensuring a user can only review a specific transaction item once
            $table->unique(['user_id', 'transaction_item_id'], 'reviews_user_transaction_item_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};