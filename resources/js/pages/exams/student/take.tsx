import { Head, router } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import {
    AlertTriangleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ClipboardCheckIcon,
    ClockIcon,
    FileTextIcon,
    FlagIcon,
    SaveIcon,
    SendIcon,
    MaximizeIcon,
    ShieldAlertIcon,
    MailIcon,
    PauseIcon,
    Loader2Icon,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useExamSecurity } from '@/hooks/use-exam-security';
import { useLanguage } from '@/hooks/use-language';
import { cn } from '@/lib/utils';
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
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(false);
    const [examStarted, setExamStarted] = useState(() => {
        // Auto-start if attempt is already in progress (remaining time < duration)
        const isAlreadyStarted = attempt.remaining_time < exam.duration_minutes * 60;
        return isAlreadyStarted;
    });
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [isPaused, setIsPaused] = useState(attempt.is_paused);
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
        isKicked,
        lockReason,
        reloadCountdown,
        hasEnteredFullscreen,
    } = useExamSecurity({
        attemptId: attempt.id,
        examId: exam.id,
        maxViolations: 5,
        initialViolationCount: attempt.violation_count || 0,
        onViolation: (type, count) => {
            setViolationCount(count);

            // Show premium security toast warning
            toast.error(t(`violation.${type}` as any) || type.replace(/_/g, ' '), {
                icon: <ShieldAlertIcon className="size-5 text-destructive" />,
                description: `${t('exam.take.securityWarning')} ${t('exam.take.securityAttempts', [count, 5])}`,
                duration: 6000,
            });
        },
        onAutoSubmit: handleAutoSubmit,
        onPauseStatusChange: (paused) => {
            if (paused !== isPaused) {
                setIsPaused(paused);
                if (paused) {
                    exitFullscreen();
                }
            }
        },
        enabled: examStarted && !new URLSearchParams(window.location.search).has('no_security'),
        isPaused: isPaused,
        initialSessionToken: session_token,
    });

    // Sync isPaused with props (for refreshes or Inertia updates)
    useEffect(() => {
        if (attempt.is_paused !== isPaused) {
            setIsPaused(attempt.is_paused);
            if (attempt.is_paused) {
                exitFullscreen();
            }
        }
    }, [attempt.is_paused, isPaused, exitFullscreen]);

    // Real-time Teacher Broadcast Listener
    useEcho(`exam-room.${exam.id}`, '.TeacherMessageBroadcast', (e: any) => {
        toast.info(e.message, {
            icon: <MailIcon className="size-5 text-blue-600" />,
            description: t('exam.take.fromInstructor', [e.teacher_name]),
            duration: Infinity, // Keep it until student dismisses it
        });
    });

    // Real-time Pause Listener
    useEcho(`exam-room.${exam.id}`, '.ExamAttemptPaused', (e: any) => {
        // Use loose equality (==) for ID check to handle string/number mismatch
        if (e.attempt_id == attempt.id) {
            setIsPaused(e.is_paused);
            if (e.remaining_time !== undefined) {
                setTimeRemaining(e.remaining_time);
            }
            if (e.is_paused) {
                exitFullscreen();
            } else {
                toast.info(t('exam.take.resumed.title'), {
                    description: t('exam.take.resumed.desc'),
                });
            }
        }
    });

    // Real-time Time Extension Listener
    useEcho(`exam-room.${exam.id}`, '.ExamTimeExtended', (e: any) => {
        if (e.attempt_id == attempt.id) {
            setTimeRemaining(e.new_remaining_time);
            toast.success(t('exam.take.timeExtended.title'), {
                description: t('exam.take.timeExtended.desc'),
                icon: <ClockIcon className="size-5 text-emerald-600" />,
            });
        }
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
        if (!examStarted || isLocked || isFullscreen === false || isPaused) return;

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
    }, [examStarted, isLocked, isFullscreen, isPaused, handleAutoSubmit]);

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
                    if (response.status === 403) {
                        window.location.reload();
                        return;
                    }
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

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            saveAnswer(questionId, data);
        }, 1000);
    };

    const handleSingleChoice = (optionId: number) => {
        handleAnswerChange(currentQuestion.id, {
            selected_options: [optionId],
        });
    };

    const handleMultipleChoice = (optionId: number, checked: boolean) => {
        const current = answers[currentQuestion.id]?.selected_options || [];
        const updated = checked
            ? [...current, optionId]
            : current.filter((id) => id !== optionId);
        handleAnswerChange(currentQuestion.id, { selected_options: updated });
    };

    const handleTrueFalse = (value: string) => {
        handleAnswerChange(currentQuestion.id, { text_answer: value });
    };

    const handleTextAnswer = (text: string) => {
        handleAnswerChange(currentQuestion.id, { text_answer: text });
    };

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

    const handleSubmit = () => {
        setSubmitting(true);
        setShowSubmitConfirm(true);
    };

    const handleConfirmSubmit = () => {
        setShowSubmitConfirm(false);
        exitFullscreen();
        router.post(`/exam/attempt/${attempt.id}/submit`);
    };

    const handleCancelSubmit = () => {
        setShowSubmitConfirm(false);
        setSubmitting(false);
    };

    const currentAnswer = answers[currentQuestion?.id];
    const answeredCount = Object.keys(answers).filter((qId) => {
        const ans = answers[parseInt(qId)];
        return (
            (ans.selected_options && ans.selected_options.length > 0) ||
            (ans.text_answer && ans.text_answer.trim())
        );
    }).length;

    const isLowTime = timeRemaining < 300;

    if (isKicked) {
        return (
            <>
                <Head title="Submitting Exam..." />
                <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-background text-foreground p-6 text-center">
                    <Loader2Icon className="size-16 animate-spin text-primary mb-6" />
                    <h1 className="text-3xl font-black mb-2">{t('exam.take.submitting')}...</h1>
                    <p className="text-muted-foreground font-medium">{t('exam.take.submitting.desc')}</p>
                </div>
            </>
        );
    }

    if (!examStarted && !hasEnteredFullscreen) {
        return (
            <>
                <Head title={`${t('exam.take.start')}: ${exam.title}`} />
                <div className="flex min-h-screen items-center justify-center bg-background p-6">
                    <Card className="w-full max-w-lg shadow-xl border-t-4 border-t-primary">
                        <CardHeader className="text-center pt-8">
                            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
                                <FileTextIcon className="size-8 text-primary" />
                            </div>
                            <CardTitle className="text-2xl font-black text-foreground tracking-tight">
                                {exam.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8 pb-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 font-bold text-foreground border-b pb-2">
                                    <ClipboardCheckIcon className="size-5 text-primary" />
                                    {t('exam.take.beforeYouBegin')}
                                </div>
                                <ul className="space-y-4">
                                    {[1, 2, 3, 4].map((num) => (
                                        <li key={num} className="flex gap-3 text-sm text-muted-foreground">
                                            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                                                {num}
                                            </div>
                                            {(t as any)(`exam.take.rule${num}`)}
                                        </li>
                                    ))}
                                    <li className="flex gap-3 text-sm text-muted-foreground font-bold border-t pt-4">
                                        <ClockIcon className="size-5 shrink-0 text-primary" />
                                        <span>
                                            {t('exam.take.rule5')} {Math.floor(attempt.remaining_time / 60)} {t('exam.minutes')}
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="button"
                                    onClick={handleStartExam}
                                    className="w-full h-14 text-lg font-bold shadow-lg"
                                    size="lg"
                                >
                                    <MaximizeIcon className="mr-2 size-6" />
                                    {t('exam.take.start').toUpperCase()}
                                </Button>
                                <p className="mt-4 text-center text-[11px] text-slate-400 uppercase font-black tracking-widest">
                                    {t('exam.take.enteringMode')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    if (isPaused) {
        return (
            <>
                <Head title="Exam Paused" />
                <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm text-foreground p-6 text-center">
                    <div className="mb-8 rounded-full bg-amber-500/20 p-6 ring-1 ring-amber-500/50">
                        <PauseIcon className="size-16 text-amber-500 animate-pulse" />
                    </div>
                    <h2 className="text-4xl font-black tracking-tight uppercase mb-4">{t('exam.take.paused.title')}</h2>
                    <p className="text-xl text-muted-foreground max-w-lg font-medium leading-relaxed mb-8">
                        {t('exam.take.paused.desc')}
                    </p>
                    <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground bg-muted/20 px-6 py-3 rounded-2xl border border-border italic">
                        <div className="size-2 rounded-full bg-emerald-500 animate-ping" />
                        {t('exam.take.paused.awaiting')}
                    </div>
                </div>
            </>
        );
    }

    if (!isFullscreen && !new URLSearchParams(window.location.search).has('no_security')) {
        return (
            <>
                <Head title={t('exam.take.fullscreenRequired')} />
                <div className="flex min-h-screen items-center justify-center bg-background p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
                                <MaximizeIcon className="size-8 text-primary" />
                            </div>
                            <CardTitle className="text-xl">
                                {t('exam.take.fullscreenRequired')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-center">
                            <p className="text-muted-foreground">
                                {t('exam.take.fullscreenDesc')}
                            </p>

                            {reloadCountdown !== null && (
                                <div className="rounded-md bg-red-50 p-3 text-red-700">
                                    <p className="font-medium animate-pulse">
                                        {t('exam.take.returnWithin', [reloadCountdown])}
                                    </p>
                                </div>
                            )}

                            <Button
                                type="button"
                                onClick={isLocked ? returnToExam : enterFullscreen}
                                className="w-full"
                                size="lg"
                            >
                                <MaximizeIcon className="mr-2 size-5" />
                                {isLocked ? t('exam.take.return') : t('exam.take.enterFullscreen')}
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
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md px-4">
                        <Card className="w-full max-w-lg border-red-500/50 shadow-2xl">
                            <CardHeader className="text-center pb-2">
                                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100 ring-8 ring-red-50">
                                    <ShieldAlertIcon className="size-8 text-red-600" />
                                </div>
                                <CardTitle className="text-2xl font-black text-red-600 uppercase tracking-tight">
                                    {t('exam.take.locked').toUpperCase()}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="rounded-lg bg-muted p-4 border border-border">
                                    <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-foreground">
                                        <AlertTriangleIcon className="size-4 text-amber-500" />
                                        {t('exam.take.beforeYouBegin')}
                                    </h3>
                                    <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                                        <li>{t('exam.take.rule1')}</li>
                                        <li>{t('exam.take.rule2')}</li>
                                        <li>{t('exam.take.rule3')}</li>
                                        <li>{t('exam.take.rule4')}</li>
                                    </ul>
                                </div>

                                {reloadCountdown !== null && (
                                    <div className="rounded-xl bg-red-600 p-4 text-white text-center shadow-lg animate-pulse border-2 border-red-400">
                                        <p className="text-xs uppercase font-black tracking-widest opacity-80 mb-1">
                                            {t('exam.take.securityImminent')}
                                        </p>
                                        <p className="text-xl font-black">
                                            {t('exam.take.returnWithin', [reloadCountdown]).toUpperCase()}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-3 pt-2">
                                    <Button
                                        onClick={returnToExam}
                                        className="w-full h-14 text-lg font-bold shadow-lg"
                                        size="lg"
                                        variant="destructive"
                                    >
                                        <MaximizeIcon className="mr-2 size-6" />
                                        {t('exam.take.return').toUpperCase()}
                                    </Button>
                                    <p className="text-center text-xs text-muted-foreground font-medium">
                                        {lockReason}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Header */}
                <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md px-4 py-2 sm:py-3">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                        <div className="flex flex-1 items-center gap-2 min-w-0">
                            <h1 className="font-bold truncate text-sm sm:text-base">{exam.title}</h1>
                            <div className="flex items-center gap-1.5 shrink-0">
                                {saving && (
                                    <div className="flex size-5 items-center justify-center text-blue-500 animate-pulse" title={t('exam.take.saving')}>
                                        <SaveIcon className="size-4" />
                                    </div>
                                )}
                                {saveError && (
                                    <div className="flex size-5 items-center justify-center text-rose-500" title={t('exam.take.errorSaving')}>
                                        <AlertTriangleIcon className="size-4" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            {violationCount > 0 && (
                                <Badge variant="destructive" className="h-7 px-2 text-[10px] font-black uppercase tracking-wider">
                                    <ShieldAlertIcon className="mr-1 size-3" />
                                    <span className="hidden xs:inline">{violationCount} {t('exam.violations')}</span>
                                    <span className="xs:hidden">{violationCount}</span>
                                </Badge>
                            )}

                            <div
                                className={cn(
                                    "flex items-center gap-2 rounded-[0.6rem] px-3 py-1.5 font-black text-sm transition-colors",
                                    isLowTime
                                        ? 'animate-pulse bg-destructive/10 text-destructive ring-2 ring-destructive/20'
                                        : 'bg-muted text-foreground border border-border'
                                )}
                            >
                                <ClockIcon className="size-4" />
                                {formatTime(timeRemaining)}
                            </div>

                            <Button
                                data-test="header-submit-button"
                                size="sm"
                                onClick={handleSubmit}
                                className="hidden sm:flex h-9 rounded-xl font-black uppercase tracking-widest text-[10px] bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
                            >
                                <SendIcon className="size-3.5" />
                                {t('exam.take.submit')}
                            </Button>
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 h-[2px] bg-muted w-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                        />
                    </div>
                </header>

                <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col md:flex-row pb-24 md:pb-0">
                    {/* Question Navigation Sidebar */}
                    <aside className="w-full border-b bg-muted/20 p-4 md:w-64 md:border-r md:border-b-0">
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
                                            className={`relative flex h-10 items-center justify-center rounded text-sm font-medium transition-colors ${isCurrent
                                                    ? 'bg-primary text-primary-foreground'
                                                    : isAnswered
                                                        ? 'bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30'
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

                            <div className="mt-4 hidden space-y-2 border-t pt-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground md:block">
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/30" />
                                    <span>{t('exam.take.answered')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-muted" />
                                    <span>{t('exam.take.notAnswered')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FlagIcon className="size-3.5 fill-amber-500 text-amber-500" />
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
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-muted border-border text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                                                {t('exam.take.question')} {currentIndex + 1} {t('exam.of')}{' '}
                                                {questions.length}
                                            </Badge>
                                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none text-[10px] font-bold shadow-sm px-2">
                                                {currentQuestion.points} {t('exam.points')}
                                            </Badge>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                toggleFlag(currentQuestion.id)
                                            }
                                            className={cn(
                                                "h-8 rounded-lg text-xs font-bold",
                                                flagged.has(currentQuestion.id) ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 hover:text-amber-700' : 'text-muted-foreground hover:bg-muted'
                                            )}
                                        >
                                            <FlagIcon
                                                className={cn("size-3.5 mr-1.5", flagged.has(currentQuestion.id) && "fill-amber-500")}
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
                                            <div className="space-y-3">
                                                {currentQuestion.options.map(
                                                    (option) => (
                                                        <div
                                                            key={option.id}
                                                            onClick={() => handleSingleChoice(option.id)}
                                                            className={cn(
                                                                "flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all duration-200",
                                                                currentAnswer?.selected_options?.includes(option.id)
                                                                    ? 'border-primary bg-primary/5 shadow-sm'
                                                                    : 'border-border bg-card hover:border-primary/30 hover:bg-muted/20'
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "flex size-5 shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors",
                                                                currentAnswer?.selected_options?.includes(option.id) ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border"
                                                            )}>
                                                                {currentAnswer?.selected_options?.includes(option.id) && <div className="size-2 rounded-full bg-primary-foreground shadow-sm" />}
                                                            </div>
                                                            <span className={cn(
                                                                "text-sm font-bold transition-colors",
                                                                currentAnswer?.selected_options?.includes(option.id) ? "text-primary" : "text-foreground"
                                                            )}>
                                                                {option.content}
                                                            </span>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}

                                    {/* Multiple Choice Multiple */}
                                    {currentQuestion.type ===
                                        'multiple_choice_multiple' && (
                                            <div className="space-y-3">
                                                <p className="text-sm font-semibold text-muted-foreground mb-2">
                                                    {t('exam.take.selectMultiple')}
                                                </p>
                                                {currentQuestion.options.map(
                                                    (option) => (
                                                        <div
                                                            key={option.id}
                                                            onClick={() => handleMultipleChoice(option.id, !(currentAnswer?.selected_options?.includes(option.id)))}
                                                            className={cn(
                                                                "flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all duration-200",
                                                                currentAnswer?.selected_options?.includes(option.id)
                                                                    ? 'border-primary bg-primary/5 shadow-sm'
                                                                    : 'border-border bg-card hover:border-primary/30 hover:bg-muted/20'
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "flex size-5 shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors",
                                                                currentAnswer?.selected_options?.includes(option.id) ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border"
                                                            )}>
                                                                {currentAnswer?.selected_options?.includes(option.id) && (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="size-3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                                )}
                                                            </div>
                                                            <span className={cn(
                                                                "text-sm font-bold transition-colors",
                                                                currentAnswer?.selected_options?.includes(option.id) ? "text-primary" : "text-foreground"
                                                            )}>
                                                                {option.content}
                                                            </span>
                                                        </div>
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
                                                    className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border p-4 transition-colors ${currentAnswer?.text_answer ===
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
                                                        {t(`exams.questions.${value}` as any)}
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
                                        <Textarea
                                            value={
                                                currentAnswer?.text_answer || ''
                                            }
                                            onChange={(e) =>
                                                handleTextAnswer(e.target.value)
                                            }
                                            placeholder={t('exam.take.essayPlaceholder')}
                                            className="w-full text-lg"
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Navigation Buttons (Desktop) */}
                        <div className="mx-auto mt-8 hidden max-w-3xl items-center justify-between md:flex">
                            <Button
                                variant="outline"
                                className="h-11 px-6 rounded-xl font-bold border-2 border-border hover:bg-muted"
                                onClick={() =>
                                    setCurrentIndex(
                                        Math.max(0, currentIndex - 1),
                                    )
                                }
                                disabled={currentIndex === 0}
                            >
                                <ChevronLeftIcon className="size-4 mr-2" />
                                {t('exam.take.previous')}
                            </Button>

                            {currentIndex < questions.length - 1 ? (
                                <Button
                                    className="h-11 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
                                    onClick={() =>
                                        setCurrentIndex(currentIndex + 1)
                                    }
                                >
                                    {t('exam.take.next')}
                                    <ChevronRightIcon className="size-4 ml-2" />
                                </Button>
                            ) : (
                                <Button
                                    className="h-11 px-8 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
                                    onClick={handleSubmit}
                                >
                                    <SendIcon className="size-4 mr-2" />
                                    {t('exam.take.submit')}
                                </Button>
                            )}
                        </div>
                    </main>
                </div>

                {/* Sticky Bottom Navigation (Mobile Only) */}
                <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card/95 backdrop-blur-md border-t border-border p-4 pb-6 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="size-12 p-0 flex items-center justify-center rounded-2xl border-2 border-border"
                            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                            disabled={currentIndex === 0}
                        >
                            <ChevronLeftIcon className="size-6 text-muted-foreground" />
                        </Button>

                        <div className="flex-1 flex flex-col items-center justify-center -mt-1">
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                                {t('exam.take.questionStatus', [currentIndex + 1, questions.length])}
                            </div>
                            <div className="flex items-center gap-1.5 overflow-hidden w-full max-w-[100px] h-1.5 bg-muted rounded-full">
                                {questions.map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "h-full flex-1 transition-all",
                                            i === currentIndex ? "bg-primary" : (answers[questions[i].id] ? "bg-emerald-500" : "bg-muted-foreground/30")
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        {currentIndex < questions.length - 1 ? (
                            <Button
                                className="h-12 flex-1 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-foreground text-background border-none shadow-lg shadow-foreground/10"
                                onClick={() => setCurrentIndex(currentIndex + 1)}
                            >
                                {t('exam.take.next')}
                                <ChevronRightIcon className="size-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                className="h-12 flex-1 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-emerald-600 border-none shadow-lg shadow-emerald-600/10"
                                onClick={handleSubmit}
                            >
                                <SendIcon className="size-4 mr-2" />
                                {t('exam.take.submit')}
                            </Button>
                        )}
                    </div>
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
                        <Button data-test="confirm-submit-button" onClick={handleConfirmSubmit}>
                            {t('exam.take.submit')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
