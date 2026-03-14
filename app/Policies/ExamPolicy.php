<?php

namespace App\Policies;

use App\Models\Exam;
use App\Models\User;

class ExamPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->isInstructor();
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Exam $exam): bool
    {
        // Instructor can view their own exams
        if ($user->isInstructor() && $exam->instructor_id === $user->id) {
            return true;
        }

        // Students can view exams assigned to them
        if ($user->isStudent()) {
            return $exam->assignedStudents()->where('users.id', $user->id)->exists();
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->isInstructor();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Exam $exam): bool
    {
        return $user->isInstructor() && $exam->instructor_id === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Exam $exam): bool
    {
        return $user->isInstructor() && $exam->instructor_id === $user->id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Exam $exam): bool
    {
        return $user->isInstructor() && $exam->instructor_id === $user->id;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Exam $exam): bool
    {
        return $user->isInstructor() && $exam->instructor_id === $user->id;
    }

    /**
     * Determine whether the user can take the exam.
     */
    public function take(User $user, Exam $exam): bool
    {
        if (! $user->isStudent()) {
            return false;
        }

        // Check if exam is assigned to student
        if (! $exam->assignedStudents()->where('users.id', $user->id)->exists()) {
            return false;
        }

        // Check if exam is available
        if (! $exam->isAvailable()) {
            return false;
        }

        // Check if student has attempts remaining
        $attemptCount = $exam->attempts()
            ->where('student_id', $user->id)
            ->whereIn('status', ['submitted', 'graded', 'auto_submitted'])
            ->count();

        return $attemptCount < $exam->allowed_attempts;
    }

    /**
     * Determine whether the user can monitor the exam.
     */
    public function monitor(User $user, Exam $exam): bool
    {
        return $user->isInstructor() && $exam->instructor_id === $user->id;
    }

    /**
     * Determine whether the user can assign students to the exam.
     */
    public function assign(User $user, Exam $exam): bool
    {
        return $user->isInstructor() && $exam->instructor_id === $user->id;
    }
}
