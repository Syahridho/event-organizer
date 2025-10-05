<?php

namespace Database\Factories;

use App\Models\Event;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Speaker>
 */
class SpeakerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'event_id' => Event::inRandomOrder()->first()?->id ?? Event::factory(), // pastikan ada Event
            'name' => $this->faker->name(),
            'photo' => 'default.jpg', // atau pakai faker image
            'description' => $this->faker->sentence(),
        ];
    }
}
