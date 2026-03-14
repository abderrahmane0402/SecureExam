<?php

namespace Database\Factories;

use App\Models\ExamAttempt;
use App\Models\Question;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ExamAnswer>
 */
class ExamAnswerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'attempt_id' => ExamAttempt::factory(),
            'question_id' => Question::factory(),
            'selected_options' => null,
            'text_answer' => null,
            'is_correct' => null,
            'points_earned' => null,
            'instructor_feedback' => null,
        ];
    }

    public function withSelectedOptions(array $options): static
    {
        return $this->state(fn(array $attributes) => [
            'selected_options' => $options,
        ]);
    }

    public function withTextAnswer(string $answer): static
    {
        return $this->state(fn(array $attributes) => [
            'text_answer' => $answer,
        ]);
    }

    public function correct(float $points): static
    {
        return $this->state(fn(array $attributes) => [
            'is_correct' => true,
            'points_earned' => $points,
        ]);
    }

    public function incorrect(): static
    {
        return $this->state(fn(array $attributes) => [
            'is_correct' => false,
            'points_earned' => 0,
        ]);
    }
}
