<?php

namespace Database\Factories;

use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ExamAttempt>
 */
class ExamAttemptFactory extends Factory
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
            'student_id' => User::factory()->student(),
            'attempt_number' => 1,
            'started_at' => now(),
            'submitted_at' => null,
            'status' => ExamAttempt::STATUS_IN_PROGRESS,
            'score' => null,
            'total_points' => null,
            'percentage' => null,
            'violation_count' => 0,
            'auto_submitted' => false,
            'ip_address' => fake()->ipv4(),
            'user_agent' => fake()->userAgent(),
        ];
    }

    public function submitted(): static
    {
        return $this->state(fn(array $attributes) => [
            'submitted_at' => now(),
            'status' => ExamAttempt::STATUS_SUBMITTED,
        ]);
    }

    public function graded(): static
    {
        return $this->state(fn(array $attributes) => [
            'submitted_at' => now()->subHour(),
            'status' => ExamAttempt::STATUS_GRADED,
            'score' => fake()->randomFloat(2, 0, 100),
            'total_points' => 100,
            'percentage' => fake()->randomFloat(2, 0, 100),
        ]);
    }

    public function autoSubmitted(): static
    {
        return $this->state(fn(array $attributes) => [
            'submitted_at' => now(),
            'status' => ExamAttempt::STATUS_AUTO_SUBMITTED,
            'auto_submitted' => true,
        ]);
    }
}
