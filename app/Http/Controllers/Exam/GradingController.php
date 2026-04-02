<?php

namespace App\Http\Controllers\Exam;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Services\ExamGradingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class GradingController extends Controller
{
    public function __construct(
        private ExamGradingService $gradingService
    ) {}

    /**
     * Show all attempts for an exam that need grading.
     */
    public function index(int $examId): Response
    {
        $exam = Exam::query()
            ->withCount('questions')
            ->findOrFail($examId);

        Gate::authorize('update', $exam);

        $attempts = ExamAttempt::query()
            ->where('exam_id', $examId)
            ->whereIn('status', [ExamAttempt::STATUS_SUBMITTED, ExamAttempt::STATUS_AUTO_SUBMITTED, ExamAttempt::STATUS_GRADED])
            ->with(['student:id,name,email'])
            ->withCount(['answers', 'violations'])
            ->orderByDesc('submitted_at')
            ->get();

        // Calculate stats
        $total = $attempts->count();
        $graded = $attempts->where('status', ExamAttempt::STATUS_GRADED)->count();
        $published = $attempts->where('is_published', true)->count();
        $pendingGrading = $total - $graded;
        $completedScores = $attempts->where('percentage', '!=', null)->pluck('percentage');
        $averageScore = $completedScores->isNotEmpty() ? round($completedScores->avg(), 1) : null;

        return Inertia::render('exams/grading/index', [
            'exam' => [
                'id' => $exam->id,
                'title' => $exam->title,
                'questions_count' => $exam->questions_count,
                'total_points' => $exam->total_points,
                'show_results' => $exam->show_results,
            ],
            'attempts' => $attempts,
            'stats' => [
                'total' => $total,
                'completed' => $graded,
                'pending_grading' => $pendingGrading,
                'graded' => $graded,
                'published' => $published,
                'average_score' => $averageScore,
            ],
        ]);
    }

    /**
     * Show grading interface for a specific attempt.
     */
    public function show(ExamAttempt $attempt): Response
    {
        Gate::authorize('grade', $attempt);

        $exam = $attempt->exam;
        $attempt->load([
            'student:id,name,email',
            'answers',
            'violations',
        ]);

        // Load questions with options and match answers
        $questions = $exam->questions()
            ->with('options')
            ->orderBy('order')
            ->get()
            ->map(function ($question) use ($attempt) {
                $answer = $attempt->answers->firstWhere('question_id', $question->id);

                return [
                    'id' => $question->id,
                    'type' => $question->type,
                    'content' => $question->content,
                    'points' => $question->points,
                    'correct_answer' => $question->correct_answer,
                    'options' => $question->options->map(fn ($o) => [
                        'id' => $o->id,
                        'content' => $o->content,
                        'is_correct' => $o->is_correct,
                    ]),
                    'answer' => $answer ? [
                        'id' => $answer->id,
                        'text_answer' => $answer->text_answer,
                        'selected_options' => $answer->selected_options,
                        'points_earned' => $answer->points_earned,
                        'is_correct' => $answer->is_correct,
                        'instructor_feedback' => $answer->instructor_feedback,
                    ] : null,
                ];
            });

        // Get navigation IDs (previous/next attempts to grade)
        $attemptIds = ExamAttempt::query()
            ->where('exam_id', $exam->id)
            ->whereIn('status', [ExamAttempt::STATUS_SUBMITTED, ExamAttempt::STATUS_AUTO_SUBMITTED, ExamAttempt::STATUS_GRADED])
            ->orderByDesc('submitted_at')
            ->pluck('id')
            ->toArray();

        $currentIndex = array_search($attempt->id, $attemptIds);
        $previousAttemptId = $currentIndex > 0 ? $attemptIds[$currentIndex - 1] : null;
        $nextAttemptId = $currentIndex < count($attemptIds) - 1 ? $attemptIds[$currentIndex + 1] : null;

        return Inertia::render('exams/grading/show', [
            'exam' => [
                'id' => $exam->id,
                'title' => $exam->title,
                'total_points' => $exam->total_points,
            ],
            'attempt' => [
                'id' => $attempt->id,
                'attempt_number' => $attempt->attempt_number,
                'status' => $attempt->status,
                'started_at' => $attempt->started_at,
                'submitted_at' => $attempt->submitted_at,
                'score' => $attempt->score,
                'percentage' => $attempt->percentage,
                'violation_count' => $attempt->violation_count,
                'penalty_points' => $attempt->penalty_points,
                'penalty_reason' => $attempt->penalty_reason,
                'student' => $attempt->student,
                'violation_logs' => $attempt->violations,
            ],
            'questions' => $questions,
            'previousAttemptId' => $previousAttemptId,
            'nextAttemptId' => $nextAttemptId,
        ]);
    }

    /**
     * Grade an answer.
     */
    public function gradeAnswer(ExamAttempt $attempt): JsonResponse
    {
        Gate::authorize('grade', $attempt);

        $validated = request()->validate([
            'answer_id' => ['required', 'exists:exam_answers,id'],
            'points_earned' => ['required', 'numeric', 'min:0'],
            'feedback' => ['nullable', 'string', 'max:2000'],
        ]);

        // Verify answer belongs to attempt
        $answer = $attempt->answers()->findOrFail($validated['answer_id']);

        // Ensure points don't exceed max
        $maxPoints = $answer->question->points;
        $pointsEarned = min($validated['points_earned'], $maxPoints);

        $answer->update([
            'points_earned' => $pointsEarned,
            'is_correct' => $pointsEarned >= $maxPoints,
            'instructor_feedback' => $validated['feedback'],
        ]);

        // Return running total
        $runningTotal = $attempt->answers()->sum('points_earned') ?? 0;

        return response()->json([
            'success' => true,
            'running_total' => $runningTotal,
        ]);
    }

