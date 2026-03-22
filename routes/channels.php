<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('exam-monitoring.{examId}', function ($user, $examId) {
    return $user->isInstructor();
});

Broadcast::channel('exam-room.{examId}', function ($user, $examId) {
    if ($user->isInstructor()) {
        return \App\Models\Exam::where('id', $examId)->where('instructor_id', $user->id)->exists();
    }
    
    return \App\Models\ExamAssignment::where('exam_id', $examId)
        ->where('student_id', $user->id)
        ->exists();
});
