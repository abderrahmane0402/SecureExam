<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Exam extends Model
{
    /** @use HasFactory<\Database\Factories\ExamFactory> */
    use HasFactory;

    public const TYPE_AUTO = 'auto';

    public const TYPE_HYBRID = 'hybrid';

    protected $fillable = [
        'instructor_id',
        'title',
        'type',
        'description',
        'duration_minutes',
        'start_time',
        'end_time',
        'allowed_attempts',
        'shuffle_questions',
        'shuffle_options',
        'show_results',
        'passing_score',
        'is_published',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'shuffle_questions' => 'boolean',
            'shuffle_options' => 'boolean',
            'show_results' => 'boolean',
            'is_published' => 'boolean',
            'passing_score' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    /**
     * @return HasMany<Question, $this>
     */
    public function questions(): HasMany
    {
        return $this->hasMany(Question::class)->orderBy('order');
    }

    /**
     * @return HasMany<ExamAssignment, $this>
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(ExamAssignment::class);
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function assignedStudents(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'exam_assignments', 'exam_id', 'student_id')
            ->withPivot('assigned_at')
            ->withTimestamps();
    }

    /**
     * @return HasMany<ExamAttempt, $this>
     */
    public function attempts(): HasMany
    {
        return $this->hasMany(ExamAttempt::class);
    }

    public function isAvailable(): bool
    {
        $now = now();

        // Use Carbon instances for comparison, ignoring the string-formatting accessors
        $start = \Illuminate\Support\Carbon::parse($this->getRawOriginal('start_time'));
        $end = \Illuminate\Support\Carbon::parse($this->getRawOriginal('end_time'));

        return $this->is_published
            && $start <= $now
            && $end >= $now;
    }

    public function getTotalPointsAttribute(): float
    {
        return $this->questions->sum('points');
    }

    /**
     * Ensure dates are formatted correctly for the frontend input (local time).
     */
    protected function startTime(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn ($value) => \Illuminate\Support\Carbon::parse($value)->format('Y-m-d\TH:i'),
        );
    }

    protected function endTime(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn ($value) => \Illuminate\Support\Carbon::parse($value)->format('Y-m-d\TH:i'),
        );
    }
}
