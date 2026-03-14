<?php

namespace App\Services;

use App\Models\ExamAnswer;
use App\Models\ExamAttempt;
use App\Models\Question;

class ExamGradingService
{
    /**
     * Grade all auto-gradable answers for an attempt.
     */
    public function gradeAttempt(ExamAttempt $attempt): void
    {
        $answers = $attempt->answers()->with('question.options')->get();

        foreach ($answers as $answer) {
            if ($answer->question->isAutoGradable()) {
                $this->gradeAnswer($answer);
            }
        }
    }

    /**
     * Grade a single answer.
     */
    public function gradeAnswer(ExamAnswer $answer): void
    {
        $question = $answer->question;

        $isCorrect = match ($question->type) {
            Question::TYPE_MULTIPLE_CHOICE_SINGLE => $this->gradeMultipleChoiceSingle($answer, $question),
            Question::TYPE_MULTIPLE_CHOICE_MULTIPLE => $this->gradeMultipleChoiceMultiple($answer, $question),
            Question::TYPE_TRUE_FALSE => $this->gradeTrueFalse($answer, $question),
            Question::TYPE_SHORT_TEXT => $this->gradeShortText($answer, $question),
            default => null,
        };

        $pointsEarned = $isCorrect ? $question->points : 0;

        $answer->update([
            'is_correct' => $isCorrect,
            'points_earned' => $pointsEarned,
        ]);
    }

    /**
     * Grade multiple choice single answer question.
     */
    private function gradeMultipleChoiceSingle(ExamAnswer $answer, Question $question): bool
    {
        $selectedOptions = $answer->selected_options ?? [];

        if (count($selectedOptions) !== 1) {
            return false;
        }

        $correctOptionIds = $question->options
            ->where('is_correct', true)
            ->pluck('id')
            ->toArray();

        return count($correctOptionIds) === 1 && in_array($selectedOptions[0], $correctOptionIds);
    }

    /**
     * Grade multiple choice multiple answer question.
     */
    private function gradeMultipleChoiceMultiple(ExamAnswer $answer, Question $question): bool
    {
        $selectedOptions = $answer->selected_options ?? [];
        sort($selectedOptions);

        $correctOptionIds = $question->options
            ->where('is_correct', true)
            ->pluck('id')
            ->toArray();
        sort($correctOptionIds);

        // Must select exactly the correct options
        return $selectedOptions === $correctOptionIds;
    }

    /**
     * Grade true/false question.
     */
    private function gradeTrueFalse(ExamAnswer $answer, Question $question): bool
    {
        $selectedOptions = $answer->selected_options ?? [];

        if (count($selectedOptions) !== 1) {
            return false;
        }

        $correctOption = $question->options
            ->firstWhere('is_correct', true);

        return $correctOption && $selectedOptions[0] === $correctOption->id;
    }

    /**
     * Grade short text answer question.
     */
    private function gradeShortText(ExamAnswer $answer, Question $question): bool
    {
        if (! $answer->text_answer || ! $question->correct_answer) {
            return false;
        }

        // Case-insensitive comparison, trimmed
        $studentAnswer = strtolower(trim($answer->text_answer));
        $correctAnswer = strtolower(trim($question->correct_answer));

        // Support multiple correct answers separated by |
        $correctAnswers = array_map('trim', explode('|', $correctAnswer));

        return in_array($studentAnswer, $correctAnswers);
    }
}
