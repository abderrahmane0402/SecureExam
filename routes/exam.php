<?php

use App\Http\Controllers\Exam\ExamAttemptController;
use App\Http\Controllers\Exam\ExamController;
use App\Http\Controllers\Exam\GradingController;
use App\Http\Controllers\Exam\QuestionController;
use App\Http\Controllers\Exam\StudentExamController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Exam Routes
|--------------------------------------------------------------------------
|
| Routes for the exam system, separated by instructor and student roles.
|
*/

Route::middleware(['auth', 'verified'])->group(function (): void {
    // Instructor routes
    Route::middleware('can:viewAny,App\Models\Exam')->group(function (): void {
        // Exam CRUD
        Route::resource('exams', ExamController::class);

        // Exam management
        Route::post('exams/{exam}/toggle-publish', [ExamController::class, 'togglePublish'])
            ->name('exams.toggle-publish');

        // Student assignment
        Route::get('exams/{exam}/assign', [ExamController::class, 'showAssignForm'])
            ->name('exams.assign.form');
        Route::post('exams/{exam}/assign', [ExamController::class, 'assignStudents'])
            ->name('exams.assign');

        // Exam monitoring
        Route::get('exams/{exam}/monitor', [ExamController::class, 'monitor'])
            ->name('exams.monitor');

        // Attempt management
        Route::delete('exams/{exam}/attempts/{attempt}', [ExamController::class, 'deleteAttempt'])
            ->name('exams.attempts.delete');
        Route::post('exams/{exam}/attempts/{attempt}/reset', [ExamController::class, 'resetAttempt'])
            ->name('exams.attempts.reset');
        Route::post('exams/{exam}/attempts/{attempt}/reset-violations', [ExamController::class, 'resetViolations'])
            ->name('exams.attempts.reset-violations');

        // Questions
        Route::post('exams/{exam}/questions', [QuestionController::class, 'store'])
            ->name('exams.questions.store');
        Route::put('exams/{exam}/questions/{question}', [QuestionController::class, 'update'])
            ->name('exams.questions.update');
        Route::delete('exams/{exam}/questions/{question}', [QuestionController::class, 'destroy'])
            ->name('exams.questions.destroy');
        Route::post('exams/{exam}/questions/reorder', [QuestionController::class, 'reorder'])
            ->name('exams.questions.reorder');

        // Grading
        Route::get('grading/{examId}', [GradingController::class, 'index'])
            ->name('grading.index');
        Route::get('grading/attempt/{attempt}', [GradingController::class, 'show'])
            ->name('grading.show');
        Route::post('grading/attempt/{attempt}/answer', [GradingController::class, 'gradeAnswer'])
            ->name('grading.answer');
        Route::post('grading/attempt/{attempt}/finalize', [GradingController::class, 'finalize'])
            ->name('grading.finalize');
        Route::post('grading/{examId}/bulk-auto-grade', [GradingController::class, 'bulkAutoGrade'])
            ->name('grading.bulk-auto-grade');
    });

    // Student routes
    Route::prefix('student')->name('student.')->group(function (): void {
        // View available exams
        Route::get('exams', [StudentExamController::class, 'index'])
            ->name('exams.index');
        Route::get('exams/{exam}', [StudentExamController::class, 'show'])
            ->name('exams.show');
        Route::get('exams/{exam}/results', [StudentExamController::class, 'results'])
            ->name('exams.results');

        // Start exam attempt
        Route::post('exams/{exam}/start', [ExamAttemptController::class, 'start'])
            ->name('exams.start');
    });

    // Exam taking routes (for students during exam)
    Route::prefix('exam')->name('exam.')->group(function (): void {
        Route::get('take/{attempt}', [ExamAttemptController::class, 'take'])
            ->name('take');
        Route::post('attempt/{attempt}/answer', [ExamAttemptController::class, 'saveAnswer'])
            ->name('save-answer');
        Route::post('attempt/{attempt}/submit', [ExamAttemptController::class, 'submit'])
            ->name('submit');
        Route::post('attempt/{attempt}/auto-submit', [ExamAttemptController::class, 'autoSubmit'])
            ->name('auto-submit');
        Route::post('attempt/{attempt}/violation', [ExamAttemptController::class, 'logViolation'])
            ->name('log-violation');
        Route::post('attempt/{attempt}/validate-session', [ExamAttemptController::class, 'validateSession'])
            ->name('validate-session');
        Route::post('attempt/{attempt}/heartbeat', [ExamAttemptController::class, 'heartbeat'])
            ->name('heartbeat');
    });
});
