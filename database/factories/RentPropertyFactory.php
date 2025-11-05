<?php

namespace Database\Factories;

use App\Models\RentProperty;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\RentProperty>
 */
class RentPropertyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
   protected $model = RentProperty::class;

    public function definition(): array
    {
        return [
            'user_id' => User::where('role', 'mitra')->inRandomOrder()->value('id') ?? User::factory()->create(['role' => 'mitra'])->id,
            'name' => $this->faker->company,
            'description' => $this->faker->paragraph,
            'thumbnail' => 'dubby.webp',
            'location' => $this->faker->address,
            'delivered' => $this->faker->boolean(50),
            'picked_up' => $this->faker->boolean(50),
            'price' => $this->faker->numberBetween(1000000, 10000000),
            'status' => 'active',
        ];
    }
}