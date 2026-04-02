<?php

use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;

it('includes is_paused in the take view props', function () {
    $student = User::factory()->create(['role' => 'student']);
    $exam = Exam::factory()->create();
    $attempt = ExamAttempt::factory()->create([
        'exam_id' => $exam->id,
        'student_id' => $student->id,
        'status' => ExamAttempt::STATUS_IN_PROGRESS,
        'is_paused' => true,
    ]);

    actingAs($student)
        ->get(route('exam.take', $attempt))
        ->assertInertia(fn (Assert $page) => $page
            ->component('exams/student/take')
            ->has('attempt.is_paused')
            ->where('attempt.is_paused', true)
        );

    $attempt->update(['is_paused' => false]);

    actingAs($student)
        ->get(route('exam.take', $attempt))
        ->assertInertia(fn (Assert $page) => $page
            ->where('attempt.is_paused', false)
        );
});

it('includes is_paused in the heartbeat response', function () {
    Event::fake();
    $student = User::factory()->create(['role' => 'student']);
    $exam = Exam::factory()->create();
    $attempt = ExamAttempt::factory()->create([
        'exam_id' => $exam->id,
        'student_id' => $student->id,
        'status' => ExamAttempt::STATUS_IN_PROGRESS,
        'is_paused' => true,
    ]);

    actingAs($student)
        ->post(route('exam.heartbeat', $attempt))
        ->assertJson([
            'is_paused' => true,
        ]);

    $attempt->update(['is_paused' => false]);

    actingAs($student)
        ->post(route('exam.heartbeat', $attempt))
        ->assertJson([
            'is_paused' => false,
        ]);
});
