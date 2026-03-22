<?php

namespace App\Http\Requests\Exam;

use Illuminate\Foundation\Http\FormRequest;

class AssignStudentsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $exam = $this->route('exam');

        return $this->user()?->can('assign', $exam) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'student_ids' => ['required_without:emails', 'nullable', 'array'],
            'student_ids.*' => ['integer', 'exists:users,id'],
            'emails' => ['required_without:student_ids', 'nullable', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'student_ids.required_without' => 'Please select students or provide emails.',
            'emails.required_without' => 'Please select students or provide emails.',
            'student_ids.*.exists' => 'One or more selected students do not exist.',
        ];
    }
}
