<?php

namespace Database\Factories;

use App\Models\ExamAttempt;
use App\Models\ViolationLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ViolationLog>
 */
class ViolationLogFactory extends Factory
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
            'violation_type' => fake()->randomElement(ViolationLog::TYPES),
            'details' => fake()->sentence(),
            'occurred_at' => now(),
            'ip_address' => fake()->ipv4(),
        ];
    }

    public function tabSwitch(): static
    {
        return $this->state(fn(array $attributes) => [
            'violation_type' => ViolationLog::TYPE_TAB_SWITCH,
        ]);
    }

    public function windowBlur(): static
    {
        return $this->state(fn(array $attributes) => [
            'violation_type' => ViolationLog::TYPE_WINDOW_BLUR,
        ]);
    }

    public function fullscreenExit(): static
    {
        return $this->state(fn(array $attributes) => [
            'violation_type' => ViolationLog::TYPE_FULLSCREEN_EXIT,
        ]);
    }
}
