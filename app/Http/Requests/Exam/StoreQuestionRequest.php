<?php

namespace App\Http\Requests\Exam;

use App\Models\Question;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreQuestionRequest extends FormRequest
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
        $type = $this->input('type');
        $needsOptions = in_array($type, ['multiple_choice_single', 'multiple_choice_multiple']);

        return [
            'type' => ['required', 'string', Rule::in(Question::TYPES)],
            'content' => ['required', 'string', 'max:5000'],
            'image' => ['nullable', 'image', 'max:2048'],
            'points' => ['required', 'numeric', 'min:0.01', 'max:1000'],
            'order' => ['nullable', 'integer', 'min:0'],
            'correct_answer' => ['nullable', 'string', 'max:1000'],
            'grading_notes' => ['nullable', 'string', 'max:2000'],
            'options' => $needsOptions
                ? ['required', 'array', 'min:2', 'max:10']
                : ['nullable', 'array'],
            'options.*.content' => ['required_with:options', 'string', 'max:1000'],
            'options.*.is_correct' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'type.required' => 'Please select a question type.',
            'type.in' => 'Invalid question type selected.',
            'content.required' => 'Please enter the question text.',
            'points.required' => 'Please specify the points for this question.',
            'options.required_if' => 'Multiple choice questions require at least 2 options.',
            'options.min' => 'Please provide at least 2 options.',
            'options.*.content.required_with' => 'Each option must have content.',
        ];
    }
}
