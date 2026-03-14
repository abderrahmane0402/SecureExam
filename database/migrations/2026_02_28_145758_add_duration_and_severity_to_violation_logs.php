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
        Schema::table('violation_logs', function (Blueprint $table) {
            $table->integer('duration_seconds')->nullable()->after('details'); // Focus loss duration
            $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('medium')->after('duration_seconds');
            $table->dateTime('returned_at')->nullable()->after('occurred_at'); // When focus returned
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('violation_logs', function (Blueprint $table) {
            $table->dropColumn(['duration_seconds', 'severity', 'returned_at']);
        });
    }
};
