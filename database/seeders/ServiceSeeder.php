<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Service;
use App\Models\User;

class ServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ambil user pertama, atau buat dummy kalau belum ada
        $user = User::first() ?? User::factory()->create();

        for ($i = 1; $i <= 50; $i++) {
            Service::create([
                'user_id' => $user->id,
                'name' => "Service $i",
                'thumbnail' => "/randoms/" . rand(1, 5) . ".webp",
                'description' => "Deskripsi layanan ke-$i yang dibuat untuk contoh seeder.",
                'location' => "Lokasi $i",
                'price' => rand(50000, 500000),
                'status' => 'active',
            ]);
        }
    }
}
