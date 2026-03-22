<?php

use App\Models\Exam;
use App\Models\Question;
use App\Models\ViolationLog;
use Laravel\Dusk\Browser;

describe('Security Violations', function () {
    it('logs a violation when the student switches tabs', function () {
        $student = createStudent();
        $exam = Exam::factory()->published()->create();
        $question = Question::factory()->for($exam)->create();
        $exam->students()->attach($student);

        $this->browse(function (Browser $browser) use ($student, $exam) {
            $browser->loginAs($student)
                ->visit("/student/exams/{$exam->id}")
                ->press('Begin Attempt')
                ->waitForLocation('/exam/take/*')
                ->assertSee('Question 1');

            // Simulate window blur (tab switching)
            $browser->script("window.dispatchEvent(new Event('blur'))");

            // Wait for the violation to be logged (may take a second to hit the API)
            $browser->pause(2000);

            $this->assertDatabaseHas('violation_logs', [
                'violation_type' => ViolationLog::TYPE_TAB_SWITCH,
            ]);

            $browser->assertSee('Exam Locked') // Assuming a modal appears
                ->assertSee('Security Violation Detected');
        });
    });

    it('blocks copy and paste events during the exam', function () {
        $student = createStudent();
        $exam = Exam::factory()->published()->create();
        $exam->students()->attach($student);

        $this->browse(function (Browser $browser) use ($student, $exam) {
            $browser->loginAs($student)
                ->visit("/student/exams/{$exam->id}")
                ->press('Begin Attempt')
                ->waitForLocation('/exam/take/*');

            // Attempt to trigger a paste event
            $browser->script("document.dispatchEvent(new Event('paste'))");
            $browser->pause(1000);

            $this->assertDatabaseHas('violation_logs', [
                'violation_type' => ViolationLog::TYPE_COPY_PASTE,
            ]);
        });
    });
});
