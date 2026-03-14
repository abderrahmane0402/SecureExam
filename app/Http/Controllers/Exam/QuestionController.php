<?php

namespace App\Http\Controllers\Exam;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exam\StoreQuestionRequest;
use App\Models\Exam;
use App\Models\Question;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class QuestionController extends Controller
{
    /**
     * Store a newly created question.
     */
    public function store(StoreQuestionRequest $request, Exam $exam): RedirectResponse
    {
        $validated = $request->validated();

        // Handle image upload
        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('question-images', 'public');
        }

        DB::transaction(function () use ($validated, $exam, $imagePath): void {
            // Get the next order if not specified
            $order = $validated['order'] ?? $exam->questions()->max('order') + 1;

            $question = $exam->questions()->create([
                'type' => $validated['type'],
                'content' => $validated['content'],
                'image_path' => $imagePath,
                'points' => $validated['points'],
                'order' => $order,
                'correct_answer' => $validated['correct_answer'] ?? null,
                'grading_notes' => $validated['grading_notes'] ?? null,
            ]);

            // Create options for multiple choice questions
            if (isset($validated['options']) && $question->requiresOptions()) {
                foreach ($validated['options'] as $index => $option) {
                    $question->options()->create([
                        'content' => $option['content'],
                        'is_correct' => $option['is_correct'] ?? false,
                        'order' => $index,
                    ]);
                }
            }

            // For true/false, create predefined options
            if ($question->type === Question::TYPE_TRUE_FALSE) {
                $question->options()->createMany([
                    ['content' => 'True', 'is_correct' => $validated['correct_answer'] === 'true', 'order' => 0],
                    ['content' => 'False', 'is_correct' => $validated['correct_answer'] === 'false', 'order' => 1],
                ]);
            }
        });

        return back()->with('success', 'Question added successfully.');
    }

    /**
     * Update the specified question.
     */
    public function update(StoreQuestionRequest $request, Exam $exam, Question $question): RedirectResponse
    {
        Gate::authorize('update', $exam);

        if ($question->exam_id !== $exam->id) {
            abort(404);
        }

        $validated = $request->validated();

        DB::transaction(function () use ($validated, $request, $question): void {
            // Handle image upload
            $imagePath = $question->image_path;
            if ($request->hasFile('image')) {
                // Delete old image
                if ($imagePath) {
                    Storage::disk('public')->delete($imagePath);
                }
                $imagePath = $request->file('image')->store('question-images', 'public');
            }

            $question->update([
                'type' => $validated['type'],
                'content' => $validated['content'],
                'image_path' => $imagePath,
                'points' => $validated['points'],
                'order' => $validated['order'] ?? $question->order,
                'correct_answer' => $validated['correct_answer'] ?? null,
                'grading_notes' => $validated['grading_notes'] ?? null,
            ]);

            // Update options for multiple choice questions
            if (isset($validated['options']) && $question->requiresOptions()) {
                // Delete existing options and recreate
                $question->options()->delete();

                foreach ($validated['options'] as $index => $option) {
                    $question->options()->create([
                        'content' => $option['content'],
                        'is_correct' => $option['is_correct'] ?? false,
                        'order' => $index,
                    ]);
                }
            }

            // Update true/false options
            if ($question->type === Question::TYPE_TRUE_FALSE) {
                $question->options()->delete();
                $question->options()->createMany([
                    ['content' => 'True', 'is_correct' => $validated['correct_answer'] === 'true', 'order' => 0],
                    ['content' => 'False', 'is_correct' => $validated['correct_answer'] === 'false', 'order' => 1],
                ]);
            }
        });

        return back()->with('success', 'Question updated successfully.');
    }

    /**
     * Remove the specified question.
     */
    public function destroy(Exam $exam, Question $question): RedirectResponse
    {
        Gate::authorize('update', $exam);

        if ($question->exam_id !== $exam->id) {
            abort(404);
        }

        // Delete associated image
        if ($question->image_path) {
            Storage::disk('public')->delete($question->image_path);
        }

        $question->delete();

        return back()->with('success', 'Question deleted successfully.');
    }

    /**
     * Reorder questions.
     */
    public function reorder(Exam $exam): RedirectResponse
    {
        Gate::authorize('update', $exam);

        $validated = request()->validate([
            'questions' => ['required', 'array'],
            'questions.*.id' => ['required', 'exists:questions,id'],
            'questions.*.order' => ['required', 'integer', 'min:0'],
        ]);

        DB::transaction(function () use ($validated, $exam): void {
            foreach ($validated['questions'] as $item) {
                $exam->questions()
                    ->where('id', $item['id'])
                    ->update(['order' => $item['order']]);
            }
        });

        return back()->with('success', 'Questions reordered successfully.');
    }
}
