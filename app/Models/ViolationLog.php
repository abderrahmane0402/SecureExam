<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ViolationLog extends Model
{
    /** @use HasFactory<\Database\Factories\ViolationLogFactory> */
    use HasFactory;

    public const TYPE_TAB_SWITCH = 'tab_switch';

    public const TYPE_WINDOW_BLUR = 'window_blur';

    public const TYPE_FULLSCREEN_EXIT = 'fullscreen_exit';

    public const TYPE_COPY = 'copy';

    public const TYPE_PASTE = 'paste';

    public const TYPE_RIGHT_CLICK = 'right_click';

    public const TYPE_MULTIPLE_TABS = 'multiple_tabs';

    public const TYPE_DEVTOOLS = 'devtools';

    public const TYPE_VIEW_SOURCE = 'view_source';

    public const TYPES = [
        self::TYPE_TAB_SWITCH,
        self::TYPE_WINDOW_BLUR,
        self::TYPE_FULLSCREEN_EXIT,
        self::TYPE_COPY,
        self::TYPE_PASTE,
        self::TYPE_RIGHT_CLICK,
        self::TYPE_MULTIPLE_TABS,
        self::TYPE_DEVTOOLS,
        self::TYPE_VIEW_SOURCE,
    ];

    public const SEVERITY_LOW = 'low';

    public const SEVERITY_MEDIUM = 'medium';

    public const SEVERITY_HIGH = 'high';

    public const SEVERITY_CRITICAL = 'critical';

    protected $fillable = [
        'attempt_id',
        'violation_type',
        'details',
        'duration_seconds',
        'severity',
        'occurred_at',
        'returned_at',
        'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
            'returned_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<ExamAttempt, $this>
     */
    public function attempt(): BelongsTo
    {
        return $this->belongsTo(ExamAttempt::class, 'attempt_id');
    }
}
