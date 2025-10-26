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
            // Link to transaction_items to avoid cycle (transaction_items.reviews_id is not FK)
            $table->foreignId('transaction_item_id')->constrained()->onDelete('cascade');

            // Added fields for indexing and fast lookups
            $table->unsignedBigInteger('item_id');
            $table->string('item_type');

            $table->integer('rating');
            $table->text('comment')->nullable();
            $table->timestamps();
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