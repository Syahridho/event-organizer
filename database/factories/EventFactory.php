<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Event>
 */
class EventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Ambil tanggal acak
        $eventStart = $this->faker->dateTimeBetween('+1 days', '+10 days');
        $eventEnd = (clone $eventStart)->modify('+2 hours');

        $ticketStart = $this->faker->dateTimeBetween('-5 days', '+0 days');
        $ticketEnd = (clone $eventStart)->modify('-1 days');

        return [
            'name' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph(),
            'event_mode' => $this->faker->randomElement(['Offline', 'Google Meet', 'Zoom']),

            'location' => $this->faker->address(),
            'pin' => $this->faker->postcode(),
            'link_meeting' => $this->faker->url(),
            'thumbnail' => '/default-event-images/dubby.webp', // atau pakai faker image generator

            'event_date_start' => $eventStart,
            'event_date_end' => $eventEnd,

            'ticket_date_start' => $ticketStart,
            'ticket_date_end' => $ticketEnd,

            'status' => $this->faker->randomElement(['Pending', 'Confirmed', 'Cancelled', 'Completed']),

            'user_id' => User::inRandomOrder()->first()?->id ?? User::factory(), // pastikan ada user
        ];
    }
}
