<?php

namespace App\Http\Controllers\Exam;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class StudentExamController extends Controller
{
    /**
     * Display a listing of exams available to the student.
     */
    public function index(): Response
    {
        $user = auth()->user();

        $assignedExams = Exam::query()
            ->whereHas('assignments', function ($query) use ($user): void {
                $query->where('student_id', $user->id);
            })
            ->where('is_published', true)
            ->with(['instructor:id,name'])
            ->withCount(['questions'])
            ->get()
            ->map(function ($exam) use ($user) {
                $completedAttempts = $exam->attempts()
                    ->where('student_id', $user->id)
                    ->whereIn('status', ['submitted', 'graded', 'auto_submitted'])
                    ->count();

                $latestAttempt = $exam->attempts()
                    ->where('student_id', $user->id)
                    ->latest()
                    ->first();

                return [
                    'id' => $exam->id,
                    'title' => $exam->title,
                    'description' => $exam->description,
                    'duration_minutes' => $exam->duration_minutes,
                    'start_time' => $exam->start_time,
                    'end_time' => $exam->end_time,
                    'allowed_attempts' => $exam->allowed_attempts,
                    'questions_count' => $exam->questions_count,
                    'instructor' => $exam->instructor,
                    'is_available' => $exam->isAvailable(),
                    'completed_attempts' => $completedAttempts,
                    'can_take' => $exam->isAvailable() && $completedAttempts < $exam->allowed_attempts,
                    'latest_attempt' => $latestAttempt ? [
                        'id' => $latestAttempt->id,
                        'status' => $latestAttempt->status,
                        'score' => $latestAttempt->score,
                        'percentage' => $latestAttempt->percentage,
                        'violation_count' => $latestAttempt->violation_count,
                        'auto_submitted' => $latestAttempt->auto_submitted,
                    ] : null,
                ];
            });

        return Inertia::render('exams/student/index', [
            'exams' => $assignedExams,
        ]);
    }

    /**
     * Show exam details before starting.
     */
    public function show(Exam $exam): Response
    {
        Gate::authorize('view', $exam);

        $user = auth()->user();

        // Get student's attempt history for this exam
        $attempts = $exam->attempts()
            ->where('student_id', $user->id)
            ->orderByDesc('created_at')
            ->get(['id', 'attempt_number', 'status', 'score', 'percentage', 'started_at', 'submitted_at', 'violation_count', 'auto_submitted', 'is_published', 'published_at']);

        $completedAttempts = $attempts->whereIn('status', ['submitted', 'graded', 'auto_submitted'])->count();

        return Inertia::render('exams/student/show', [
            'exam' => [
                'id' => $exam->id,
                'title' => $exam->title,
                'description' => $exam->description,
                'duration_minutes' => $exam->duration_minutes,
                'start_time' => $exam->start_time,
                'end_time' => $exam->end_time,
                'allowed_attempts' => $exam->allowed_attempts,
                'questions_count' => $exam->questions()->count(),
                'total_points' => $exam->total_points,
                'show_results' => $exam->show_results,
                'passing_score' => $exam->passing_score,
                'is_available' => $exam->isAvailable(),
            ],
            'attempts' => $attempts,
            'can_take' => $exam->isAvailable() && $completedAttempts < $exam->allowed_attempts,
            'remaining_attempts' => max(0, $exam->allowed_attempts - $completedAttempts),
        ]);
    }

    /**
     * Show exam results if allowed.
     */
    public function results(Exam $exam): Response
    {
        Gate::authorize('view', $exam);

        if (! $exam->show_results) {
            abort(403, 'Results are not available for this exam.');
        }

        $user = auth()->user();

        // Get the latest completed attempt
        $attempt = $exam->attempts()
            ->where('student_id', $user->id)
            ->whereIn('status', ['submitted', 'graded', 'auto_submitted'])
            ->with(['answers'])
            ->orderByDesc('submitted_at')
            ->first();

        if (! $attempt) {
            abort(404, 'No completed attempts found.');
        }

        // Load questions with options (for showing correct answers)
        $exam->load(['questions.options']);

        return Inertia::render('exams/student/results', [
            'exam' => [
                'id' => $exam->id,
                'title' => $exam->title,
                'total_points' => $exam->total_points,
                'passing_score' => $exam->passing_score,
                'show_results' => $exam->show_results,
                'questions' => $exam->questions->map(fn ($q) => [
                    'id' => $q->id,
                    'type' => $q->type,
                    'content' => $q->content,
                    'points' => $q->points,
                    'correct_answer' => $q->correct_answer,
                    'options' => $q->options->map(fn ($o) => [
                        'id' => $o->id,
                        'content' => $o->content,
                        'is_correct' => $o->is_correct,
                    ]),
                ]),
            ],
            'attempt' => $attempt,
        ]);
    }

    /**
     * Display all published graded results for the student.
     */
    public function myResults(): Response
    {
        $user = auth()->user();

        $attempts = \App\Models\ExamAttempt::query()
            ->with(['exam.instructor'])
            ->where('student_id', $user->id)
            ->where('is_published', true)
            ->where('status', \App\Models\ExamAttempt::STATUS_GRADED)
            ->orderByDesc('published_at')
            ->get();

        return Inertia::render('exams/student/my-results', [
            'attempts' => $attempts,
        ]);
    }

    /**
     * Show grade details for a specific attempt.
     */
    public function attemptGrade(Exam $exam, \App\Models\ExamAttempt $attempt): Response
    {
        $user = auth()->user();

        // Security check
        if ($attempt->student_id !== $user->id || $attempt->exam_id !== $exam->id) {
            abort(403);
        }

        if ($attempt->status !== \App\Models\ExamAttempt::STATUS_GRADED || ! $attempt->is_published) {
            abort(403, 'This grade is not yet released.');
        }

        $attempt->load(['answers']);

        $data = [
            'exam' => [
                'id' => $exam->id,
                'title' => $exam->title,
                'total_points' => $exam->total_points,
                'passing_score' => $exam->passing_score,
                'show_results' => $exam->show_results,
            ],
            'attempt' => [
                'id' => $attempt->id,
                'score' => $attempt->score,
                'percentage' => $attempt->percentage,
                'violation_count' => $attempt->violation_count,
                'penalty_points' => $attempt->penalty_points,
                'penalty_reason' => $attempt->penalty_reason,
                'submitted_at' => $attempt->submitted_at,
                'published_at' => $attempt->published_at,
            ],
        ];

        // Only include question breakdown if show_results is enabled
        if ($exam->show_results) {
            $exam->load(['questions.options']);
            $data['exam']['questions'] = $exam->questions->map(function ($q) use ($attempt) {
                $answer = $attempt->answers->firstWhere('question_id', $q->id);

                return [
                    'id' => $q->id,
                    'type' => $q->type,
                    'content' => $q->content,
                    'points' => $q->points,
                    'correct_answer' => $q->correct_answer,
                    'options' => $q->options->map(fn ($o) => [
                        'id' => $o->id,
                        'content' => $o->content,
                        'is_correct' => $o->is_correct,
                    ]),
                    'answer' => $answer ? [
                        'text_answer' => $answer->text_answer,
                        'selected_options' => $answer->selected_options,
                        'points_earned' => $answer->points_earned,
                        'is_correct' => $answer->is_correct,
                        'instructor_feedback' => $answer->instructor_feedback,
                    ] : null,
                ];
            });
        }

        return Inertia::render('exams/student/grade', $data);
    }
}
