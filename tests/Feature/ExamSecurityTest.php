<?php

use App\Events\ExamViolationLogged;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\User;
use App\Models\ViolationLog;
use Illuminate\Support\Facades\Event;

beforeEach(function () {
    $this->instructor = User::factory()->create(['role' => User::ROLE_INSTRUCTOR]);
    $this->student = User::factory()->create(['role' => User::ROLE_STUDENT]);
});

describe('Exam Security', function () {
    it('can log reload_delay violation', function () {
        Event::fake();
        $exam = Exam::factory()->for($this->instructor, 'instructor')->create();
        $attempt = ExamAttempt::factory()
            ->for($exam)
            ->for($this->student, 'student')
            ->create(['status' => 'in_progress']);

        $response = $this->actingAs($this->student)->post("/exam/attempt/{$attempt->id}/violation", [
            'violation_type' => ViolationLog::TYPE_RELOAD_DELAY,
            'details' => 'User took more than 5 seconds to return to fullscreen after reload.',
            'occurred_at' => now()->toDateTimeString(),
            'severity' => 'medium',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('violation_logs', [
            'attempt_id' => $attempt->id,
            'violation_type' => ViolationLog::TYPE_RELOAD_DELAY,
            'severity' => 'medium',
        ]);

        $attempt->refresh();
        expect($attempt->violation_count)->toBe(1);

        Event::assertDispatched(ExamViolationLogged::class, function ($event) use ($exam) {
            return $event->exam_id === $exam->id && $event->type === ViolationLog::TYPE_RELOAD_DELAY;
        });
    });

    it('can auto-submit exam when violation limit reached', function () {
        Event::fake();
        $exam = Exam::factory()->for($this->instructor, 'instructor')->create();
        $attempt = ExamAttempt::factory()
            ->for($exam)
            ->for($this->student, 'student')
            ->create([
                'status' => 'in_progress',
                'violation_count' => 4,
            ]);

        // Log the 5th violation
        $response = $this->actingAs($this->student)->post("/exam/attempt/{$attempt->id}/violation", [
            'violation_type' => ViolationLog::TYPE_RELOAD_DELAY,
            'details' => 'Final violation',
            'occurred_at' => now()->toDateTimeString(),
            'severity' => 'medium',
        ]);

        $response->assertOk();
        $attempt->refresh();
        expect($attempt->violation_count)->toBe(5);
        expect($attempt->status)->toBe(ExamAttempt::STATUS_AUTO_SUBMITTED);

        $response->assertJson(['auto_submitted' => true]);
    });
});
