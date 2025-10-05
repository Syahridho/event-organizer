<?php

namespace Database\Factories;

use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ServiceFactory extends Factory
{
    protected $model = Service::class;

    public function definition(): array
    {
        return [
            'user_id' =>  2, //User::factory(), // atau gunakan id user tertentu
            'name' => $this->faker->word(),
            'thumbnail' => 'dubby.webp',
            'description' => $this->faker->paragraph(),
            'location' => $this->faker->city(),
            'price' => $this->faker->numberBetween(10000, 1000000),
            'status' => 'active',
        ];
    }
}
