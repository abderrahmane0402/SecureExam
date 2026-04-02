<?php

use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\User;
use App\Models\Question;
use App\Events\StudentHeartbeatReceived;
use App\Events\IndividualMessageBroadcast;
use App\Events\ExamAttemptStatusChanged;
use App\Events\ExamQuestionsUpdated;
use App\Events\ExamTimeExtended;
use Illuminate\Support\Facades\Event;

beforeEach(function () {
    $this->instructor = User::factory()->create(['role' => 'instructor']);
    $this->student = User::factory()->create(['role' => 'student']);
    $this->exam = Exam::factory()->create(['instructor_id' => $this->instructor->id]);
    $this->attempt = ExamAttempt::factory()->create([
        'exam_id' => $this->exam->id,
        'student_id' => $this->student->id,
        'status' => 'in_progress'
    ]);
});

test('heartbeat broadcasts StudentHeartbeatReceived event', function () {
    Event::fake([StudentHeartbeatReceived::class]);

    $this->actingAs($this->student)
        ->post(route('exam.heartbeat', $this->attempt))
        ->assertOk();

    Event::assertDispatched(StudentHeartbeatReceived::class, function ($event) {
        return $event->exam_id === $this->exam->id && 
               $event->attempt_id === $this->attempt->id;
    });
});

test('instructor can send individual message to student', function () {
    Event::fake([IndividualMessageBroadcast::class]);

    $this->actingAs($this->instructor)
        ->post(route('exams.attempts.message', [$this->exam, $this->attempt]), [
            'message' => 'Please stay in view of the camera.'
        ])
        ->assertOk();

    Event::assertDispatched(IndividualMessageBroadcast::class, function ($event) {
        return $event->exam_id === $this->exam->id && 
               $event->student_id === $this->student->id &&
               $event->message === 'Please stay in view of the camera.';
    });
});

test('force submit broadcasts ExamAttemptStatusChanged event', function () {
    Event::fake([ExamAttemptStatusChanged::class]);

    $this->actingAs($this->instructor)
        ->post(route('exams.attempts.force-submit', [$this->exam, $this->attempt]))
        ->assertRedirect();

    Event::assertDispatched(ExamAttemptStatusChanged::class, function ($event) {
        return $event->exam_id === $this->exam->id && 
               $event->student_id === $this->student->id &&
               $event->status === 'submitted';
    });
});

test('reset attempt broadcasts ExamAttemptStatusChanged event', function () {
    Event::fake([ExamAttemptStatusChanged::class]);

    $this->actingAs($this->instructor)
        ->post(route('exams.attempts.reset', [$this->exam, $this->attempt]))
        ->assertRedirect();

    Event::assertDispatched(ExamAttemptStatusChanged::class, function ($event) {
        return $event->exam_id === $this->exam->id && 
               $event->student_id === $this->student->id &&
               $event->status === 'reset';
    });
});

test('clear violations broadcasts ExamAttemptStatusChanged event', function () {
    Event::fake([ExamAttemptStatusChanged::class]);

    $this->actingAs($this->instructor)
        ->post(route('exams.attempts.reset-violations', [$this->exam, $this->attempt]))
        ->assertRedirect();

    Event::assertDispatched(ExamAttemptStatusChanged::class, function ($event) {
        return $event->exam_id === $this->exam->id && 
               $event->student_id === $this->student->id &&
               $event->status === 'violations_cleared';
    });
});

test('creating a question broadcasts ExamQuestionsUpdated event', function () {
    Event::fake([ExamQuestionsUpdated::class]);

    $this->actingAs($this->instructor)
        ->post(route('exams.questions.store', $this->exam), [
            'content' => 'New Question?',
            'type' => 'short_text',
            'points' => 5,
            'order' => 1
        ])
        ->assertRedirect();

    Event::assertDispatched(ExamQuestionsUpdated::class, function ($event) {
        return $event->exam_id === $this->exam->id && 
               $event->change_type === 'created';
    });
});

test('updating a question broadcasts ExamQuestionsUpdated event and resets answers', function () {
    $question = Question::factory()->create(['exam_id' => $this->exam->id]);
    // Create an answer for this question
    $this->attempt->answers()->create([
        'question_id' => $question->id,
        'text_answer' => 'Old Answer'
    ]);

    Event::fake([ExamQuestionsUpdated::class]);

    $this->actingAs($this->instructor)
        ->put(route('exams.questions.update', [$this->exam, $question]), [
            'content' => 'Updated Question?',
            'type' => 'short_text',
            'points' => 10,
            'order' => 1
        ])
        ->assertRedirect();

    Event::assertDispatched(ExamQuestionsUpdated::class, function ($event) use ($question) {
        return $event->exam_id === $this->exam->id && 
               $event->change_type === 'updated' &&
               $event->question_id === $question->id;
    });

    // Verify answer was reset
    expect($this->attempt->answers()->where('question_id', $question->id)->count())->toBe(0);
});

test('deleting a question broadcasts ExamQuestionsUpdated event', function () {
    $question = Question::factory()->create(['exam_id' => $this->exam->id]);

    Event::fake([ExamQuestionsUpdated::class]);

    $this->actingAs($this->instructor)
        ->delete(route('exams.questions.destroy', [$this->exam, $question]))
        ->assertRedirect();

    Event::assertDispatched(ExamQuestionsUpdated::class, function ($event) use ($question) {
        return $event->exam_id === $this->exam->id && 
               $event->change_type === 'deleted' &&
               $event->question_id === $question->id;
    });
});

test('extending time broadcasts ExamTimeExtended event', function () {
    Event::fake([ExamTimeExtended::class]);

    $this->actingAs($this->instructor)
        ->post(route('exams.attempts.extend-time', [$this->exam, $this->attempt]), [
            'minutes' => 15
        ])
        ->assertRedirect();

    Event::assertDispatched(ExamTimeExtended::class, function ($event) {
        return $event->exam_id === $this->exam->id && 
               $event->attempt_id === $this->attempt->id;
    });
});
