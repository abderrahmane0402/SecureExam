<?php

namespace Database\Factories;

use App\Models\Exam;
use App\Models\Question;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Question>
 */
class QuestionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'exam_id' => Exam::factory(),
            'type' => Question::TYPE_MULTIPLE_CHOICE_SINGLE,
            'content' => fake()->sentence() . '?',
            'image_path' => null,
            'points' => fake()->randomElement([1.00, 2.00, 5.00, 10.00]),
            'order' => fake()->numberBetween(1, 100),
            'correct_answer' => null,
            'grading_notes' => null,
        ];
    }

    public function multipleChoiceSingle(): static
    {
        return $this->state(fn(array $attributes) => [
            'type' => Question::TYPE_MULTIPLE_CHOICE_SINGLE,
        ]);
    }

    public function multipleChoiceMultiple(): static
    {
        return $this->state(fn(array $attributes) => [
            'type' => Question::TYPE_MULTIPLE_CHOICE_MULTIPLE,
        ]);
    }

    public function trueFalse(): static
    {
        return $this->state(fn(array $attributes) => [
            'type' => Question::TYPE_TRUE_FALSE,
            'correct_answer' => fake()->randomElement(['true', 'false']),
        ]);
    }

    public function shortText(): static
    {
        return $this->state(fn(array $attributes) => [
            'type' => Question::TYPE_SHORT_TEXT,
            'correct_answer' => fake()->word(),
        ]);
    }

    public function essay(): static
    {
        return $this->state(fn(array $attributes) => [
            'type' => Question::TYPE_ESSAY,
            'grading_notes' => fake()->sentence(),
        ]);
    }
}
