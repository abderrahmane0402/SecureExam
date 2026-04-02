<?php

namespace App\Http\Controllers\Exam;

use App\Events\IndividualMessageBroadcast;
use App\Events\ExamAttemptPaused;
use App\Events\TeacherMessageBroadcast;
use App\Events\ExamAttemptStatusChanged;
use App\Events\ExamTimeExtended;
use App\Http\Controllers\Controller;
use App\Http\Requests\Exam\AssignStudentsRequest;
use App\Http\Requests\Exam\StoreExamRequest;
use App\Http\Requests\Exam\UpdateExamRequest;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\User;
use App\Models\ViolationLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ExamController extends Controller
{
    /**
     * Display a listing of exams for the instructor.
     */
    public function index(): Response
    {
        Gate::authorize('viewAny', Exam::class);

        $exams = Exam::query()
            ->where('instructor_id', auth()->id())
            ->withCount(['questions', 'assignments', 'attempts'])
            ->orderByDesc('created_at')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('exams/instructor/index', [
            'exams' => $exams,
        ]);
    }

    /**
     * Show the form for creating a new exam.
     */
    public function create(): Response
    {
        Gate::authorize('create', Exam::class);

        return Inertia::render('exams/instructor/create');
    }

    /**
     * Store a newly created exam.
     */
    public function store(StoreExamRequest $request): RedirectResponse
    {
        $exam = Exam::query()->create([
            ...$request->validated(),
            'instructor_id' => auth()->id(),
        ]);

        return redirect()
            ->route('exams.show', $exam)
            ->with('success', 'Exam created successfully. Now add questions.');
    }

    /**
     * Display the specified exam for the instructor.
     */
    public function show(Exam $exam): Response
    {
        Gate::authorize('view', $exam);

        $exam->load(['questions.options', 'assignedStudents']);
        $exam->loadCount(['attempts']);

        $attempts = $exam->attempts()
            ->with('student:id,name,email')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('exams/instructor/show', [
            'exam' => $exam,
            'attempts' => $attempts,
        ]);
    }

    /**
     * Show the form for editing the specified exam.
     */
    public function edit(Exam $exam): Response
    {
        Gate::authorize('update', $exam);

        $exam->load(['questions.options']);

        return Inertia::render('exams/instructor/edit', [
            'exam' => $exam,
        ]);
    }

    /**
     * Update the specified exam.
     */
    public function update(UpdateExamRequest $request, Exam $exam): RedirectResponse
    {
        $exam->update($request->validated());

        return redirect()
            ->route('exams.show', $exam)
            ->with('success', 'Exam updated successfully.');
    }

    /**
     * Remove the specified exam.
     */
    public function destroy(Exam $exam): RedirectResponse
    {
        Gate::authorize('delete', $exam);

        $exam->delete();

        return redirect()
            ->route('exams.index')
            ->with('success', 'Exam deleted successfully.');
    }

    public function assignStudents(AssignStudentsRequest $request, Exam $exam): RedirectResponse
    {
        $validated = $request->validated();
        $studentIds = $validated['student_ids'] ?? [];

        // Handle bulk emails if provided
        if (! empty($validated['emails'])) {
            $emails = preg_split('/[\s,]+/', $validated['emails'], -1, PREG_SPLIT_NO_EMPTY);
            $matchedIds = User::query()
                ->where('role', 'student')
                ->whereIn('email', $emails)
                ->pluck('id')
                ->toArray();

            $studentIds = array_unique(array_merge($studentIds, $matchedIds));
        }

        // Sync students (this will add new and remove unselected if we use sync)
        $syncData = [];
        foreach ($studentIds as $studentId) {
            $syncData[(int) $studentId] = ['assigned_at' => now()];
        }

        $exam->assignedStudents()->sync($syncData);

        return back()->with('success', count($studentIds).' students assigned successfully.');
    }

    /**
     * Show form to assign students.
     */
    public function showAssignForm(Exam $exam): Response
    {
        Gate::authorize('assign', $exam);

        $exam->load('assignedStudents');

        $students = User::query()
            ->where('role', 'student')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'group']);

        $groups = $students->pluck('group')->unique()->filter()->values();

        return Inertia::render('exams/instructor/assign-students', [
            'exam' => $exam,
            'students' => $students,
            'groups' => $groups,
        ]);
    }

    /**
     * Show monitoring dashboard for the exam.
     */
    public function monitor(Exam $exam): Response
    {
        Gate::authorize('monitor', $exam);

        $activeAttempts = $exam->attempts()
            ->where('status', 'in_progress')
            ->with(['student', 'violations' => function ($q): void {
                $q->latest('id')->limit(50);
            }, 'activeSession'])
            ->withCount('answers')
            ->get();

        // Get count summaries in fewer queries
        $statusCounts = $exam->attempts()
            ->selectRaw('status, count(distinct student_id) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        // Total assigned students
        $totalAssigned = $exam->assignments()->count();

        // Unique students who have attempted the exam
        $attemptedCount = $exam->attempts()->distinct('student_id')->count();

        $completedCount = ($statusCounts['submitted'] ?? 0) + ($statusCounts['graded'] ?? 0) + ($statusCounts['auto_submitted'] ?? 0);
        $inProgressCount = $statusCounts['in_progress'] ?? 0;
        $notStartedCount = max(0, $totalAssigned - $attemptedCount);

        // Get all attempts for management
        $allAttempts = $exam->attempts()
            ->with('student:id,name,email')
            ->withCount('answers')
            ->orderByDesc('created_at')
            ->get();

        $recentViolations = ViolationLog::query()
            ->whereHas('attempt', fn ($q) => $q->where('exam_id', $exam->id))
            ->with('attempt.student')
            ->latest('id')
            ->limit(100)
            ->get();

        $exam->loadCount('questions');

        return Inertia::render('exams/instructor/monitor', [
            'exam' => $exam,
            'activeStudents' => $activeAttempts->map(fn ($a) => [
                'user' => [
                    'id' => $a->student->id,
                    'name' => $a->student->name,
                    'email' => $a->student->email,
                ],
                'attempt' => [
                    'id' => $a->id,
                    'started_at' => $a->started_at,
                    'is_paused' => $a->is_paused,
                    'remaining_time' => $a->remaining_time,
                    'total_paused_seconds' => $a->total_paused_seconds,
                    'answers_count' => $a->answers_count,
                    'violation_logs' => $a->violations,
                ],
                'last_activity' => $a->activeSession?->last_activity,
            ]),
            'attempts' => $allAttempts,
            'inProgressCount' => $inProgressCount,
            'completedCount' => $completedCount,
            'notStartedCount' => $notStartedCount,
            'totalAssigned' => $totalAssigned,
            'recentViolations' => $recentViolations->map(fn ($v) => [
                'id' => $v->id,
                'violation_type' => $v->violation_type,
                'details' => $v->details,
                'occurred_at' => $v->occurred_at?->toISOString(),
                'severity' => $v->severity,
                'duration_seconds' => $v->duration_seconds,
                'attempt' => [
                    'student' => [
                        'name' => $v->attempt?->student?->name,
                    ],
                ],
            ]),
        ]);
    }

    /**
     * Force submit a student's attempt.
     */
    public function forceSubmit(Exam $exam, ExamAttempt $attempt): RedirectResponse
    {
        Gate::authorize('update', $exam);

        if ($attempt->exam_id !== $exam->id) {
            abort(404);
        }

        if ($attempt->status === 'in_progress') {
            $attempt->update([
                'status' => 'submitted',
                'completed_at' => now(),
            ]);

            // Notify monitor
            broadcast(new ExamAttemptStatusChanged(
                $exam->id,
                $attempt->student_id,
                'submitted'
            ));
        }

        return back()->with('success', 'Attempt force submitted successfully.');
    }

    /**
     * Publish or unpublish the exam.
     */
    public function togglePublish(Exam $exam): RedirectResponse
    {
        Gate::authorize('update', $exam);

        // Validate exam has questions before publishing
        if (! $exam->is_published && $exam->questions()->count() === 0) {
            return back()->with('error', 'Cannot publish an exam without questions.');
        }

        $exam->update(['is_published' => ! $exam->is_published]);

        $message = $exam->is_published
            ? 'Exam published successfully.'
            : 'Exam unpublished successfully.';

        return back()->with('success', $message);
    }

    /**
     * Reset a student's attempt (allows them to retake).
     */
    public function resetAttempt(Exam $exam, ExamAttempt $attempt): RedirectResponse
    {
        Gate::authorize('update', $exam);

        // Ensure the attempt belongs to this exam
        if ($attempt->exam_id !== $exam->id) {
            abort(404);
        }

        $studentId = $attempt->student_id;

        // Delete associated answers and violation logs
        $attempt->answers()->delete();
        $attempt->violations()->delete();
        $attempt->delete();

        // Notify monitor
        broadcast(new ExamAttemptStatusChanged(
            $exam->id,
            $studentId,
            'reset'
        ));

        return back()->with('success', 'Attempt reset successfully. Student can now retake the exam.');
    }

    /**
     * Delete a student's attempt.
     */
    public function deleteAttempt(Exam $exam, ExamAttempt $attempt): RedirectResponse
    {
        Gate::authorize('update', $exam);

        // Ensure the attempt belongs to this exam
        if ($attempt->exam_id !== $exam->id) {
            abort(404);
        }

        $studentId = $attempt->student_id;

        // Delete associated answers and violation logs
        $attempt->answers()->delete();
        $attempt->violations()->delete();
        $attempt->delete();

        // Notify monitor
        broadcast(new ExamAttemptStatusChanged(
            $exam->id,
            $studentId,
            'deleted'
        ));

        return back()->with('success', 'Attempt deleted successfully.');
    }

    /**
     * Reset violation count for an attempt.
     */
    public function resetViolations(Exam $exam, ExamAttempt $attempt): RedirectResponse
    {
        Gate::authorize('update', $exam);

        // Ensure the attempt belongs to this exam
        if ($attempt->exam_id !== $exam->id) {
            abort(404);
        }

        $attempt->violations()->delete();
        $attempt->update(['violation_count' => 0]);

        // Notify monitor
        broadcast(new ExamAttemptStatusChanged(
            $exam->id,
            $attempt->student_id,
            'violations_cleared'
        ));

        return back()->with('success', 'Violations cleared for this attempt.');
    }

    /**
     * Broadcast a message to all students taking the exam.
     */
    public function broadcastMessage(Request $request, Exam $exam): RedirectResponse
    {
        Gate::authorize('update', $exam);

        $request->validate([
            'message' => ['required', 'string', 'max:500'],
        ]);

        broadcast(new TeacherMessageBroadcast(
            $exam->id,
            $request->message,
            auth()->user()->name
        ))->toOthers();

        return back()->with('success', 'Message broadcasted to all students.');
    }

    /**
     * Send a private message to a specific student.
     */
    public function sendIndividualMessage(Request $request, Exam $exam, ExamAttempt $attempt): JsonResponse
    {
        Gate::authorize('update', $exam);

        if ($attempt->exam_id !== $exam->id) {
            return response()->json(['error' => 'Invalid attempt'], 404);
        }

        $request->validate([
            'message' => ['required', 'string', 'max:500'],
        ]);

        broadcast(new IndividualMessageBroadcast(
            $exam->id,
            $attempt->student_id,
            $request->message,
            auth()->user()->name
        ));

        return response()->json(['success' => true]);
    }

    /**
     * Pause or resume a student's attempt.
     */
    public function togglePause(Exam $exam, ExamAttempt $attempt): RedirectResponse
    {
        Gate::authorize('update', $exam);

        if ($attempt->exam_id !== $exam->id) {
            abort(404);
        }

        $isPaused = ! $attempt->is_paused;
        $data = ['is_paused' => $isPaused];

        if ($isPaused) {
            // Starting pause
            $data['paused_at'] = now();
        } else {
            // Resuming from pause
            if ($attempt->paused_at) {
                // In this project, older->diffInSeconds(newer) is positive
                $pauseDuration = $attempt->paused_at->diffInSeconds(now());
                $data['total_paused_seconds'] = $attempt->total_paused_seconds + $pauseDuration;
            }
            $data['paused_at'] = null;
        }

        $attempt->update($data);

        $status = $isPaused ? 'paused' : 'resumed';

        // Reload to get fresh remaining_time for broadcast
        $attempt->refresh();

        broadcast(new ExamAttemptPaused($attempt, $isPaused))->toOthers();

        return back()->with('success', "Attempt $status successfully.");
    }

    /**
     * Extend time for a student's attempt.
     */
    public function extendTime(Request $request, Exam $exam, ExamAttempt $attempt): RedirectResponse
    {
        Gate::authorize('update', $exam);

        if ($attempt->exam_id !== $exam->id) {
            abort(404);
        }

        $validated = $request->validate([
            'minutes' => ['required', 'integer', 'min:1', 'max:60'],
        ]);

        $attempt->increment('extra_time_minutes', $validated['minutes']);

        // Broadcast to student instantly
        $attempt->refresh();
        broadcast(new ExamTimeExtended(
            $exam->id,
            $attempt->id,
            $attempt->remaining_time
        ))->toOthers();

        return back()->with('success', "Extended time by {$validated['minutes']} minutes.");
    }

    /**
     * Extend time for all active attempts of an exam.
     */
    public function extendTimeForAll(Request $request, Exam $exam): RedirectResponse
    {
        Gate::authorize('update', $exam);

        $validated = $request->validate([
            'minutes' => ['required', 'integer', 'min:1', 'max:60'],
        ]);

        $activeAttempts = $exam->attempts()->where('status', 'in_progress')->get();

        foreach ($activeAttempts as $attempt) {
            $attempt->increment('extra_time_minutes', $validated['minutes']);

            // Broadcast to each student
            $attempt->refresh();
            broadcast(new ExamTimeExtended(
                $exam->id,
                $attempt->id,
                $attempt->remaining_time
            ))->toOthers();
        }

        return back()->with('success', "Extended time by {$validated['minutes']} minutes for all active students.");
    }

    /**
     * Toggle the show_results flag on the exam.
     */
    public function toggleShowResults(Exam $exam): RedirectResponse
    {
        Gate::authorize('update', $exam);

        $exam->update(['show_results' => ! $exam->show_results]);

        $status = $exam->show_results ? 'enabled' : 'disabled';

        return back()->with('success', "Question review for students has been $status.");
    }
}
