<?php

use App\Events\ExamAnswerSaved;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\User;
use Illuminate\Support\Facades\Event;

test('answer saving broadcasts a progress event', function () {
    Event::fake();

    $student = User::factory()->student()->create();
    $exam = Exam::factory()->create();
    $question = Question::factory()->for($exam)->create();
    $option = QuestionOption::factory()->for($question)->create();

    $attempt = ExamAttempt::factory()->for($exam)->for($student, 'student')->create([
        'status' => 'in_progress',
    ]);

    $this->actingAs($student)
        ->post(route('exam.save-answer', $attempt), [
            'question_id' => $question->id,
            'selected_options' => [$option->id],
        ])
        ->assertOk();

    Event::assertDispatched(ExamAnswerSaved::class, function ($event) use ($exam, $attempt) {
        return $event->examId === $exam->id
            && $event->attemptId === $attempt->id
            && $event->answeredCount === 1;
    });
});
