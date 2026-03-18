<?php

namespace App\Http\Controllers\Exam;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exam\AssignStudentsRequest;
use App\Http\Requests\Exam\StoreExamRequest;
use App\Http\Requests\Exam\UpdateExamRequest;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\User;
use App\Models\ViolationLog;
use Illuminate\Http\RedirectResponse;
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
            ->paginate(10);

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
            ->route('exams.edit', $exam)
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

        return back()->with('success', 'Exam updated successfully.');
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

    /**
     * Assign students to the exam.
     */
    public function assignStudents(AssignStudentsRequest $request, Exam $exam): RedirectResponse
    {
        $studentIds = $request->validated('student_ids');

        // Sync students (this will add new and remove unselected)
        $syncData = [];
        foreach ($studentIds as $studentId) {
            $syncData[$studentId] = ['assigned_at' => now()];
        }

        $exam->assignedStudents()->sync($syncData);

        return back()->with('success', 'Students assigned successfully.');
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
            ->get(['id', 'name', 'email']);

        return Inertia::render('exams/instructor/assign-students', [
            'exam' => $exam,
            'students' => $students,
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
                $q->latest('occurred_at')->limit(5);
            }, 'activeSession'])
            ->withCount('answers')
            ->get();

        // Get all attempts for management
        $allAttempts = $exam->attempts()
            ->with('student:id,name,email')
            ->withCount('answers')
            ->orderByDesc('created_at')
            ->get();

        // Count unique students who have completed (any status except in_progress)
        $completedStudentIds = $exam->attempts()
            ->whereIn('status', ['submitted', 'graded', 'auto_submitted'])
            ->pluck('student_id')
            ->unique();

        // Students currently in progress
        $inProgressStudentIds = $activeAttempts->pluck('student_id')->unique();

        // Total assigned students
        $totalAssigned = $exam->assignments()->count();

        // Completed = students who finished and are not currently in progress
        $completedCount = $completedStudentIds->diff($inProgressStudentIds)->count();

        // In progress count
        $inProgressCount = $inProgressStudentIds->count();

        // Not started = assigned but never attempted
        $attemptedStudentIds = $exam->attempts()->pluck('student_id')->unique();
        $notStartedCount = $totalAssigned - $attemptedStudentIds->count();

        $recentViolations = ViolationLog::query()
            ->whereHas('attempt', fn($q) => $q->where('exam_id', $exam->id))
            ->with('attempt.student')
            ->latest('occurred_at')
            ->limit(20)
            ->get();

        $exam->loadCount('questions');

        return Inertia::render('exams/instructor/monitor', [
            'exam' => $exam,
            'activeStudents' => $activeAttempts->map(fn($a) => [
                'user' => [
                    'id' => $a->student->id,
                    'name' => $a->student->name,
                    'email' => $a->student->email,
                ],
                'attempt' => [
                    'id' => $a->id,
                    'started_at' => $a->started_at,
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
            'recentViolations' => $recentViolations->map(fn($v) => [
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

        // Delete associated answers and violation logs
        $attempt->answers()->delete();
        $attempt->violationLogs()->delete();
        $attempt->delete();

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

        // Delete associated answers and violation logs
        $attempt->answers()->delete();
        $attempt->violationLogs()->delete();
        $attempt->delete();

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

        $attempt->violationLogs()->delete();
        $attempt->update(['violation_count' => 0]);

        return back()->with('success', 'Violations cleared for this attempt.');
    }
}
