<?php

namespace Database\Seeders;

use App\Models\Exam;
use App\Models\Question;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class GradingTestDataSeeder extends Seeder
{
    public function run(): void
    {
        // Add a manual question to Exam 1
        $examId = 1;
        $exam = Exam::find($examId);

        if (! $exam) {
            echo "Exam 1 not found. Skipping seeder.\n";

            return;
        }

        $qId = DB::table('questions')->insertGetId([
            'exam_id' => $examId,
            'type' => 'essay',
            'content' => 'Test Essay: Describe your favorite coding pattern.',
            'points' => 10.00,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Get all manual questions for this exam to ensure all are answered
        $manualQuestions = DB::table('questions')
            ->where('exam_id', $examId)
            ->whereIn('type', ['essay', 'short_text'])
            ->get();

        for ($i = 1; $i <= 3; $i++) {
            $studentId = DB::table('users')->insertGetId([
                'name' => 'Tester Student '.uniqid(),
                'email' => 'tester'.time()."$i@example.com",
                'password' => Hash::make('password'),
                'role' => 'student',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $attemptId = DB::table('exam_attempts')->insertGetId([
                'exam_id' => $examId,
                'student_id' => $studentId,
                'attempt_number' => 1,
                'started_at' => now(),
                'status' => 'submitted',
                'submitted_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($manualQuestions as $q) {
                DB::table('exam_answers')->insert([
                    'attempt_id' => $attemptId,
                    'question_id' => $q->id,
                    'text_answer' => "Detailed response for student {$i} on Question {$q->id}. This is a multi-line answer designed to test the scrolling behavior of the grading interface. The student demonstrates understanding of the concept by providing specific examples and clear reasoning.",
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            echo "Test attempt #{$attemptId} created with ".count($manualQuestions)." answered questions.\n";
        }

        echo "Test data created successfully!\n";
    }
}
