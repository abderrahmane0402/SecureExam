<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ExamAttempt extends Model
{
    /** @use HasFactory<\Database\Factories\ExamAttemptFactory> */
    use HasFactory;

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_SUBMITTED = 'submitted';

    public const STATUS_GRADED = 'graded';

    public const STATUS_AUTO_SUBMITTED = 'auto_submitted';

    protected $fillable = [
        'exam_id',
        'student_id',
        'attempt_number',
        'started_at',
        'submitted_at',
        'status',
        'score',
        'total_points',
        'percentage',
        'violation_count',
        'auto_submitted',
        'ip_address',
        'user_agent',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'submitted_at' => 'datetime',
            'score' => 'decimal:2',
            'total_points' => 'decimal:2',
            'percentage' => 'decimal:2',
            'auto_submitted' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Exam, $this>
     */
    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /**
     * @return HasMany<ExamAnswer, $this>
     */
    public function answers(): HasMany
    {
        return $this->hasMany(ExamAnswer::class, 'attempt_id');
    }

    /**
     * @return HasMany<ViolationLog, $this>
     */
    public function violations(): HasMany
    {
        return $this->hasMany(ViolationLog::class, 'attempt_id');
    }

    /**
     * @return HasOne<ExamSession, $this>
     */
    public function activeSession(): HasOne
    {
        return $this->hasOne(ExamSession::class, 'attempt_id')->where('is_active', true);
    }

    public function getRemainingTimeAttribute(): int
    {
        if (! $this->started_at) {
            return 0;
        }

        $endTime = $this->started_at->addMinutes($this->exam->duration_minutes);
        $remaining = now()->diffInSeconds($endTime, false);

        return max(0, $remaining);
    }

    public function isExpired(): bool
    {
        return $this->remaining_time <= 0;
    }

    public function isInProgress(): bool
    {
        return $this->status === self::STATUS_IN_PROGRESS && ! $this->isExpired();
    }
}
