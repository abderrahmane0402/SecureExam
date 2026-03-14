<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ExamSession extends Model
{
    /** @use HasFactory<\Database\Factories\ExamSessionFactory> */
    use HasFactory;

    protected $fillable = [
        'attempt_id',
        'session_token',
        'ip_address',
        'user_agent',
        'last_activity',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'last_activity' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<ExamAttempt, $this>
     */
    public function attempt(): BelongsTo
    {
        return $this->belongsTo(ExamAttempt::class, 'attempt_id');
    }

    public static function generateToken(): string
    {
        return Str::random(64);
    }
}
