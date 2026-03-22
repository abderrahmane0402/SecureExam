<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Exam>
 */
class ExamFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startTime = fake()->dateTimeBetween('now', '+1 week');
        $endTime = fake()->dateTimeBetween($startTime, '+2 weeks');

        return [
            'instructor_id' => User::factory()->instructor(),
            'title' => fake()->sentence(4),
            'type' => 'auto',
            'description' => fake()->paragraph(),
            'duration_minutes' => fake()->randomElement([30, 45, 60, 90, 120]),
            'start_time' => $startTime,
            'end_time' => $endTime,
            'allowed_attempts' => fake()->numberBetween(1, 3),
            'shuffle_questions' => fake()->boolean(30),
            'shuffle_options' => fake()->boolean(30),
            'show_results' => fake()->boolean(50),
            'passing_score' => fake()->randomElement([50.00, 60.00, 70.00, null]),
            'is_published' => false,
        ];
    }

    /**
     * Indicate that the exam is published.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_published' => true,
        ]);
    }

    /**
     * Indicate that the exam is currently active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'start_time' => now()->subHour(),
            'end_time' => now()->addDays(7),
            'is_published' => true,
        ]);
    }

    /**
     * Indicate that the exam has ended.
     */
    public function ended(): static
    {
        return $this->state(fn (array $attributes) => [
            'start_time' => now()->subWeek(),
            'end_time' => now()->subDay(),
            'is_published' => true,
        ]);
    }
}
