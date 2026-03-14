<?php

namespace App\Http\Requests\Exam;

use App\Models\ViolationLog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LogViolationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $attempt = $this->route('attempt');

        return $this->user()?->id === $attempt?->student_id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'violation_type' => ['required', 'string', Rule::in(ViolationLog::TYPES)],
            'details' => ['nullable', 'string', 'max:1000'],
            'occurred_at' => ['required', 'date'],
            'returned_at' => ['nullable', 'date'],
            'duration_seconds' => ['nullable', 'integer', 'min:0'],
            'severity' => ['nullable', 'string', Rule::in(['low', 'medium', 'high', 'critical'])],
        ];
    }
}
