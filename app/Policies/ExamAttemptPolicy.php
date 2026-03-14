<?php

namespace App\Policies;

use App\Models\ExamAttempt;
use App\Models\User;

class ExamAttemptPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, ExamAttempt $examAttempt): bool
    {
        // Student can view their own attempts
        if ($user->isStudent() && $examAttempt->student_id === $user->id) {
            return true;
        }

        // Instructor can view attempts for their exams
        if ($user->isInstructor() && $examAttempt->exam->instructor_id === $user->id) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->isStudent();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ExamAttempt $examAttempt): bool
    {
        // Only the student who owns the attempt can update it while it's in progress
        return $user->isStudent()
            && $examAttempt->student_id === $user->id
            && $examAttempt->isInProgress();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ExamAttempt $examAttempt): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, ExamAttempt $examAttempt): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, ExamAttempt $examAttempt): bool
    {
        return false;
    }

    /**
     * Determine whether the user can submit the attempt.
     */
    public function submit(User $user, ExamAttempt $examAttempt): bool
    {
        return $user->isStudent()
            && $examAttempt->student_id === $user->id
            && $examAttempt->status === ExamAttempt::STATUS_IN_PROGRESS;
    }

    /**
     * Determine whether the user can grade the attempt.
     */
    public function grade(User $user, ExamAttempt $examAttempt): bool
    {
        return $user->isInstructor()
            && $examAttempt->exam->instructor_id === $user->id
            && in_array($examAttempt->status, [ExamAttempt::STATUS_SUBMITTED, ExamAttempt::STATUS_AUTO_SUBMITTED]);
    }
}
