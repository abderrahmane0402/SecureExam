<?php

namespace App\Http\Controllers\Exam;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exam\LogViolationRequest;
use App\Http\Requests\Exam\SubmitAnswerRequest;
use App\Models\Exam;
use App\Models\ExamAnswer;
use App\Models\ExamAttempt;
use App\Models\ExamSession;
use App\Models\Question;
use App\Models\ViolationLog;
use App\Services\ExamGradingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ExamAttemptController extends Controller
{
    public function __construct(
        private ExamGradingService $gradingService
    ) {}

    /**
     * Start a new exam attempt.
     */
    public function start(Exam $exam): RedirectResponse
    {
        Gate::authorize('take', $exam);

        $user = auth()->user();

        // Check for existing in-progress attempt
        $existingAttempt = ExamAttempt::query()
            ->where('exam_id', $exam->id)
            ->where('student_id', $user->id)
            ->where('status', ExamAttempt::STATUS_IN_PROGRESS)
            ->first();

        if ($existingAttempt) {
            return redirect()->route('exam.take', $existingAttempt);
        }

        // Calculate attempt number
        $attemptNumber = ExamAttempt::query()
            ->where('exam_id', $exam->id)
            ->where('student_id', $user->id)
            ->count() + 1;

        // Create new attempt
        $attempt = ExamAttempt::query()->create([
            'exam_id' => $exam->id,
            'student_id' => $user->id,
            'attempt_number' => $attemptNumber,
            'started_at' => now(),
            'status' => ExamAttempt::STATUS_IN_PROGRESS,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        // Create session token for multi-tab detection
        ExamSession::query()->create([
            'attempt_id' => $attempt->id,
            'session_token' => ExamSession::generateToken(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'last_activity' => now(),
            'is_active' => true,
        ]);

        $redirect = redirect()->route('exam.take', $attempt);

        if (request()->has('no_security')) {
            $redirect->withInput(['no_security' => 1]); // This is not for query params
        }

        // Better way:
        return redirect()->to(
            route('exam.take', $attempt).(request()->has('no_security') ? '?no_security=1' : '')
        );
    }

    /**
     * Show the exam taking interface.
     */
    public function take(ExamAttempt $attempt): Response|RedirectResponse
    {
        Gate::authorize('update', $attempt);

        // Check if attempt is still valid
        if (! $attempt->isInProgress()) {
            return redirect()
                ->route('student.exams.show', $attempt->exam_id)
                ->with('error', 'This exam attempt has expired or been submitted.');
        }

        $exam = $attempt->exam;
        $questions = $exam->questions()
            ->with('options')
            ->when($exam->shuffle_questions, fn ($q) => $q->inRandomOrder())
            ->get()
            ->map(function ($question) use ($exam) {
                $options = $question->options;
                if ($exam->shuffle_options && $question->requiresOptions()) {
                    $options = $options->shuffle();
                }

                return [
                    'id' => $question->id,
                    'type' => $question->type,
                    'content' => $question->content,
                    'image_path' => $question->image_path,
                    'points' => $question->points,
                    'options' => $options->map(fn ($o) => [
                        'id' => $o->id,
                        'content' => $o->content,
                    ]),
                ];
            });

        // Get existing answers
        $answers = $attempt->answers()
            ->get()
            ->keyBy('question_id')
            ->map(fn ($a) => [
                'selected_options' => $a->selected_options,
                'text_answer' => $a->text_answer,
            ]);

        // Get session token
        $session = $attempt->activeSession;

        return Inertia::render('exams/student/take', [
            'attempt' => [
                'id' => $attempt->id,
                'started_at' => $attempt->started_at,
                'remaining_time' => $attempt->remaining_time,
                'violation_count' => $attempt->violation_count,
            ],
            'exam' => [
                'id' => $exam->id,
                'title' => $exam->title,
                'duration_minutes' => $exam->duration_minutes,
            ],
            'questions' => $questions,
            'answers' => $answers,
            'session_token' => $session?->session_token,
        ]);
    }

    /**
     * Save an answer (auto-save).
     */
    public function saveAnswer(SubmitAnswerRequest $request, ExamAttempt $attempt): JsonResponse
    {
        $validated = $request->validated();

        // Verify question belongs to the exam
        $question = Question::query()
            ->where('id', $validated['question_id'])
            ->where('exam_id', $attempt->exam_id)
            ->firstOrFail();

        // Update or create answer
        ExamAnswer::query()->updateOrCreate(
            [
                'attempt_id' => $attempt->id,
                'question_id' => $question->id,
            ],
            [
                'selected_options' => $validated['selected_options'] ?? null,
                'text_answer' => $validated['text_answer'] ?? null,
            ]
        );

        // Update session activity
        $attempt->activeSession?->update(['last_activity' => now()]);

        return response()->json(['success' => true]);
    }

    /**
     * Submit the exam.
     */
    public function submit(ExamAttempt $attempt): RedirectResponse
    {
        Gate::authorize('submit', $attempt);

        $this->finalizeAttempt($attempt, false);

        return redirect()
            ->route('student.exams.show', $attempt->exam_id)
            ->with('success', 'Exam submitted successfully.');
    }

    /**
     * Auto-submit exam (called when time expires or violations exceed limit).
     */
    public function autoSubmit(ExamAttempt $attempt): RedirectResponse|JsonResponse
    {
        if ($attempt->status !== ExamAttempt::STATUS_IN_PROGRESS) {
            return response()->json(['error' => 'Attempt already submitted'], 400);
        }

        if ($attempt->student_id !== auth()->id()) {
            abort(403);
        }

        $this->finalizeAttempt($attempt, true);

        return redirect()
            ->route('student.exams.show', $attempt->exam_id)
            ->with('error', 'Exam auto-submitted (time expired or security violation).');
    }

    /**
     * Log a violation.
     */
    public function logViolation(LogViolationRequest $request, ExamAttempt $attempt): JsonResponse
    {
        if ($attempt->status !== ExamAttempt::STATUS_IN_PROGRESS) {
            return response()->json(['error' => 'Exam already submitted'], 400);
        }

        $validated = $request->validated();

        // Determine severity based on duration if not provided
        $severity = $validated['severity'] ?? 'medium';
        $duration = $validated['duration_seconds'] ?? null;

        // Auto-calculate severity from duration for focus-loss violations
        // thresholds: <3s = low, 3-15s = medium, 15-60s = high, >60s = critical
        if ($duration !== null && in_array($validated['violation_type'], ['tab_switch', 'window_blur', 'fullscreen_exit', 'reload_delay'])) {
            if ($duration < 3) {
                $severity = 'low';
            } elseif ($duration <= 15) {
                $severity = 'medium';
            } elseif ($duration <= 60) {
                $severity = 'high';
            } else {
                $severity = 'critical';
            }
        }

        // For low severity focus losses, log but don't increment violation count
        // BUT for other types (copy/paste), always count
        $isFocusLoss = in_array($validated['violation_type'], ['tab_switch', 'window_blur', 'fullscreen_exit', 'reload_delay']);
        $countAsViolation = ! ($isFocusLoss && $severity === 'low');

        // Create violation log
        ViolationLog::query()->create([
            'attempt_id' => $attempt->id,
            'violation_type' => $validated['violation_type'],
            'details' => $validated['details'] ?? null,
            'duration_seconds' => $duration,
            'severity' => $severity,
            'occurred_at' => $validated['occurred_at'],
            'returned_at' => $validated['returned_at'] ?? null,
            'ip_address' => request()->ip(),
        ]);

        // Only increment violation count if it counts
        if ($countAsViolation) {
            $attempt->increment('violation_count');
        }

        // Check if violation threshold exceeded (default 5)
        $maxViolations = $attempt->exam->max_violations ?? 5;
        if ($attempt->violation_count >= $maxViolations) {
            $this->finalizeAttempt($attempt, true);

            return response()->json([
                'auto_submitted' => true,
                'message' => 'Exam auto-submitted due to excessive violations.',
                'severity' => $severity,
            ]);
        }

        return response()->json([
            'success' => true,
            'violation_count' => $attempt->violation_count,
            'severity' => $severity,
            'counted' => $countAsViolation,
        ]);
    }

    /**
     * Validate session token (for multi-tab detection).
     */
    public function validateSession(ExamAttempt $attempt): JsonResponse
    {
        $token = request()->input('session_token');

        $session = $attempt->activeSession;

        // No active session - this shouldn't happen
        if (! $session) {
            return response()->json([
                'valid' => false,
                'message' => 'No active session found.',
                'token' => null,
            ]);
        }

        // First request (no token sent) - just return the current token
        if (empty($token)) {
            $session->update(['last_activity' => now()]);

            return response()->json([
                'valid' => true,
                'token' => $session->session_token,
            ]);
        }

        // Token mismatch - multiple tabs detected
        if ($session->session_token !== $token) {
            return response()->json([
                'valid' => false,
                'message' => 'Session invalid. Exam may be open in another tab/device.',
                'token' => $session->session_token,
            ]);
        }

        // Update last activity
        $session->update(['last_activity' => now()]);

        return response()->json([
            'valid' => true,
            'token' => $session->session_token,
        ]);
    }

    /**
     * Heartbeat to keep session alive.
     */
    public function heartbeat(ExamAttempt $attempt): JsonResponse
    {
        if ($attempt->student_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $session = $attempt->activeSession;

        if ($session) {
            $session->update(['last_activity' => now()]);
        }

        return response()->json([
            'success' => true,
            'remaining_time' => $attempt->remaining_time,
            'status' => $attempt->status,
        ]);
    }

    /**
     * Finalize the attempt with grading.
     */
    private function finalizeAttempt(ExamAttempt $attempt, bool $autoSubmitted): void
    {
        DB::transaction(function () use ($attempt, $autoSubmitted): void {
            // Grade auto-gradable questions
            $this->gradingService->gradeAttempt($attempt);

            // Calculate totals
            $totalEarned = $attempt->answers()->sum('points_earned') ?? 0;
            $totalPossible = $attempt->exam->total_points;
            $percentage = $totalPossible > 0 ? ($totalEarned / $totalPossible) * 100 : 0;

            // Update attempt
            $attempt->update([
                'submitted_at' => now(),
                'status' => $autoSubmitted ? ExamAttempt::STATUS_AUTO_SUBMITTED : ExamAttempt::STATUS_SUBMITTED,
                'auto_submitted' => $autoSubmitted,
                'score' => $totalEarned,
                'total_points' => $totalPossible,
                'percentage' => round($percentage, 2),
            ]);

            // Deactivate session
            $attempt->activeSession?->update(['is_active' => false]);
        });
    }
}
