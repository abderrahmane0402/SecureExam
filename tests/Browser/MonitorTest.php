<?php

namespace Tests\Browser;

use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\User;
use App\Models\ViolationLog;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class MonitorTest extends DuskTestCase
{
    public function test_instructor_can_monitor_live_exam(): void
    {
        $instructor = User::factory()->instructor()->create();
        $student = User::factory()->student()->create();

        $exam = Exam::factory()->for($instructor, 'instructor')->create([
            'title' => 'Biology Midterm',
            'is_published' => true,
        ]);

        $attempt = ExamAttempt::factory()
            ->for($exam)
            ->for($student, 'student')
            ->create([
                'status' => 'in_progress',
                'started_at' => now(),
            ]);

        // Create a critical violation to see if the UI highlights it
        ViolationLog::factory()->create([
            'attempt_id' => $attempt->id,
            'violation_type' => ViolationLog::TYPE_TAB_SWITCH,
            'severity' => ViolationLog::SEVERITY_CRITICAL,
            'details' => 'Student left the exam for 45 seconds',
            'occurred_at' => now(),
        ]);

        $this->browse(function (Browser $browser) use ($instructor, $exam, $student) {
            $browser->loginAs($instructor)
                ->visit("/exams/{$exam->id}/monitor")
                ->waitForText('Biology Midterm')
                ->assertSee($student->name)
                ->assertSee('in progress')
                ->assertSee('Security Events');
        });
    }
}
