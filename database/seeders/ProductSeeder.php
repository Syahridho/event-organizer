<?php

namespace Database\Seeders;

use App\Models\Service;
use App\Models\Building;
use App\Models\RentProperty;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Service::factory()->count(10)->create();
        Building::factory()->count(10)->create();
        RentProperty::factory()->count(10)->create();
    }
}