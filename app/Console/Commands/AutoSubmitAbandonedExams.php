<?php

namespace App\Console\Commands;

use App\Models\ExamAttempt;
use App\Models\ViolationLog;
use App\Services\ExamGradingService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AutoSubmitAbandonedExams extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'exams:auto-submit';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically submit exam attempts that have expired or been abandoned.';

    /**
     * Execute the console command.
     */
    public function handle(ExamGradingService $gradingService)
    {
        $attempts = ExamAttempt::query()
            ->where('status', ExamAttempt::STATUS_IN_PROGRESS)
            ->with(['exam', 'activeSession'])
            ->get();

        $count = 0;

        foreach ($attempts as $attempt) {
            $shouldSubmit = false;
            $reason = '';
            $durationSeconds = 0;

            // 1. Check if time expired
            if ($attempt->remaining_time <= 0) {
                $shouldSubmit = true;
                $reason = 'Time expired';
            }
            // 2. Check if abandoned (last_activity > 60 seconds ago)
            elseif ($attempt->activeSession && $attempt->activeSession->last_activity) {
                $lastActivity = $attempt->activeSession->last_activity;
                $secondsOffline = $lastActivity->diffInSeconds(now());

                if ($secondsOffline > 60) { // 1 minute (stricter)
                    $shouldSubmit = true;
                    $reason = "Device disconnected / Abandoned (Offline for {$secondsOffline}s)";
                    $durationSeconds = $secondsOffline;
                }
            }
            // 3. Fallback: if no active session for safety (e.g. session deleted but attempt still in progress)
            elseif (! $attempt->activeSession && $attempt->created_at->diffInMinutes(now()) > ($attempt->exam->duration_minutes + 15)) {
                $shouldSubmit = true;
                $reason = 'No active session found';
            }

            if ($shouldSubmit) {
                DB::transaction(function () use ($attempt, $reason, $durationSeconds, $gradingService) {
                    // Log violation for abandonment
                    ViolationLog::create([
                        'attempt_id' => $attempt->id,
                        'violation_type' => 'device_disconnected',
                        'details' => "AUTO-KICKED: $reason",
                        'occurred_at' => now(),
                        'severity' => 'critical',
                        'duration_seconds' => $durationSeconds > 0 ? $durationSeconds : null,
                    ]);

                    // Instantly notify teacher monitor
                    broadcast(new \App\Events\Exam\ExamViolationLogged(
                        $attempt->exam_id,
                        $attempt->student->name,
                        'device_disconnected',
                        'critical'
                    ));

                    // Grade and finalize
                    $gradingService->gradeAttempt($attempt);

                    $totalEarned = $attempt->answers()->sum('points_earned') ?? 0;
                    $totalPossible = $attempt->exam->total_points;
                    $percentage = $totalPossible > 0 ? ($totalEarned / $totalPossible) * 100 : 0;

                    $attempt->update([
                        'submitted_at' => now(),
                        'status' => ExamAttempt::STATUS_AUTO_SUBMITTED,
                        'auto_submitted' => true,
                        'score' => $totalEarned,
                        'total_points' => $totalPossible,
                        'percentage' => round($percentage, 2),
                    ]);

                    $attempt->activeSession?->update(['is_active' => false]);
                });

                $count++;
                $this->info("Auto-submitted attempt {$attempt->id} for reason: {$reason}");
            }
        }

        if ($count > 0) {
            $this->info("Successfully auto-submitted {$count} abandoned/expired exams.");
        }
    }
}
