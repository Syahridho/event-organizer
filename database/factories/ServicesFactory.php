<?php

namespace Database\Factories;

use App\Models\Services;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ServicesFactory extends Factory
{
    protected $model = Services::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(), // atau gunakan id user tertentu
            'name' => $this->faker->word(),
            'thumbnail' => $this->faker->imageUrl(640, 480, 'services'),
            'description' => $this->faker->paragraph(),
            'location' => $this->faker->city(),
            'price' => $this->faker->numberBetween(10000, 1000000),
            'status' => $this->faker->randomElement(['active', 'inactive']),
        ];
    }
}
