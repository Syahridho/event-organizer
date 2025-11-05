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
            'seo_title'     => 'Event Organizer - Platform Event Terpercaya',
            'seo_description' => 'Temukan dan pesan event, gedung, layanan, dan properti dengan mudah di Event Organizer. Platform terpercaya untuk semua kebutuhan acara Anda.',
            'seo_keywords'  => 'event organizer, sewa gedung, booking event, layanan event, properti, jakarta event',
            'seo_image'     => '/images/seo-default.jpg',
            'seo_twitter_card' => 'summary_large_image',
            'seo_og_type'   => 'website',
            'seo_canonical_url' => url('/'),
            'seo_robots'    => 'index',
            'seo_author'    => 'Event Organizer Team',
            'seo_publisher' => 'Event Organizer',
            'maintenance_mode' => false,
        ]);
    }
}
