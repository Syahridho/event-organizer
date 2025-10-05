<?php

namespace Database\Factories;

use App\Models\RentProperties;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\RentProperties>
 */
class RentPropertiesFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
   protected $model = RentProperties::class;

    public function definition(): array
    {
        return [
            'user_id' => 2,//User::factory(),
            'name' => $this->faker->company,
            'description' => $this->faker->paragraph,
            'thumbnail' => 'dubby.webp',
            'location' => $this->faker->address,
            'price' => $this->faker->numberBetween(1000000, 10000000),
            'status' => 'active',
        ];
    }
}
