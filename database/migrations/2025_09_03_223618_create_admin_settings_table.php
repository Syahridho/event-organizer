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
         Schema::create('admin_settings', function (Blueprint $table) {
            $table->id();
            $table->string('site_name')->default('Event Organizer');
            $table->string('logo')->nullable();
            $table->string('currency', 10)->default('IDR');

            // Payment time (dalam menit)
            $table->integer('payment_time')->default(60);

            // Tax settings
            $table->enum('tax_type', ['percent', 'fixed'])->default('percent'); 
            $table->decimal('tax_value', 10, 2)->default(0); 
            // percent: 10.00 = 10% | fixed: 10000 = Rp10.000

            // Contact & info
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            $table->text('address')->nullable();
            $table->text('about_us')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_settings');
    }
};
