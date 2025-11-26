<?php

namespace Database\Seeders;

use App\Models\Event;
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
        // Reduced dummy data - only 3 items each for demo purposes
        Event::factory()->count(3)->create();
        Service::factory()->count(3)->create();
        Building::factory()->count(3)->create();
        RentProperty::factory()->count(3)->create();
    }
}