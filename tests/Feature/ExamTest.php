<?php

use App\Models\Exam;
use App\Models\ExamAnswer;
use App\Models\ExamAssignment;
use App\Models\ExamAttempt;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\User;
use App\Services\ExamGradingService;

beforeEach(function () {
    $this->instructor = User::factory()->create(['role' => User::ROLE_INSTRUCTOR]);
    $this->student = User::factory()->create(['role' => User::ROLE_STUDENT]);
});

describe('Instructor Exams', function () {
    it('can list exams', function () {
        $exam = Exam::factory()->for($this->instructor, 'instructor')->create();

        $response = $this->actingAs($this->instructor)->get('/exams');

        $response->assertOk();
        $response->assertInertia(
            fn ($page) => $page
                ->component('exams/instructor/index')
                ->has('exams.data', 1)
        );
    });

    it('can create an exam', function () {
        $examData = [
            'title' => 'Test Exam',
            'type' => 'auto',
            'description' => 'A test exam',
            'duration_minutes' => 60,
            'start_time' => now()->addDay()->toDateTimeString(),
            'end_time' => now()->addDays(7)->toDateTimeString(),
            'allowed_attempts' => 2,
            'shuffle_questions' => true,
            'shuffle_options' => true,
            'show_results' => true,
            'passing_score' => 70,
        ];

        $response = $this->actingAs($this->instructor)->post('/exams', $examData);

        $response->assertRedirect();
        $this->assertDatabaseHas('exams', [
            'title' => 'Test Exam',
            'instructor_id' => $this->instructor->id,
        ]);
    });

    it('can add questions to an exam', function () {
        $exam = Exam::factory()->for($this->instructor, 'instructor')->create();

        $questionData = [
            'type' => 'multiple_choice_single',
            'content' => 'What is 2 + 2?',
            'points' => 5,
            'options' => [
                ['content' => '3', 'is_correct' => false],
                ['content' => '4', 'is_correct' => true],
                ['content' => '5', 'is_correct' => false],
            ],
        ];

        $response = $this->actingAs($this->instructor)->post("/exams/{$exam->id}/questions", $questionData);

        $response->assertRedirect();
        $this->assertDatabaseHas('questions', [
            'exam_id' => $exam->id,
            'content' => 'What is 2 + 2?',
            'points' => 5,
        ]);
    });

    it('can assign students to an exam', function () {
        $exam = Exam::factory()->for($this->instructor, 'instructor')->create();

        $response = $this->actingAs($this->instructor)->post("/exams/{$exam->id}/assign", [
            'student_ids' => [$this->student->id],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('exam_assignments', [
            'exam_id' => $exam->id,
            'student_id' => $this->student->id,
        ]);
    });

    it('can bulk assign students to an exam via emails', function () {
        $exam = Exam::factory()->for($this->instructor, 'instructor')->create();
        $student1 = User::factory()->create(['role' => User::ROLE_STUDENT, 'email' => 'student1@example.com']);
        $student2 = User::factory()->create(['role' => User::ROLE_STUDENT, 'email' => 'student2@example.com']);
        
        $response = $this->actingAs($this->instructor)->post("/exams/{$exam->id}/assign", [
            'emails' => "student1@example.com, student2@example.com\nnonexistent@example.com",
            'student_ids' => [$this->student->id], // Mix of IDs and emails
        ]);

        $response->assertRedirect();
        
        // Should have all 3 students assigned
        $this->assertDatabaseHas('exam_assignments', ['exam_id' => $exam->id, 'student_id' => $this->student->id]);
        $this->assertDatabaseHas('exam_assignments', ['exam_id' => $exam->id, 'student_id' => $student1->id]);
        $this->assertDatabaseHas('exam_assignments', ['exam_id' => $exam->id, 'student_id' => $student2->id]);
        
        expect($exam->assignedStudents()->count())->toBe(3);
    });

    it('prevents students from creating exams', function () {
        $response = $this->actingAs($this->student)->post('/exams', [
            'title' => 'Unauthorized Exam',
            'duration_minutes' => 60,
            'start_time' => now()->addDay()->toDateTimeString(),
            'end_time' => now()->addDays(7)->toDateTimeString(),
        ]);

        $response->assertForbidden();
    });
});

describe('Student Exams', function () {
    it('can view assigned exams', function () {
        $exam = Exam::factory()->published()->for($this->instructor, 'instructor')->create();
        ExamAssignment::create([
            'exam_id' => $exam->id,
            'student_id' => $this->student->id,
            'assigned_at' => now(),
        ]);

        $response = $this->actingAs($this->student)->get('/student/exams');

        $response->assertOk();
    });

    it('can start an exam attempt', function () {
        $exam = Exam::factory()
            ->published()
            ->for($this->instructor, 'instructor')
            ->create([
                'start_time' => now()->subHour(),
                'end_time' => now()->addHours(2),
            ]);

        ExamAssignment::create([
            'exam_id' => $exam->id,
            'student_id' => $this->student->id,
            'assigned_at' => now(),
        ]);

        $response = $this->actingAs($this->student)->post("/student/exams/{$exam->id}/start");

        $response->assertRedirect();
        $this->assertDatabaseHas('exam_attempts', [
            'exam_id' => $exam->id,
            'student_id' => $this->student->id,
            'status' => 'in_progress',
        ]);
    });

    it('cannot start an exam without assignment', function () {
        $exam = Exam::factory()->published()->for($this->instructor, 'instructor')->create([
            'start_time' => now()->subHour(),
            'end_time' => now()->addHours(2),
        ]);

        $response = $this->actingAs($this->student)->post("/student/exams/{$exam->id}/start");

        $response->assertForbidden();
    });
});

describe('Exam Grading', function () {
    it('auto-grades multiple choice questions correctly', function () {
        $exam = Exam::factory()->for($this->instructor, 'instructor')->create();
        $question = Question::factory()->for($exam)->create([
            'type' => Question::TYPE_MULTIPLE_CHOICE_SINGLE,
            'points' => 10,
        ]);
        $correctOption = QuestionOption::factory()->for($question)->create(['is_correct' => true]);
        $wrongOption = QuestionOption::factory()->for($question)->create(['is_correct' => false]);

        $attempt = ExamAttempt::factory()
            ->for($exam)
            ->for($this->student, 'student')
            ->create(['total_points' => 10]);

        // Correct answer
        $answer = ExamAnswer::factory()
            ->for($attempt, 'attempt')
            ->for($question)
            ->create(['selected_options' => [$correctOption->id]]);

        $service = new ExamGradingService;
        $service->gradeAnswer($answer);

        $answer->refresh();
        expect($answer->is_correct)->toBeTrue();
        expect((float) $answer->points_earned)->toBe(10.0);
    });

    it('auto-grades true/false questions correctly', function () {
        $exam = Exam::factory()->for($this->instructor, 'instructor')->create();
        $question = Question::factory()->for($exam)->create([
            'type' => Question::TYPE_TRUE_FALSE,
            'points' => 5,
        ]);

        // Create true/false options
        $trueOption = QuestionOption::factory()->for($question)->create([
            'content' => 'True',
            'is_correct' => true,
        ]);
        QuestionOption::factory()->for($question)->create([
            'content' => 'False',
            'is_correct' => false,
        ]);

        $attempt = ExamAttempt::factory()
            ->for($exam)
            ->for($this->student, 'student')
            ->create(['total_points' => 5]);

        // Correct answer - selecting the True option
        $answer = ExamAnswer::factory()
            ->for($attempt, 'attempt')
            ->for($question)
            ->create(['selected_options' => [$trueOption->id]]);

        $service = new ExamGradingService;
        $service->gradeAnswer($answer);

        $answer->refresh();
        expect($answer->is_correct)->toBeTrue();
        expect((float) $answer->points_earned)->toBe(5.0);
    });

    it('does not auto-grade essay questions', function () {
        $exam = Exam::factory()->for($this->instructor, 'instructor')->create();
        $question = Question::factory()->for($exam)->create([
            'type' => Question::TYPE_ESSAY,
            'points' => 20,
        ]);

        $attempt = ExamAttempt::factory()
            ->for($exam)
            ->for($this->student, 'student')
            ->create(['total_points' => 20]);

        $answer = ExamAnswer::factory()
            ->for($attempt, 'attempt')
            ->for($question)
            ->create(['text_answer' => 'This is my essay response.']);

        $service = new ExamGradingService;
        $service->gradeAnswer($answer);

        $answer->refresh();
        expect($answer->is_correct)->toBeNull();
        expect($answer->points_earned)->toEqual(0.0);
    });
});
