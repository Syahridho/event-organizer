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
        Schema::create('transaction_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained()->onDelete('cascade');
            $table->unsignedBigInteger('item_id');
            $table->string('item_type');
            $table->string('type');
            $table->integer('qty')->default(1);
            $table->integer('price');
            $table->date('rent_days')->nullable();
            $table->text('note')->nullable();
            $table->foreignId('reviews_id')->nullable()->constrained()->onDelete('cascade');
            $table->text('note_admin')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();
            
            // Add indexes
            $table->index('transaction_id');
            $table->index('reviews_id');
            $table->index('item_id');
            $table->index(['item_id', 'rent_days']); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaction_items');
    }
};

