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
        Schema::table('exam_attempts', function (Blueprint $column) {
            $column->timestamp('paused_at')->nullable()->after('is_paused');
            $column->integer('total_paused_seconds')->default(0)->after('paused_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exam_attempts', function (Blueprint $column) {
            $column->dropColumn(['paused_at', 'total_paused_seconds']);
        });
    }
};
