<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('exam_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_id')->constrained('exam_attempts')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->json('selected_options')->nullable(); // For multiple choice questions (array of option IDs)
            $table->text('text_answer')->nullable(); // For short text and essay
            $table->boolean('is_correct')->nullable(); // Auto-graded result
            $table->decimal('points_earned', 8, 2)->nullable();
            $table->text('instructor_feedback')->nullable(); // For manual grading
            $table->timestamps();

            $table->unique(['attempt_id', 'question_id']);
            $table->index('question_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_answers');
    }
};
