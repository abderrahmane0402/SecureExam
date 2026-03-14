<?php

namespace Database\Factories;

use App\Models\Question;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuestionOption>
 */
class QuestionOptionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'question_id' => Question::factory(),
            'content' => fake()->sentence(),
            'is_correct' => false,
            'order' => fake()->numberBetween(1, 10),
        ];
    }

    public function correct(): static
    {
        return $this->state(fn(array $attributes) => [
            'is_correct' => true,
        ]);
    }
}
