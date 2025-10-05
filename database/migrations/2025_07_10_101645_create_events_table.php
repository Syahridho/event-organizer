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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('event_mode', ['Offline', 'Google Meet', 'Zoom'])->default('Offline');

            $table->string('location')->nullable();
            $table->string('pin')->nullable();
            $table->string('link_meeting')->nullable();
            $table->string('thumbnail')->nullable();

            $table->dateTime('event_date_start');
            $table->dateTime('event_date_end');

            $table->dateTime('ticket_date_start');
            $table->dateTime('ticket_date_end');

            $table->enum('status', ['active', 'inactive', 'banned', 'completed', ])->default('active');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
