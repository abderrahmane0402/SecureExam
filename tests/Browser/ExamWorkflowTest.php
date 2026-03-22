<?php

use App\Models\Exam;
use App\Models\Question;
use Laravel\Dusk\Browser;

describe('Exam Workflow', function () {
    it('allows an instructor to create an exam and add questions', function () {
        $instructor = createInstructor();

        $this->browse(function (Browser $browser) use ($instructor) {
            $browser->loginAs($instructor)
                ->visit('/exams')
                ->waitForText('Create Exam')
                ->clickLink('Create Exam')
                ->waitForLocation('/exams/create')
                ->type('#title', 'Browser Test Exam')
                ->type('#duration', '60')
                ->type('#start_time', '12312026'."\t".'1000AM')
                ->type('#end_time', '12312027'."\t".'1000AM')
                ->click('button[type="submit"]')
                ->waitForText('Configure Content', 20)
                ->assertSee('Browser Test Exam');

            $exam = Exam::where('title', 'Browser Test Exam')->first();

            // Add a question
            $browser->visit("/exams/{$exam->id}/edit")
                ->waitForText('Add Question')
                ->press('Add Question')
                ->waitForText('New Question')
                ->type('#content', 'What is 2+2?')
                ->type('#points', '5')
                ->type('input[placeholder="Option 1"]', '4')
                ->type('input[placeholder="Option 2"]', '5')
                // Click the first checkbox (for Option 1)
                ->click('div.space-y-3 button[role="checkbox"]:nth-of-type(1)')
                ->select('select', 'multiple_choice_single')
                // Use a more specific selector for the "Add Question" button in the form
                ->click('div.flex.gap-2 button[type="submit"]')
                ->waitForText('Questions (1)', 15);
        });
    });

    it('allows a student to take an exam and saves answers', function () {
        $student = createStudent();
        $exam = Exam::factory()->published()->create([
            'title' => 'Student Test Exam',
            'start_time' => now()->subDay(),
            'end_time' => now()->addDay(),
            'allowed_attempts' => 3,
            'show_results' => true,
        ]);
        $question = Question::factory()->multipleChoiceSingle()->for($exam)->create([
            'content' => 'Sample Question',
        ]);

        \App\Models\QuestionOption::factory()->create([
            'question_id' => $question->id,
            'content' => 'Option A',
            'is_correct' => true,
        ]);
        \App\Models\QuestionOption::factory()->create([
            'question_id' => $question->id,
            'content' => 'Option B',
            'is_correct' => false,
        ]);

        $exam->assignedStudents()->attach($student, ['assigned_at' => now()]);

        $this->browse(function (Browser $browser) use ($student, $exam) {
            $browser->loginAs($student)
                ->visit("/student/exams/{$exam->id}?no_security=1")
                ->waitForText($exam->title)
                ->waitForText('I understand the exam rules')
                ->click('#acknowledge')
                ->pause(500)
                ->scrollIntoView('[data-test="start-exam-button"]')
                ->waitFor('[data-test="start-exam-button"]')
                ->click('[data-test="start-exam-button"]')
                // The exam might auto-start if a few seconds passed, or show the pre-take screen
                ->waitUntilMissing('[data-test="start-exam-button"]', 20)
                ->pause(1000);

            // Mock Fullscreen API if we are on the take page
            $browser->script([
                "window.Object.defineProperty(document, 'fullscreenElement', { get: function() { return document.documentElement; }, configurable: true });",
                "window.dispatchEvent(new Event('fullscreenchange'));",
            ]);

            $browser->pause(1000);

            // If we see "Before you begin", press Start
            if ($browser->resolver->find('button:contains("Start Exam")')) {
                $browser->press('Start Exam');
            }

            $browser->waitForText('Sample Question', 20);

            // Answer question
            $browser->click('label:nth-child(1) input[type="radio"]')
                ->pause(2000)
                ->click('[data-test="header-submit-button"]')
                ->waitForText('Submit Exam?', 15)
                ->click('[data-test="confirm-submit-button"]')
                ->waitForLocation("/student/exams/{$exam->id}/results", 20)
                ->assertSee('Results');
        });
    });
});
