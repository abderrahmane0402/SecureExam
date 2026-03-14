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
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // multiple_choice_single, multiple_choice_multiple, true_false, short_text, essay
            $table->text('content'); // Question text
            $table->string('image_path')->nullable(); // Optional image
            $table->decimal('points', 8, 2)->default(1.00);
            $table->integer('order')->default(0);
            $table->text('correct_answer')->nullable(); // For short_text and true_false
            $table->text('grading_notes')->nullable(); // For essay grading guidance
            $table->timestamps();

            $table->index(['exam_id', 'order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};
