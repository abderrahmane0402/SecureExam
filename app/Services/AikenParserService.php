<?php

namespace App\Services;

class AikenParserService
{
    /**
     * Parse Aiken formatted text into an array of questions.
     *
     * Example Aiken format:
     * What is the capital of France?
     * A) Paris
     * B) Lyon
     * C) Marseille
     * D) Berlin
     * ANSWER: A
     */
    public function parse(string $text): array
    {
        $lines = explode("\n", str_replace("\r", '', trim($text)));
        $questions = [];
        $currentQuestion = null;

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) {
                continue;
            }

            // Check if it's an option (starts with A) B) C) etc or A. B. C.)
            if (preg_match('/^([A-Z])[\)\.]\s*(.*)$/', $line, $matches)) {
                if ($currentQuestion) {
                    $currentQuestion['options'][$matches[1]] = $matches[2];
                }
            }
            // Check if it's the answer line
            elseif (preg_match('/^ANSWER:\s*([A-Z])$/', $line, $matches)) {
                if ($currentQuestion) {
                    $currentQuestion['correct_letter'] = $matches[1];
                    $questions[] = $currentQuestion;
                    $currentQuestion = null;
                }
            }
            // Otherwise, it's the question content (if we are not already in one)
            else {
                if ($currentQuestion === null) {
                    $currentQuestion = [
                        'content' => $line,
                        'options' => [],
                        'correct_letter' => null,
                    ];
                } else {
                    // Append to existing content if multiple lines
                    $currentQuestion['content'] .= "\n".$line;
                }
            }
        }

        return $questions;
    }
}
