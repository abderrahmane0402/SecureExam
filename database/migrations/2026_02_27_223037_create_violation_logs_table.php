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
        Schema::create('violation_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_id')->constrained('exam_attempts')->cascadeOnDelete();
            $table->string('violation_type'); // tab_switch, window_blur, fullscreen_exit, copy, paste, right_click, multiple_tabs
            $table->text('details')->nullable(); // Additional context
            $table->dateTime('occurred_at');
            $table->string('ip_address')->nullable();
            $table->timestamps();

            $table->index(['attempt_id', 'violation_type']);
            $table->index('occurred_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('violation_logs');
    }
};
