<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Question extends Model
{
    /** @use HasFactory<\Database\Factories\QuestionFactory> */
    use HasFactory;

    public const TYPE_MULTIPLE_CHOICE_SINGLE = 'multiple_choice_single';

    public const TYPE_MULTIPLE_CHOICE_MULTIPLE = 'multiple_choice_multiple';

    public const TYPE_TRUE_FALSE = 'true_false';

    public const TYPE_SHORT_TEXT = 'short_text';

    public const TYPE_ESSAY = 'essay';

    public const TYPES = [
        self::TYPE_MULTIPLE_CHOICE_SINGLE,
        self::TYPE_MULTIPLE_CHOICE_MULTIPLE,
        self::TYPE_TRUE_FALSE,
        self::TYPE_SHORT_TEXT,
        self::TYPE_ESSAY,
    ];

    protected $fillable = [
        'exam_id',
        'type',
        'content',
        'image_path',
        'points',
        'order',
        'correct_answer',
        'grading_notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'points' => 'decimal:2',
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
     * @return HasMany<QuestionOption, $this>
     */
    public function options(): HasMany
    {
        return $this->hasMany(QuestionOption::class)->orderBy('order');
    }

    /**
     * @return HasMany<ExamAnswer, $this>
     */
    public function answers(): HasMany
    {
        return $this->hasMany(ExamAnswer::class);
    }

    public function isAutoGradable(): bool
    {
        return in_array($this->type, [
            self::TYPE_MULTIPLE_CHOICE_SINGLE,
            self::TYPE_MULTIPLE_CHOICE_MULTIPLE,
            self::TYPE_TRUE_FALSE,
            self::TYPE_SHORT_TEXT,
        ]);
    }

    public function requiresOptions(): bool
    {
        return in_array($this->type, [
            self::TYPE_MULTIPLE_CHOICE_SINGLE,
            self::TYPE_MULTIPLE_CHOICE_MULTIPLE,
        ]);
    }
}
