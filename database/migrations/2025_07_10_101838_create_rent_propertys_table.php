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
        Schema::create('rent_propertys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('location');
            $table->text('description')->nullable();
            $table->boolean('delivered')->default(false);
            $table->boolean('picked_up')->default(false);
            $table->integer('price')->default(0);
            $table->string('pin')->nullable();
            $table->string('thumbnail')->nullable();
            $table->enum('status', ['active', 'inactive', 'banned', 'completed', ])->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rent_propertys');
    }
};
