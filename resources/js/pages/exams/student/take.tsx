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
import { Checkbox } from '@/components/ui/checkbox';
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
    const saveTimeoutRef = useRef<NodeJS.Timeout|null>(null);

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
                description: `Security Warning! Attempts: ${count}/5`,
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
            description: `From Instructor: ${e.teacher_name}`,
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
                toast.info('Exam Resumed', {
                    description: 'The instructor has resumed your exam session.',
                });
            }
        }
    });

    // Real-time Time Extension Listener
    useEcho(`exam-room.${exam.id}`, '.ExamTimeExtended', (e: any) => {
        if (e.attempt_id == attempt.id) {
            setTimeRemaining(e.new_remaining_time);
            toast.success('Time Extended! 🎁', {
                description: 'The instructor has granted you extra time for this exam.',
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
                <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
                    <Loader2Icon className="size-16 animate-spin text-primary mb-6" />
                    <h1 className="text-3xl font-black mb-2">{t('exam.take.submitting')}...</h1>
                    <p className="text-slate-400 font-medium">Please wait while your answers are securely saved...</p>
                </div>
            </>
        );
    }

    if (!examStarted && !hasEnteredFullscreen) {
        return (
            <>
                <Head title={`${t('exam.take.start')}: ${exam.title}`} />
                <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
                    <Card className="w-full max-w-lg shadow-xl border-t-4 border-t-primary">
                        <CardHeader className="text-center pt-8">
                            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
                                <FileTextIcon className="size-8 text-primary" />
                            </div>
                            <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">
                                {exam.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8 pb-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 font-bold text-slate-900 border-b pb-2">
                                    <ClipboardCheckIcon className="size-5 text-primary" />
                                    {t('exam.take.beforeYouBegin')}
                                </div>
                                <ul className="space-y-4">
                                    {[1, 2, 3, 4].map((num) => (
                                        <li key={num} className="flex gap-3 text-sm text-slate-600">
                                            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                                                {num}
                                            </div>
                                            {(t as any)(`exam.take.rule${num}`)}
                                        </li>
                                    ))}
                                    <li className="flex gap-3 text-sm text-slate-600 font-bold border-t pt-4">
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
                                    Entering Fullscreen Mode
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
                <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm text-white p-6 text-center">
                    <div className="mb-8 rounded-full bg-amber-500/20 p-6 ring-1 ring-amber-500/50">
                        <PauseIcon className="size-16 text-amber-500 animate-pulse" />
                    </div>
                    <h2 className="text-4xl font-black tracking-tight uppercase mb-4">Exam Paused</h2>
                    <p className="text-xl text-slate-300 max-w-lg font-medium leading-relaxed mb-8">
                        The instructor has temporarily paused your exam session. Please wait for further instructions.
                    </p>
                    <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 italic">
                        <div className="size-2 rounded-full bg-emerald-500 animate-ping" />
                        Awaiting Instructor Signal...
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
                                <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
                                    <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-slate-700">
                                        <AlertTriangleIcon className="size-4 text-amber-500" />
                                        {t('exam.take.beforeYouBegin')}
                                    </h3>
                                    <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
                                        <li>{t('exam.take.rule1')}</li>
                                        <li>{t('exam.take.rule2')}</li>
                                        <li>{t('exam.take.rule3')}</li>
                                        <li>{t('exam.take.rule4')}</li>
                                    </ul>
                                </div>

                                {reloadCountdown !== null && (
                                    <div className="rounded-xl bg-red-600 p-4 text-white text-center shadow-lg animate-pulse border-2 border-red-400">
                                        <p className="text-xs uppercase font-black tracking-widest opacity-80 mb-1">
                                            Security Submission Imminent
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
                                    <p className="text-center text-xs text-slate-500 font-medium">
                                        {lockReason}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
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

                            <Button data-test="header-submit-button" onClick={handleSubmit}>
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
                        <Button data-test="confirm-submit-button" onClick={handleConfirmSubmit}>
                            {t('exam.take.submit')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
