import { Head, router } from '@inertiajs/react';
import {
    AlertTriangleIcon,
    ArrowLeftIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ClockIcon,
    FlagIcon,
    SaveIcon,
    SendIcon,
    MaximizeIcon,
    ShieldAlertIcon,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useExamSecurity } from '@/hooks/use-exam-security';
import { useLanguage } from '@/hooks/use-language';
import type {
    Exam,
    ExamAttempt,
    Question,
    QuestionOption,
} from '@/types';

interface QuestionWithAnswer extends Question {
    options: QuestionOption[];
}

interface Props {
    exam: Exam;
    attempt: ExamAttempt & { remaining_time: number };
    questions: QuestionWithAnswer[];
    answers: Record<
        number,
        { selected_options?: number[]; text_answer?: string }
    >;
    session_token?: string;
}

export default function TakeExam({
    exam,
    attempt,
    questions,
    answers: initialAnswers,
    session_token,
}: Props) {
    const { t } = useLanguage();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<
        Record<number, { selected_options?: number[]; text_answer?: string }>
    >(() => {
        // Initialize from existing answers
        const initial: Record<
            number,
            { selected_options?: number[]; text_answer?: string }
        > = {};
        questions.forEach((q) => {
            if (initialAnswers[q.id]) {
                initial[q.id] = {
                    selected_options:
                        initialAnswers[q.id].selected_options || [],
                    text_answer: initialAnswers[q.id].text_answer || '',
                };
            }
        });
        return initial;
    });
    const [flagged, setFlagged] = useState<Set<number>>(new Set());
    const [timeRemaining, setTimeRemaining] = useState(attempt.remaining_time);
    const [violationCount, setViolationCount] = useState(
        attempt.violation_count || 0,
    );
    const [showViolationWarning, setShowViolationWarning] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(false);
    const [examStarted, setExamStarted] = useState(() => {
        // Auto-start if attempt is already in progress (remaining time < duration)
        const isAlreadyStarted = attempt.remaining_time < exam.duration_minutes * 60;
        return isAlreadyStarted;
    });
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [lastViolationSeverity, setLastViolationSeverity] = useState<
        string | null
    >(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const currentQuestion = questions[currentIndex];

    // Auto-submit handler
    const handleAutoSubmit = useCallback(() => {
        router.post(
            `/exam/attempt/${attempt.id}/auto-submit`,
            {},
            {
                onFinish: () => {
                    // router.post follows redirect automatically
                },
            },
        );
    }, [attempt.id]);

    // Security hook - only enabled after exam starts
    const {
        enterFullscreen,
        exitFullscreen,
        returnToExam,
        setSubmitting,
        isLocked,
        lockReason,
        reloadCountdown,
        warningMessage,
        clearWarning,
    } = useExamSecurity({
        attemptId: attempt.id,
        examId: exam.id,
        maxViolations: 5,
        initialViolationCount: attempt.violation_count || 0,
        onViolation: (type, count, severity) => {
            setViolationCount(count);
            setLastViolationSeverity(severity);
            setShowViolationWarning(true);
            setTimeout(() => {
                setShowViolationWarning(false);
                setLastViolationSeverity(null);
            }, 3000);
        },
        onAutoSubmit: handleAutoSubmit,
        enabled: examStarted,
        initialSessionToken: session_token,
    });

    // Handle starting the exam (requires user gesture for fullscreen)
    const handleStartExam = async () => {
        const success = await enterFullscreen();
        setIsFullscreen(success);
        setExamStarted(true);
    };

    // Track fullscreen state
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener(
                'fullscreenchange',
                handleFullscreenChange,
            );
        };
    }, []);

    // Timer countdown - only runs after exam starts
    useEffect(() => {
        if (!examStarted) return;

        const interval = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [examStarted, handleAutoSubmit]);

    // Format time
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return h > 0
            ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            : `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Auto-save answer
    const saveAnswer = useCallback(
        async (
            questionId: number,
            data: { selected_options?: number[]; text_answer?: string },
        ) => {
            setSaving(true);
            setSaveError(false);
            try {
                const response = await fetch(`/exam/attempt/${attempt.id}/answer`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'))?.[2] || ''),
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        question_id: questionId,
                        ...data,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Save failed');
                }
            } catch (e) {
                console.error('Failed to save answer:', e);
                setSaveError(true);
            } finally {
                setSaving(false);
            }
        },
        [attempt.id],
    );

    // Handle answer change with debounced auto-save
    const handleAnswerChange = (
        questionId: number,
        data: { selected_options?: number[]; text_answer?: string },
    ) => {
        setAnswers((prev) => ({ ...prev, [questionId]: data }));

        // Debounce save
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            saveAnswer(questionId, data);
        }, 1000);
    };

    // Multiple choice single - select one option
    const handleSingleChoice = (optionId: number) => {
        handleAnswerChange(currentQuestion.id, {
            selected_options: [optionId],
        });
    };

    // Multiple choice multiple - toggle option
    const handleMultipleChoice = (optionId: number, checked: boolean) => {
        const current = answers[currentQuestion.id]?.selected_options || [];
        const updated = checked
            ? [...current, optionId]
            : current.filter((id) => id !== optionId);
        handleAnswerChange(currentQuestion.id, { selected_options: updated });
    };

    // True/False
    const handleTrueFalse = (value: string) => {
        handleAnswerChange(currentQuestion.id, { text_answer: value });
    };

    // Text answer
    const handleTextAnswer = (text: string) => {
        handleAnswerChange(currentQuestion.id, { text_answer: text });
    };

    // Toggle flag
    const toggleFlag = (questionId: number) => {
        setFlagged((prev) => {
            const next = new Set(prev);
            if (next.has(questionId)) {
                next.delete(questionId);
            } else {
                next.add(questionId);
            }
            return next;
        });
    };

    // Submit exam - show confirmation dialog
    const handleSubmit = () => {
        setSubmitting(true); // Prevent violations during confirmation
        setShowSubmitConfirm(true);
    };

    const handleConfirmSubmit = () => {
        setShowSubmitConfirm(false);
        exitFullscreen();
        router.post(`/exam/attempt/${attempt.id}/submit`);
    };

    const handleCancelSubmit = () => {
        setShowSubmitConfirm(false);
        setSubmitting(false); // Re-enable violation tracking
    };

    const currentAnswer = answers[currentQuestion?.id];
    const answeredCount = Object.keys(answers).filter((qId) => {
        const ans = answers[parseInt(qId)];
        return (
            (ans.selected_options && ans.selected_options.length > 0) ||
            (ans.text_answer && ans.text_answer.trim())
        );
    }).length;

    const isLowTime = timeRemaining < 300; // Less than 5 minutes

    // Show start screen before exam begins
    if (!examStarted) {
        return (
            <>
                <Head title={`${t('exam.take.start')}: ${exam.title}`} />
                <div className="flex min-h-screen items-center justify-center bg-background p-4">
                    <Card className="w-full max-w-lg">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl">
                                {exam.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold">
                                    {t('exam.take.beforeYouBegin')}
                                </h3>
                                <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                                    <li>{t('exam.take.rule1')}</li>
                                    <li>{t('exam.take.rule2')}</li>
                                    <li>{t('exam.take.rule3')}</li>
                                    <li>{t('exam.take.rule4')}</li>
                                    <li>
                                        {t('exam.take.rule5')}{' '}
                                        {Math.floor(
                                            attempt.remaining_time / 60,
                                        )}{' '}
                                        {t('exam.minutes')}
                                    </li>
                                    <li>{t('exam.questions')}: {questions.length}</li>
                                </ul>
                            </div>
                            <Button
                                onClick={handleStartExam}
                                className="w-full"
                                size="lg"
                            >
                                <MaximizeIcon className="mr-2 size-5" />
                                {t('exam.take.start')}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={`${exam.title}`} />
            <div className="flex min-h-screen flex-col bg-background select-none">
                {/* Blocking Overlay - shown when exam is locked */}
                {isLocked && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
                        <Card className="mx-4 w-full max-w-md">
                            <CardHeader className="text-center">
                                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100">
                                    <ShieldAlertIcon className="size-8 text-red-600" />
                                </div>
                                <CardTitle className="text-xl text-red-600">
                                    {t('exam.take.locked')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-center">
                                <p className="text-muted-foreground">
                                    {lockReason}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {t('exam.take.lockedReason')}
                                </p>
                                {reloadCountdown !== null && (
                                    <div className="rounded-md bg-red-50 p-3 text-red-700">
                                        <p className="font-medium animate-pulse">
                                            {t('exam.take.returnWithin', [reloadCountdown])}
                                        </p>
                                    </div>
                                )}
                                <div className="pt-2">
                                    <Button
                                        onClick={returnToExam}
                                        className="w-full"
                                        size="lg"
                                    >
                                        <ArrowLeftIcon className="mr-2 size-5" />
                                        {t('exam.take.return')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Warning Message Toast - shown after returning from long absence */}
                {warningMessage && (
                    <div className="fixed top-4 left-1/2 z-[101] -translate-x-1/2 animate-in slide-in-from-top">
                        <div className="flex max-w-lg items-center gap-3 rounded-lg bg-amber-600 px-6 py-4 text-white shadow-lg">
                            <AlertTriangleIcon className="size-6 shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium">Warning</p>
                                <p className="text-sm text-amber-100">
                                    {warningMessage}
                                </p>
                            </div>
                            <button
                                onClick={clearWarning}
                                className="shrink-0 rounded p-1 hover:bg-amber-700"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* Violation Warning Toast */}
                {showViolationWarning && !warningMessage && (
                    <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-top">
                        <div
                            className={`flex items-center gap-2 rounded-lg px-6 py-3 text-white shadow-lg ${
                                lastViolationSeverity === 'critical'
                                    ? 'bg-red-700'
                                    : lastViolationSeverity === 'high'
                                      ? 'bg-red-600'
                                      : lastViolationSeverity === 'medium'
                                        ? 'bg-orange-600'
                                        : 'bg-yellow-600'
                            }`}
                        >
                            <AlertTriangleIcon className="size-5" />
                            <span>
                                {t('exam.securityViolation')} ({violationCount}
                                /5)
                            </span>
                        </div>
                    </div>
                )}

                {/* Header */}
                <header className="sticky top-0 z-40 border-b bg-background px-4 py-3">
                    <div className="mx-auto flex max-w-7xl items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="font-semibold">{exam.title}</h1>
                            {saving && (
                                <Badge
                                    variant="secondary"
                                    className="animate-pulse"
                                >
                                    <SaveIcon className="mr-1 size-3" />
                                    {t('exam.take.saving')}
                                </Badge>
                            )}
                            {saveError && (
                                <Badge
                                    variant="destructive"
                                >
                                    <AlertTriangleIcon className="mr-1 size-3" />
                                    Error saving
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            {violationCount > 0 && (
                                <Badge variant="destructive">
                                    <AlertTriangleIcon className="mr-1 size-3" />
                                    {violationCount} {t('exam.violations')}
                                </Badge>
                            )}

                            {!isFullscreen && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => enterFullscreen()}
                                >
                                    <MaximizeIcon className="size-4" />
                                    {t('exam.take.fullscreen')}
                                </Button>
                            )}

                            <div
                                className={`flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-lg ${
                                    isLowTime
                                        ? 'animate-pulse bg-red-100 text-red-700'
                                        : 'bg-muted'
                                }`}
                            >
                                <ClockIcon className="size-5" />
                                {formatTime(timeRemaining)}
                            </div>

                            <Button onClick={handleSubmit}>
                                <SendIcon className="size-4" />
                                {t('exam.take.submit')}
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col md:flex-row">
                    {/* Question Navigation Sidebar */}
                    <aside className="w-full border-b bg-muted/30 p-4 md:w-64 md:border-r md:border-b-0">
                        <div className="sticky top-20">
                            <div className="mb-4">
                                <p className="text-sm text-muted-foreground">
                                    {t('exam.take.answered')}: {answeredCount}/{questions.length}
                                </p>
                            </div>
                            <div className="grid grid-cols-5 gap-2 md:grid-cols-4">
                                {questions.map((q, index) => {
                                    const ans = answers[q.id];
                                    const isAnswered =
                                        (ans?.selected_options &&
                                            ans.selected_options.length > 0) ||
                                        (ans?.text_answer &&
                                            ans.text_answer.trim());
                                    const isFlagged = flagged.has(q.id);
                                    const isCurrent = index === currentIndex;

                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() =>
                                                setCurrentIndex(index)
                                            }
                                            className={`relative flex h-10 items-center justify-center rounded text-sm font-medium transition-colors ${
                                                isCurrent
                                                    ? 'bg-primary text-primary-foreground'
                                                    : isAnswered
                                                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                      : 'bg-muted hover:bg-muted/80'
                                            }`}
                                        >
                                            {index + 1}
                                            {isFlagged && (
                                                <FlagIcon className="absolute -top-1 -right-1 size-3 fill-yellow-500 text-yellow-500" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-4 hidden space-y-2 border-t pt-4 text-xs text-muted-foreground md:block">
                                <div className="flex items-center gap-2">
                                    <span className="h-4 w-4 rounded bg-green-100" />
                                    <span>{t('exam.take.answered')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-4 w-4 rounded bg-muted" />
                                    <span>{t('exam.take.notAnswered')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FlagIcon className="size-4 fill-yellow-500 text-yellow-500" />
                                    <span>{t('exam.take.flaggedDesc')}</span>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Question Area */}
                    <main className="flex-1 p-4 md:p-6">
                        {currentQuestion && (
                            <Card className="mx-auto max-w-3xl">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">
                                                {t('exam.take.question')} {currentIndex + 1} {t('exam.of')}{' '}
                                                {questions.length}
                                            </Badge>
                                            <Badge variant="secondary">
                                                {currentQuestion.points} {t('exam.points')}
                                            </Badge>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                toggleFlag(currentQuestion.id)
                                            }
                                            className={
                                                flagged.has(currentQuestion.id)
                                                    ? 'text-yellow-600'
                                                    : ''
                                            }
                                        >
                                            <FlagIcon
                                                className={`size-4 ${flagged.has(currentQuestion.id) ? 'fill-yellow-500' : ''}`}
                                            />
                                            {flagged.has(currentQuestion.id)
                                                ? t('exam.take.unflag')
                                                : t('exam.take.flag')}
                                        </Button>
                                    </div>
                                    <CardTitle className="text-lg">
                                        {currentQuestion.content}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Multiple Choice Single */}
                                    {currentQuestion.type ===
                                        'multiple_choice_single' && (
                                        <div className="space-y-2">
                                            {currentQuestion.options.map(
                                                (option) => (
                                                    <label
                                                        key={option.id}
                                                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                                                            currentAnswer?.selected_options?.includes(
                                                                option.id,
                                                            )
                                                                ? 'border-primary bg-primary/5'
                                                                : 'hover:bg-muted/50'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`question-${currentQuestion.id}`}
                                                            checked={
                                                                currentAnswer?.selected_options?.includes(
                                                                    option.id,
                                                                ) || false
                                                            }
                                                            onChange={() =>
                                                                handleSingleChoice(
                                                                    option.id,
                                                                )
                                                            }
                                                            className="size-4"
                                                        />
                                                        <span>
                                                            {option.content}
                                                        </span>
                                                    </label>
                                                ),
                                            )}
                                        </div>
                                    )}

                                    {/* Multiple Choice Multiple */}
                                    {currentQuestion.type ===
                                        'multiple_choice_multiple' && (
                                        <div className="space-y-2">
                                            <p className="text-sm text-muted-foreground">
                                                {t('exam.take.selectMultiple')}
                                            </p>
                                            {currentQuestion.options.map(
                                                (option) => (
                                                    <label
                                                        key={option.id}
                                                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                                                            currentAnswer?.selected_options?.includes(
                                                                option.id,
                                                            )
                                                                ? 'border-primary bg-primary/5'
                                                                : 'hover:bg-muted/50'
                                                        }`}
                                                    >
                                                        <Checkbox
                                                            checked={
                                                                currentAnswer?.selected_options?.includes(
                                                                    option.id,
                                                                ) || false
                                                            }
                                                            onCheckedChange={(
                                                                checked,
                                                            ) =>
                                                                handleMultipleChoice(
                                                                    option.id,
                                                                    checked as boolean,
                                                                )
                                                            }
                                                        />
                                                        <span>
                                                            {option.content}
                                                        </span>
                                                    </label>
                                                ),
                                            )}
                                        </div>
                                    )}

                                    {/* True/False */}
                                    {currentQuestion.type === 'true_false' && (
                                        <div className="flex flex-col gap-4 sm:flex-row">
                                            {['true', 'false'].map((value) => (
                                                <label
                                                    key={value}
                                                    className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border p-4 transition-colors ${
                                                        currentAnswer?.text_answer ===
                                                        value
                                                            ? 'border-primary bg-primary/5'
                                                            : 'hover:bg-muted/50'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`question-${currentQuestion.id}`}
                                                        checked={
                                                            currentAnswer?.text_answer ===
                                                            value
                                                        }
                                                        onChange={() =>
                                                            handleTrueFalse(
                                                                value,
                                                            )
                                                        }
                                                        className="size-4"
                                                    />
                                                    <span className="font-medium capitalize">
                                                        {value}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {/* Short Text */}
                                    {currentQuestion.type === 'short_text' && (
                                        <input
                                            type="text"
                                            value={
                                                currentAnswer?.text_answer || ''
                                            }
                                            onChange={(e) =>
                                                handleTextAnswer(e.target.value)
                                            }
                                            placeholder={t('exam.take.shortTextPlaceholder')}
                                            className="w-full rounded-lg border p-4 text-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                                        />
                                    )}

                                    {/* Essay */}
                                    {currentQuestion.type === 'essay' && (
                                        <textarea
                                            value={
                                                currentAnswer?.text_answer || ''
                                            }
                                            onChange={(e) =>
                                                handleTextAnswer(e.target.value)
                                            }
                                            placeholder={t('exam.take.essayPlaceholder')}
                                            rows={10}
                                            className="w-full resize-y rounded-lg border p-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Navigation Buttons */}
                        <div className="mx-auto mt-6 flex max-w-3xl items-center justify-between">
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setCurrentIndex(
                                        Math.max(0, currentIndex - 1),
                                    )
                                }
                                disabled={currentIndex === 0}
                            >
                                <ChevronLeftIcon className="size-4" />
                                {t('exam.take.previous')}
                            </Button>

                            {currentIndex < questions.length - 1 ? (
                                <Button
                                    onClick={() =>
                                        setCurrentIndex(currentIndex + 1)
                                    }
                                >
                                    {t('exam.take.next')}
                                    <ChevronRightIcon className="size-4" />
                                </Button>
                            ) : (
                                <Button onClick={handleSubmit}>
                                    <SendIcon className="size-4" />
                                    {t('exam.take.submit')}
                                </Button>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            {/* Submit Confirmation Dialog */}
            <Dialog
                open={showSubmitConfirm}
                onOpenChange={(open) => {
                    if (!open) handleCancelSubmit();
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('exam.take.confirmTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('exam.take.confirmDesc')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground">
                            {t('exam.take.confirmStats', [answeredCount, questions.length])}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancelSubmit}>
                            {t('common.cancel')}
                        </Button>
                        <Button onClick={handleConfirmSubmit}>
                            {t('exam.take.submit')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