    /**
     * Finalize grading and calculate final score.
     */
    public function finalize(ExamAttempt $attempt): RedirectResponse
    {
        Gate::authorize('grade', $attempt);

        $this->gradingService->finalizeAttempt($attempt);

        return back()->with('success', 'Attempt graded successfully.');
    }

    /**
     * Apply penalty to an attempt.
     */
    public function applyPenalty(ExamAttempt $attempt): RedirectResponse
    {
        Gate::authorize('grade', $attempt);

        $validated = request()->validate([
            'mode' => ['required', 'string', 'in:none,penalty,zero'],
            'penalty_points' => ['nullable', 'numeric', 'min:0', 'required_if:mode,penalty'],
            'reason' => ['nullable', 'string', 'max:1000', 'required_unless:mode,none'],
        ]);

        if ($validated['mode'] === 'none') {
            $attempt->update([
                'penalty_points' => null,
                'penalty_reason' => null,
            ]);
        } elseif ($validated['mode'] === 'zero') {
            $attempt->update([
                'penalty_points' => $attempt->exam->total_points, // Full score deduction
                'penalty_reason' => $validated['reason'],
            ]);
        } else {
            $attempt->update([
                'penalty_points' => $validated['penalty_points'],
                'penalty_reason' => $validated['reason'],
            ]);
        }

        // Refinalize the attempt to calculate new score
        $this->gradingService->finalizeAttempt($attempt);

        return back()->with('success', 'Penalty applied successfully.');
    }

    /**
     * Bulk auto-grade pending attempts.
     */
    public function bulkAutoGrade(int $examId): RedirectResponse
    {
        $validated = request()->validate([
            'attempt_ids' => ['nullable', 'array'],
            'attempt_ids.*' => ['integer', 'exists:exam_attempts,id'],
        ]);

        $query = ExamAttempt::query()
            ->where('exam_id', $examId)
            ->whereIn('status', [ExamAttempt::STATUS_SUBMITTED, ExamAttempt::STATUS_AUTO_SUBMITTED]);

        if (! empty($validated['attempt_ids'])) {
            $query->whereIn('id', $validated['attempt_ids']);
        }

        $attempts = $query->get();

        if ($attempts->isEmpty()) {
            return back()->with('info', 'No attempts to grade.');
        }

        // Check authorization
        Gate::authorize('grade', $attempts->first());

        foreach ($attempts as $attempt) {
            $this->gradingService->gradeAttempt($attempt);
            $this->gradingService->finalizeAttempt($attempt);
        }

        return back()->with('success', 'Auto-grading completed and finalized for '.$attempts->count().' attempts.');
    }

    /**
     * Toggle publication status of an attempt.
     */
    public function publishGrade(ExamAttempt $attempt): RedirectResponse
    {
        Gate::authorize('grade', $attempt);

        if ($attempt->status !== ExamAttempt::STATUS_GRADED) {
            return back()->with('error', 'Only graded attempts can be published.');
        }

        $attempt->update([
            'is_published' => ! $attempt->is_published,
            'published_at' => ! $attempt->is_published ? now() : null,
        ]);

        $message = $attempt->is_published ? 'Grade published successfully.' : 'Grade unpublished successfully.';

        return back()->with('success', $message);
    }

    /**
     * Bulk publish graded attempts.
     */
    public function bulkPublish(int $examId): RedirectResponse
    {
        $validated = request()->validate([
            'attempt_ids' => ['nullable', 'array'],
            'attempt_ids.*' => ['integer', 'exists:exam_attempts,id'],
        ]);

        $query = ExamAttempt::query()
            ->where('exam_id', $examId)
            ->where('status', ExamAttempt::STATUS_GRADED);

        if (! empty($validated['attempt_ids'])) {
            $query->whereIn('id', $validated['attempt_ids']);
        }

        $attempts = $query->get();

        if ($attempts->isEmpty()) {
            return back()->with('info', 'No graded attempts to publish.');
        }

        Gate::authorize('grade', $attempts->first());

        foreach ($attempts as $attempt) {
            $attempt->update([
                'is_published' => true,
                'published_at' => now(),
            ]);
        }

        return back()->with('success', 'Published grades for '.$attempts->count().' attempts.');
    }

    /**
     * Export exam results to CSV.
     */
    public function exportCsv(int $examId): mixed
    {
        $exam = Exam::findOrFail($examId);
        Gate::authorize('view', $exam);

        $attempts = ExamAttempt::query()
            ->where('exam_id', $examId)
            ->with('student:id,name,email')
            ->orderBy('status')
            ->get();

        $filename = 'results_'.str_replace(' ', '_', strtolower($exam->title)).'_'.date('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($attempts) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Student Name', 'Email', 'Status', 'Score', 'Total Points', 'Percentage', 'Violations', 'Submitted At']);

            foreach ($attempts as $attempt) {
                fputcsv($file, [
                    $attempt->student->name,
                    $attempt->student->email,
                    strtoupper($attempt->status),
                    $attempt->score ?? 'N/A',
                    $attempt->total_points ?? 'N/A',
                    $attempt->percentage ? $attempt->percentage.'%' : 'N/A',
                    $attempt->violation_count,
                    $attempt->submitted_at ?? 'N/A',
                ]);
            }

            fclose($file);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
