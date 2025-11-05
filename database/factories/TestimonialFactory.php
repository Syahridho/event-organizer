<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Testimonial>
 */
class TestimonialFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'author_name' => $this->faker->name(),
            'author_title' => $this->faker->jobTitle(),
            'quote' => $this->faker->paragraph(2),
            'star_rating' => $this->faker->numberBetween(3, 5),
            'author_image_url' => 'https://picsum.photos/300/300?random=' . $this->faker->numberBetween(1, 1000),
        ];
    }
}
