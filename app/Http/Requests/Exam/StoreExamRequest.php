<?php

namespace App\Http\Requests\Exam;

use Illuminate\Foundation\Http\FormRequest;

class StoreExamRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->isInstructor() ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:480'],
            'start_time' => ['required', 'date', 'after_or_equal:now'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'allowed_attempts' => ['required', 'integer', 'min:1', 'max:10'],
            'shuffle_questions' => ['boolean'],
            'shuffle_options' => ['boolean'],
            'show_results' => ['boolean'],
            'passing_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'The exam title is required.',
            'duration_minutes.required' => 'Please specify the exam duration.',
            'duration_minutes.min' => 'Duration must be at least 1 minute.',
            'duration_minutes.max' => 'Duration cannot exceed 8 hours.',
            'start_time.after_or_equal' => 'Start time cannot be in the past.',
            'end_time.after' => 'End time must be after start time.',
            'allowed_attempts.min' => 'At least 1 attempt must be allowed.',
        ];
    }
}
