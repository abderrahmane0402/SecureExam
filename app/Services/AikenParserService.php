<?php

namespace App\Services;

class AikenParserService
{
    /**
     * Parse Aiken formatted text into an array of questions.
     */
    public function parse(string $text): array
    {
        $lines = explode("\n", str_replace("\r", '', trim($text)));
        $questions = [];
        $currentQuestion = null;

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;

            // 1. Check for Options (A) B) C) ...)
            if (preg_match('/^([A-Z])[\)\.]\s*(.*)$/', $line, $matches)) {
                if ($currentQuestion) {
                    $currentQuestion['options'][$matches[1]] = $matches[2];
                }
            }
            // 2. Check for Answer line (Saves the question)
            elseif (preg_match('/^ANSWER:\s*([A-Z,\s]+)$/', $line, $matches)) {
                if ($currentQuestion) {
                    $letters = preg_split('/[,\s]+/', trim($matches[1]), -1, PREG_SPLIT_NO_EMPTY);
                    $currentQuestion['correct_letters'] = $letters;
                    
                    if ($currentQuestion['type'] === 'multiple_choice_single' && count($letters) > 1) {
                        $currentQuestion['type'] = 'multiple_choice_multiple';
                    }
                    
                    $questions[] = $currentQuestion;
                    $currentQuestion = null;
                }
            }
            // 3. Check for Points line
            elseif (preg_match('/^POINTS:\s*(\d+)$/i', $line, $matches)) {
                if ($currentQuestion) {
                    $currentQuestion['points'] = (int)$matches[1];
                }
            }
            // 4. Check for Type line
            elseif (preg_match('/^TYPE:\s*(.*)$/i', $line, $matches)) {
                if ($currentQuestion) {
                    $type = strtolower(trim($matches[1]));
                    $map = [
                        'mcq' => 'multiple_choice_single',
                        'multiple' => 'multiple_choice_multiple',
                        'tf' => 'true_false',
                        'text' => 'short_text',
                        'essay' => 'essay'
                    ];
                    $currentQuestion['type'] = $map[$type] ?? $type;
                }
            }
            // 5. New Question or Content
            else {
                // If we encounter a new line that doesn't look like an option/answer/point/type,
                // and we ALREADY have a question, it might mean the PREVIOUS one was an essay/text 
                // and we are now starting a NEW one.
                
                // Logic: A new question starts if the current line doesn't match patterns AND 
                // we've already defined some options or a type for the current one.
                if ($currentQuestion !== null && (!empty($currentQuestion['options']) || $currentQuestion['type'] !== 'multiple_choice_single')) {
                    $questions[] = $currentQuestion;
                    $currentQuestion = null;
                }

                if ($currentQuestion === null) {
                    $currentQuestion = [
                        'content' => $line,
                        'options' => [],
                        'correct_letters' => [],
                        'points' => 1,
                        'type' => 'multiple_choice_single'
                    ];
                } else {
                    $currentQuestion['content'] .= "\n" . $line;
                }
            }
        }

        // Final Flush: Save the last question if it wasn't an MCQ (which saves on ANSWER:)
        if ($currentQuestion !== null) {
            $questions[] = $currentQuestion;
        }

        return $questions;
    }
}
