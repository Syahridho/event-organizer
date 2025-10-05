<?php

namespace Database\Factories;

use App\Models\Event;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ticket>
 */
class TicketFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $ticketNames = ['Free' => 0, 'Regular' => 20000, 'VIP' => 50000, 'VVIP' => 100000];
        $name = $this->faker->randomElement(array_keys($ticketNames));

        return [
            'name' => $name,
            'price' => $ticketNames[$name],
            'quota' => $this->faker->numberBetween(10, 100),
            'event_id' => Event::inRandomOrder()->first()?->id ?? Event::factory(),
        ];
    }
}
