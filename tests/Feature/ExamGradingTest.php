<?php

use App\Models\Exam;
use App\Models\ExamAnswer;
use App\Models\ExamAssignment;
use App\Models\ExamAttempt;
use App\Models\Question;
use App\Models\User;

beforeEach(function () {
    $this->instructor = User::factory()->create(['role' => User::ROLE_INSTRUCTOR]);
    $this->student = User::factory()->create(['role' => User::ROLE_STUDENT]);
});

describe('Grading System', function () {
    it('accurately calculates completed attempts in grading index', function () {
        $exam = Exam::factory()->for($this->instructor, 'instructor')->create();

        ExamAssignment::factory()->create(['exam_id' => $exam->id, 'student_id' => $this->student->id]);

        // One submitted attempt, one graded attempt
        ExamAttempt::factory()->create([
            'exam_id' => $exam->id,
            'student_id' => $this->student->id,
            'status' => 'submitted',
        ]);

        $otherStudent = User::factory()->create(['role' => User::ROLE_STUDENT]);
        ExamAttempt::factory()->create([
            'exam_id' => $exam->id,
            'student_id' => $otherStudent->id,
            'status' => 'graded',
        ]);

        $response = $this->actingAs($this->instructor)->get("/grading/{$exam->id}");
        $response->assertOk();

        $response->assertInertia(fn ($page) => $page
            ->component('exams/grading/index')
            ->where('stats.total', 2)
            ->where('stats.completed', 1)
        );
    });

    it('can bulk auto-grade selected attempts', function () {
        $exam = Exam::factory()->for($this->instructor, 'instructor')->create();

        $attempt1 = ExamAttempt::factory()->create([
            'exam_id' => $exam->id,
            'status' => 'submitted',
            'score' => null,
        ]);

        $attempt2 = ExamAttempt::factory()->create([
            'exam_id' => $exam->id,
            'status' => 'submitted',
            'score' => null,
        ]);

        $response = $this->actingAs($this->instructor)->post("/grading/{$exam->id}/bulk-auto-grade", [
            'attempt_ids' => [$attempt1->id, $attempt2->id],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('exam_attempts', ['id' => $attempt1->id, 'status' => 'graded']);
        $this->assertDatabaseHas('exam_attempts', ['id' => $attempt2->id, 'status' => 'graded']);
    });

    it('can apply a percentage penalty and calculates deduction', function () {
        $exam = Exam::factory()->for($this->instructor, 'instructor')->create();
        $attempt = ExamAttempt::factory()->create([
            'exam_id' => $exam->id,
            'status' => 'submitted',
        ]);

        $response = $this->actingAs($this->instructor)->post("/grading/attempt/{$attempt->id}/penalty", [
            'mode' => 'penalty',
            'penalty_points' => 10,
            'reason' => 'Used a mobile phone.',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('exam_attempts', [
            'id' => $attempt->id,
            'penalty_points' => 10,
            'penalty_reason' => 'Used a mobile phone.',
        ]);
    });

    it('can apply a zero penalty', function () {
        $exam = Exam::factory()->for($this->instructor, 'instructor')->create();
        $attempt = ExamAttempt::factory()->create([
            'exam_id' => $exam->id,
            'status' => 'submitted',
        ]);

        $response = $this->actingAs($this->instructor)->post("/grading/attempt/{$attempt->id}/penalty", [
            'mode' => 'zero',
            'reason' => 'Zero tolerance.',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('exam_attempts', [
            'id' => $attempt->id,
            'penalty_points' => $exam->total_points,
            'penalty_reason' => 'Zero tolerance.',
        ]);
    });

    it('can remove a penalty', function () {
        $exam = Exam::factory()->for($this->instructor, 'instructor')->create();
        $attempt = ExamAttempt::factory()->create([
            'exam_id' => $exam->id,
            'status' => 'submitted',
            'penalty_points' => 10,
            'penalty_reason' => 'Testing',
        ]);

        $response = $this->actingAs($this->instructor)->post("/grading/attempt/{$attempt->id}/penalty", [
            'mode' => 'none',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('exam_attempts', [
            'id' => $attempt->id,
            'penalty_points' => null,
            'penalty_reason' => null,
        ]);
    });

    it('can grade an individual answer with partial credit and returns updated live score', function () {
        $exam = Exam::factory()->for($this->instructor, 'instructor')->create();

        $question = Question::factory()->create([
            'exam_id' => $exam->id,
            'type' => 'essay',
            'points' => 10,
        ]);

        $attempt = ExamAttempt::factory()->create([
            'exam_id' => $exam->id,
            'status' => 'submitted',
        ]);

        $answer = ExamAnswer::factory()->create([
            'attempt_id' => $attempt->id,
            'question_id' => $question->id,
            'points_earned' => null,
            'is_correct' => null,
        ]);

        $response = $this->actingAs($this->instructor)->postJson("/grading/attempt/{$attempt->id}/answer", [
            'answer_id' => $answer->id,
            'points_earned' => 5,
            'feedback' => 'Half correct',
        ]);

        $response->assertOk();
        $response->assertJsonStructure(['success', 'running_total']);

        $this->assertDatabaseHas('exam_answers', [
            'id' => $answer->id,
            'points_earned' => 5,
            'is_correct' => false, // Because 5 < 10
            'instructor_feedback' => 'Half correct',
        ]);
    });

    it('finalizes attempt with proper deduction scaling', function () {
        $exam = Exam::factory()->for($this->instructor, 'instructor')->create();

        // 100 points exam
        $q1 = Question::factory()->create(['exam_id' => $exam->id, 'points' => 50]);
        $q2 = Question::factory()->create(['exam_id' => $exam->id, 'points' => 50]);

        $attempt = ExamAttempt::factory()->create([
            'exam_id' => $exam->id,
            'status' => 'submitted',
            'penalty_points' => 20, // 20 points deduction
            'penalty_reason' => 'Late',
        ]);

        ExamAnswer::factory()->create([
            'attempt_id' => $attempt->id,
            'question_id' => $q1->id,
            'points_earned' => 50, // Full credit
        ]);
        ExamAnswer::factory()->create([
            'attempt_id' => $attempt->id,
            'question_id' => $q2->id,
            'points_earned' => 0, // No credit
        ]);

        $response = $this->actingAs($this->instructor)->post("/grading/attempt/{$attempt->id}/finalize");

        $response->assertRedirect();

        // Earned 50 points, minus 20 points penalty = 30 points final score. 30% percentage.
        $this->assertDatabaseHas('exam_attempts', [
            'id' => $attempt->id,
            'status' => 'graded',
            'score' => 30,
            'percentage' => 30,
        ]);
    });
});

describe('Grade Publication', function () {
    it('can toggle publication status of an attempt', function () {
        $exam = Exam::factory()->create(['instructor_id' => $this->instructor->id]);
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $attempt = ExamAttempt::factory()->create([
            'exam_id' => $exam->id,
            'student_id' => $student->id,
            'status' => 'graded',
            'is_published' => false,
        ]);

        $response = $this->actingAs($this->instructor)->post("/grading/attempt/{$attempt->id}/publish");

        $response->assertRedirect();
        $this->assertTrue($attempt->refresh()->is_published);
        $this->assertNotNull($attempt->published_at);

        // Toggle back
        $response = $this->actingAs($this->instructor)->post("/grading/attempt/{$attempt->id}/publish");
        $response->assertRedirect();
        $this->assertFalse($attempt->refresh()->is_published);
    });

    it('can bulk publish all graded attempts for an exam', function () {
        $exam = Exam::factory()->create(['instructor_id' => $this->instructor->id]);

        $attempt1 = ExamAttempt::factory()->create([
            'exam_id' => $exam->id,
            'student_id' => $this->student->id,
            'status' => 'graded',
            'is_published' => false,
        ]);

        $attempt2 = ExamAttempt::factory()->create([
            'exam_id' => $exam->id,
            'student_id' => User::factory()->create(['role' => User::ROLE_STUDENT])->id,
            'status' => 'graded',
            'is_published' => false,
        ]);

        $attempt3 = ExamAttempt::factory()->create([
            'exam_id' => $exam->id,
            'student_id' => User::factory()->create(['role' => User::ROLE_STUDENT])->id,
            'status' => 'submitted', // Should not be published
            'is_published' => false,
        ]);

        $response = $this->actingAs($this->instructor)->post("/grading/{$exam->id}/bulk-publish");

        $response->assertRedirect();
        $this->assertTrue($attempt1->refresh()->is_published);
        $this->assertTrue($attempt2->refresh()->is_published);
        $this->assertFalse($attempt3->refresh()->is_published);
    });
});

describe('Student Grade View', function () {
    it('shows only published grades in results list', function () {
        $exam1 = Exam::factory()->create(['instructor_id' => $this->instructor->id, 'title' => 'Published Exam']);
        $exam2 = Exam::factory()->create(['instructor_id' => $this->instructor->id, 'title' => 'Unpublished Exam']);

        ExamAssignment::factory()->create(['exam_id' => $exam1->id, 'student_id' => $this->student->id]);
        ExamAssignment::factory()->create(['exam_id' => $exam2->id, 'student_id' => $this->student->id]);

        // Published attempt
        ExamAttempt::factory()->create([
            'exam_id' => $exam1->id,
            'student_id' => $this->student->id,
            'status' => 'graded',
            'is_published' => true,
        ]);

        // Graded but unpublished attempt
        ExamAttempt::factory()->create([
            'exam_id' => $exam2->id,
            'student_id' => $this->student->id,
            'status' => 'graded',
            'is_published' => false,
        ]);

        $response = $this->actingAs($this->student)->get('/student/results');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('exams/student/my-results')
            ->has('attempts')
        );

        // Check first attempt data if exists
        $attempts = $response->original->getData()['page']['props']['attempts'];
        $this->assertCount(1, $attempts);
        $this->assertEquals('Published Exam', $attempts[0]['exam']['title']);
    });

    it('denies access to unpublished grade details', function () {
        $exam = Exam::factory()->create(['instructor_id' => $this->instructor->id]);
        ExamAssignment::factory()->create(['exam_id' => $exam->id, 'student_id' => $this->student->id]);

        $attempt = ExamAttempt::factory()->create([
            'exam_id' => $exam->id,
            'student_id' => $this->student->id,
            'status' => 'graded',
            'is_published' => false,
        ]);

        $response = $this->actingAs($this->student)->get("/student/exams/{$exam->id}/attempts/{$attempt->id}");

        $response->assertForbidden();
    });

    it('hides question details if show_results is false', function () {
        $exam = Exam::factory()->create(['instructor_id' => $this->instructor->id, 'show_results' => false]);
        ExamAssignment::factory()->create(['exam_id' => $exam->id, 'student_id' => $this->student->id]);

        $attempt = ExamAttempt::factory()->create([
            'exam_id' => $exam->id,
            'student_id' => $this->student->id,
            'status' => 'graded',
            'is_published' => true,
        ]);

        Question::factory()->create(['exam_id' => $exam->id]);

        $response = $this->actingAs($this->student)->get("/student/exams/{$exam->id}/attempts/{$attempt->id}");

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('exams/student/grade')
            ->where('exam.show_results', false)
            ->missing('exam.questions')
        );
    });

    it('shows question details if show_results is true', function () {
        $exam = Exam::factory()->create(['instructor_id' => $this->instructor->id, 'show_results' => true]);
        ExamAssignment::factory()->create(['exam_id' => $exam->id, 'student_id' => $this->student->id]);

        $attempt = ExamAttempt::factory()->create([
            'exam_id' => $exam->id,
            'student_id' => $this->student->id,
            'status' => 'graded',
            'is_published' => true,
        ]);

        $question = Question::factory()->create(['exam_id' => $exam->id]);
        ExamAnswer::factory()->create([
            'attempt_id' => $attempt->id,
            'question_id' => $question->id,
        ]);

        $response = $this->actingAs($this->student)->get("/student/exams/{$exam->id}/attempts/{$attempt->id}");

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('exams/student/grade')
            ->where('exam.show_results', true)
            ->has('exam.questions')
        );

        $props = $response->original->getData()['page']['props'];
        $this->assertArrayHasKey('questions', $props['exam']);
        $this->assertCount(1, $props['exam']['questions']);
    });
});
