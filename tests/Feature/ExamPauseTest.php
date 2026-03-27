<?php

use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\Question;
use App\Models\User;
use Carbon\Carbon;

beforeEach(function () {
    $this->instructor = User::factory()->create(['role' => User::ROLE_INSTRUCTOR]);
    $this->student = User::factory()->create(['role' => User::ROLE_STUDENT]);
});

describe('Exam Pause System', function () {
    it('stops the timer on the backend when paused', function () {
        // Freeze time at a known point
        $now = Carbon::parse('2026-03-25 10:00:00');
        Carbon::setTestNow($now);

        $exam = Exam::factory()->for($this->instructor, 'instructor')->create([
            'duration_minutes' => 60,
        ]);

        $attempt = ExamAttempt::factory()
            ->for($exam)
            ->for($this->student, 'student')
            ->create([
                'status' => 'in_progress',
                'started_at' => $now,
            ]);

        // 1. Advance 10 minutes
        Carbon::setTestNow($now->copy()->addMinutes(10));
        $remainingBeforePause = $attempt->remaining_time; // should be 50 mins (3000s)
        expect($remainingBeforePause)->toBe(3000);

        // 2. Pause the exam
        $this->actingAs($this->instructor)
            ->post("/exams/{$exam->id}/attempts/{$attempt->id}/toggle-pause");

        $attempt->refresh();
        expect($attempt->is_paused)->toBeTrue();
        expect($attempt->paused_at->toDateTimeString())->toBe(now()->toDateTimeString());

        // 3. Advance 20 minutes while paused
        Carbon::setTestNow(now()->addMinutes(20));

        // Remaining time SHOULD NOT change while paused
        $attempt->refresh();
        expect($attempt->remaining_time)->toBe($remainingBeforePause);

        // 4. Resume the exam
        $this->actingAs($this->instructor)
            ->post("/exams/{$exam->id}/attempts/{$attempt->id}/toggle-pause");

        $attempt->refresh();
        expect($attempt->is_paused)->toBeFalse();
        // total_paused_seconds should be 20 minutes (1200s)
        expect($attempt->total_paused_seconds)->toBe(1200);

        // 5. Advance 10 minutes more after resume
        Carbon::setTestNow(now()->addMinutes(10));

        // Total time passed during active exam: 10 (pre-pause) + 10 (post-pause) = 20 mins.
        // Total duration: 60 mins.
        // Remaining: 40 mins (2400s).
        expect($attempt->remaining_time)->toBe(2400);

        Carbon::setTestNow(); // Reset time
    });

    it('prevents logging violations when paused', function () {
        $exam = Exam::factory()->for($this->instructor, 'instructor')->create();
        $attempt = ExamAttempt::factory()
            ->for($exam)
            ->for($this->student, 'student')
            ->create([
                'status' => 'in_progress',
                'is_paused' => true,
            ]);

        $response = $this->actingAs($this->student)->post("/exam/attempt/{$attempt->id}/violation", [
            'violation_type' => 'tab_switch',
            'details' => 'Should not be allowed when paused',
            'occurred_at' => now()->toDateTimeString(),
        ]);

        $response->assertStatus(400);
        $response->assertJson(['error' => 'Exam is currently paused']);
        $this->assertDatabaseMissing('violation_logs', [
            'attempt_id' => $attempt->id,
        ]);
    });

    it('prevents saving answers when paused', function () {
        $exam = Exam::factory()->for($this->instructor, 'instructor')->create();
        $question = Question::factory()->for($exam)->create();
        $attempt = ExamAttempt::factory()
            ->for($exam)
            ->for($this->student, 'student')
            ->create([
                'status' => 'in_progress',
                'is_paused' => true,
            ]);

        $response = $this->actingAs($this->student)->post("/exam/attempt/{$attempt->id}/answer", [
            'question_id' => $question->id,
            'text_answer' => 'This should not be saved',
        ]);

        $response->assertStatus(400);
        $response->assertJson(['error' => 'Exam is currently paused']);
        $this->assertDatabaseMissing('exam_answers', [
            'attempt_id' => $attempt->id,
            'question_id' => $question->id,
        ]);
    });
});
