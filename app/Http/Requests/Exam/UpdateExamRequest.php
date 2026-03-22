<?php

namespace App\Http\Requests\Exam;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExamRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $exam = $this->route('exam');

        return $this->user()?->can('update', $exam) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'type' => ['sometimes', 'required', 'string', 'in:auto,hybrid'],
            'description' => ['nullable', 'string', 'max:5000'],
            'duration_minutes' => ['sometimes', 'required', 'integer', 'min:1', 'max:480'],
            'start_time' => ['sometimes', 'required', 'date'],
            'end_time' => ['sometimes', 'required', 'date', 'after:start_time'],
            'allowed_attempts' => ['sometimes', 'required', 'integer', 'min:1', 'max:10'],
            'shuffle_questions' => ['boolean'],
            'shuffle_options' => ['boolean'],
            'show_results' => ['boolean'],
            'passing_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'is_published' => ['boolean'],
        ];
    }
}
