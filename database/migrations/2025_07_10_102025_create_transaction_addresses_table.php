<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transaction_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); 
            $table->string('recipient_name');
            $table->string('phone', 20);
            $table->text('address_line');
            $table->string('city')->nullable(); 
            $table->string('province')->nullable();
            $table->string('postal_code', 10)->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
            
            $table->index('transaction_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaction_addresses');
    }
};