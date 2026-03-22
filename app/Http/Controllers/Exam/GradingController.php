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
        $pendingGrading = $total - $graded;
        $completedScores = $attempts->where('percentage', '!=', null)->pluck('percentage');
        $averageScore = $completedScores->isNotEmpty() ? round($completedScores->avg(), 1) : null;

        return Inertia::render('exams/grading/index', [
            'exam' => [
                'id' => $exam->id,
                'title' => $exam->title,
                'questions_count' => $exam->questions_count,
                'total_points' => $exam->total_points,
            ],
            'attempts' => $attempts,
            'stats' => [
                'total' => $total,
                'completed' => $total,
                'pending_grading' => $pendingGrading,
                'graded' => $graded,
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
            ->whereIn('status', [ExamAttempt::STATUS_SUBMITTED, ExamAttempt::STATUS_AUTO_SUBMITTED])
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

        return response()->json(['success' => true]);
    }

    /**
     * Finalize grading and calculate final score.
     */
    public function finalize(ExamAttempt $attempt): RedirectResponse
    {
        Gate::authorize('grade', $attempt);

        // Recalculate totals
        $totalEarned = $attempt->answers()->sum('points_earned') ?? 0;
        $totalPossible = $attempt->exam->total_points;
        $percentage = $totalPossible > 0 ? ($totalEarned / $totalPossible) * 100 : 0;

        $attempt->update([
            'status' => ExamAttempt::STATUS_GRADED,
            'score' => $totalEarned,
            'total_points' => $totalPossible,
            'percentage' => round($percentage, 2),
        ]);

        return redirect()
            ->route('grading.index', $attempt->exam_id)
            ->with('success', 'Attempt graded successfully.');
    }

    /**
     * Bulk auto-grade all pending attempts.
     */
    public function bulkAutoGrade(int $examId): RedirectResponse
    {
        $attempts = ExamAttempt::query()
            ->where('exam_id', $examId)
            ->whereIn('status', [ExamAttempt::STATUS_SUBMITTED, ExamAttempt::STATUS_AUTO_SUBMITTED])
            ->get();

        if ($attempts->isEmpty()) {
            return back()->with('info', 'No attempts to grade.');
        }

        // Check authorization
        Gate::authorize('grade', $attempts->first());

        foreach ($attempts as $attempt) {
            $this->gradingService->gradeAttempt($attempt);
        }

        return back()->with('success', 'Auto-grading completed for '.$attempts->count().' attempts.');
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

        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=$filename",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($attempts) {
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
        };

        return response()->stream($callback, 200, $headers);
    }
}
