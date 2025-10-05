<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AdminSetting;

class AdminSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        AdminSetting::create([
            'site_name'     => 'Event Organizer',
            'logo'          => null,
            'currency'      => 'IDR',
            'payment_time'  => 180,              
            'tax_type'      => 'percent',       
            'tax_value'     => 3.00,            
            'contact_email' => 'admin@example.com',
            'contact_phone' => '081234567890',
            'address'       => 'Jl. Contoh No. 123, Jakarta',
            'about_us'      => 'Aplikasi Event Organizer untuk mengatur event dan transaksi.',
        ]);
    }
}
