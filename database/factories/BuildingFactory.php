<?php

namespace Database\Factories;

use App\Models\Building;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Buildings>
 */
class BuildingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    protected $model = Building::class;

    public function definition(): array
    {
        
        return [
            'user_id' => User::where('role', 'mitra')->inRandomOrder()->value('id') ?? User::factory()->create(['role' => 'mitra'])->id,
            'name' => $this->faker->company . ' Hall',
            'location' => $this->faker->address,
            'description' => $this->faker->paragraph,
            'thumbnail' => 'dubby.webp',
            'pin' => $this->faker->latitude . ',' . $this->faker->longitude,
            'capacity' => (string) $this->faker->numberBetween(50, 1000),
            'price' => $this->faker->numberBetween(1000000, 10000000),
            'status' => 'active',
        ];
    }
}
