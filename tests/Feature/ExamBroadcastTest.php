<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\User;
use App\Events\Exam\ExamAnswerSaved;
use App\Events\Exam\ExamViolationLogged;
use Illuminate\Support\Facades\Event;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('answering a question broadcasts ExamAnswerSaved event', function () {
    // 1. Arrange
    Event::fake([ExamAnswerSaved::class]);
    
    $instructor = User::factory()->create(['role' => 'instructor']);
    $student = User::factory()->create(['role' => 'student']);
    $exam = Exam::factory()->create(['instructor_id' => $instructor->id]);
    $question = Question::factory()->create(['exam_id' => $exam->id]);
    $option = QuestionOption::factory()->create(['question_id' => $question->id]);
    $attempt = ExamAttempt::factory()->create([
        'exam_id' => $exam->id,
        'student_id' => $student->id,
        'status' => 'in_progress'
    ]);

    // 2. Act
    $this->actingAs($student)
        ->postJson(route('exam.save-answer', $attempt), [
            'question_id' => $question->id,
            'selected_options' => [$option->id],
        ])
        ->assertOk();

    // 3. Assert
    Event::assertDispatched(ExamAnswerSaved::class, function ($event) use ($exam, $attempt) {
        return (int) $event->examId === (int) $exam->id && 
               (int) $event->attemptId === (int) $attempt->id;
    });
});

test('logging a violation broadcasts ExamViolationLogged event', function () {
    // 1. Arrange
    Event::fake([ExamViolationLogged::class]);
    
    $instructor = User::factory()->create(['role' => 'instructor']);
    $student = User::factory()->create(['role' => 'student']);
    $exam = Exam::factory()->create(['instructor_id' => $instructor->id]);
    $attempt = ExamAttempt::factory()->create([
        'exam_id' => $exam->id,
        'student_id' => $student->id,
        'status' => 'in_progress'
    ]);

    // 2. Act
    $this->actingAs($student)
        ->postJson(route('exam.log-violation', $attempt), [
            'violation_type' => 'tab_switch',
            'details' => 'Student left the tab',
            'occurred_at' => now()->toIso8601String(),
        ])
        ->assertOk();

    // 3. Assert
    Event::assertDispatched(ExamViolationLogged::class, function ($event) use ($exam) {
        return (int) $event->exam_id === (int) $exam->id && 
               $event->type === 'tab_switch';
    });
});
