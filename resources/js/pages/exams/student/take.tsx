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
import type { Exam, ExamAttempt, Question, QuestionOption } from '@/types';

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
        const isAlreadyStarted =
            attempt.remaining_time < exam.duration_minutes * 60;
        return isAlreadyStarted;
    });
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [isPaused, setIsPaused] = useState(attempt.is_paused);
    const [isKickedState, setIsKickedState] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<
        'stable' | 'unstable' | 'offline'
    >('stable');
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const currentQuestion = questions[currentIndex];

    // Monitor WebSocket/Internet health
    useEffect(() => {
        const handleOnline = () => setConnectionStatus('stable');
        const handleOffline = () => setConnectionStatus('offline');

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check if Echo is actually connected
        const checkEcho = setInterval(() => {
            const echo = (window as any).Echo;
            if (
                echo &&
                echo.connector.pusher.connection.state !== 'connected'
            ) {
                setConnectionStatus('unstable');
            } else if (window.navigator.onLine) {
                setConnectionStatus('stable');
            }
        }, 5000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(checkEcho);
        };
    }, []);

    // ... (rest of listeners)

    // Real-time Individual Message Listener
    useEcho(`exam-room.${exam.id}`, '.IndividualMessageBroadcast', (e: any) => {
        if (e.student_id == attempt.student_id) {
            toast.info(e.message, {
                icon: <SendIcon className="size-5 text-indigo-600" />,
                description: t('exam.take.fromInstructor', [e.teacher_name]),
                duration: 15000,
            });
        }
    });

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
        isKicked: isKickedFromSecurity,
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
            toast.error(
                t(`violation.${type}` as any) || type.replace(/_/g, ' '),
                {
                    icon: (
                        <ShieldAlertIcon className="size-5 text-destructive" />
                    ),
                    description: `${t('exam.take.securityWarning')} ${t('exam.take.securityAttempts', [count, 5])}`,
                    duration: 6000,
                },
            );
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
        enabled:
            examStarted &&
            !new URLSearchParams(window.location.search).has('no_security'),
        isPaused: isPaused,
        initialSessionToken: session_token,
    });

    const isKicked = isKickedState || isKickedFromSecurity;

    // Sync state with props when they change from server-side updates
    useEffect(() => {
        setIsPaused(attempt.is_paused);
    }, [attempt.is_paused]);

    useEffect(() => {
        setViolationCount(attempt.violation_count || 0);
    }, [attempt.violation_count]);

    useEffect(() => {
        setTimeRemaining(attempt.remaining_time);
    }, [attempt.remaining_time]);

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

    // Real-time Status Change Listener (Force Submit / Kick)
    useEcho(`exam-room.${exam.id}`, '.ExamAttemptStatusChanged', (e: any) => {
        // ONLY act if this is about THIS student
        if (e.student_id != attempt.student_id) return;

        const kickStatuses = ['submitted', 'auto_submitted', 'graded', 'blocked'];
        
        if (kickStatuses.includes(e.status)) {
            setIsKickedState(true);
            // Small delay to let them see the "Submitting..." overlay before reload
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else if (e.status === 'violations_cleared') {
            setViolationCount(0);
            toast.success(t('exam.take.violationsCleared.title'), {
                description: t('exam.take.violationsCleared.desc'),
                icon: <ShieldAlertIcon className="size-5 text-emerald-500" />,
                duration: 8000,
            });
        }
    });

    // Real-time Question Updates Listener
    useEcho(`exam-room.${exam.id}`, '.ExamQuestionsUpdated', (e: any) => {
        // Silently reload questions from the server
        router.reload({
            only: ['questions'],
            onSuccess: () => {
                // If a question was updated or deleted, reset the local answer for it
                if (
                    e.question_id &&
                    (e.change_type === 'updated' || e.change_type === 'deleted')
                ) {
                    setAnswers((prev) => {
                        const next = { ...prev };
                        delete next[e.question_id];
                        return next;
                    });

                    // Inform the student
                    const message =
                        e.change_type === 'updated'
                            ? t('exam.take.questionUpdated', [
                                e.question_text || '',
                            ])
                            : t('exam.take.questionDeleted');

                    toast.warning(message, {
                        description: t('exam.take.answerResetDesc'),
                        duration: 8000,
                        icon: (
                            <AlertTriangleIcon className="size-5 text-amber-500" />
                        ),
                    });
                } else if (e.change_type === 'created') {
                    toast.info(t('exam.take.newQuestionAdded'), {
                        description: t('exam.take.newQuestionAddedDesc'),
                        duration: 5000,
                    });
                }
            },
        });
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
        if (!examStarted || isLocked || isFullscreen === false || isPaused)
            return;

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
                const response = await fetch(
                    `/exam/attempt/${attempt.id}/answer`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'X-XSRF-TOKEN': decodeURIComponent(
                                document.cookie.match(
                                    new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'),
                                )?.[2] || '',
                            ),
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        body: JSON.stringify({
                            question_id: questionId,
                            ...data,
                        }),
                    },
                );

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
        isImmediate: boolean = false,
    ) => {
        setAnswers((prev) => ({ ...prev, [questionId]: data }));

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        if (isImmediate) {
            saveAnswer(questionId, data);
        } else {
            saveTimeoutRef.current = setTimeout(() => {
                saveAnswer(questionId, data);
            }, 1000);
        }
    };

    const handleSingleChoice = (optionId: number) => {
        handleAnswerChange(
            currentQuestion.id,
            {
                selected_options: [optionId],
            },
            true,
        );
    };

    const handleMultipleChoice = (optionId: number, checked: boolean) => {
        const current = answers[currentQuestion.id]?.selected_options || [];
        const updated = checked
            ? [...current, optionId]
            : current.filter((id) => id !== optionId);
        handleAnswerChange(
            currentQuestion.id,
            { selected_options: updated },
            true,
        );
    };

    const handleTrueFalse = (value: string) => {
        handleAnswerChange(currentQuestion.id, { text_answer: value }, true);
    };

    const handleTextAnswer = (text: string) => {
        handleAnswerChange(currentQuestion.id, { text_answer: text }, false);
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

    // --- PRIORITY SCREEN LOGIC ---
    // This ensures only ONE major panel is shown at a time, based on importance.
    // --- PRIORITY SCREEN LOGIC (NESTED HIERARCHY) ---
    if (isKicked) {
        return (
            <>
                <Head title="Submitting Exam..." />
                <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-background p-6 text-center text-foreground">
                    <Loader2Icon className="mb-6 size-16 animate-spin text-primary" />
                    <h1 className="mb-2 text-3xl font-black italic uppercase">
                        {t('exam.take.submitting')}...
                    </h1>
                    <p className="font-medium text-muted-foreground">
                        {t('exam.take.submitting.desc')}
                    </p>
                </div>
            </>
        );
    } else if (!examStarted) {
        return (
            <>
                <Head title={`${t('exam.take.start')}: ${exam.title}`} />
                <div className="flex min-h-screen items-center justify-center bg-background p-6">
                    <Card className="w-full max-w-lg border-t-4 border-t-primary shadow-xl">
                        <CardHeader className="pt-8 text-center">
                            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
                                <FileTextIcon className="size-8 text-primary" />
                            </div>
                            <CardTitle className="text-2xl font-black tracking-tight text-foreground">
                                {exam.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8 pb-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b pb-2 font-bold text-foreground">
                                    <ClipboardCheckIcon className="size-5 text-primary" />
                                    {t('exam.take.beforeYouBegin')}
                                </div>
                                <ul className="space-y-4">
                                    {[1, 2, 3, 4].map((num) => (
                                        <li
                                            key={num}
                                            className="flex gap-3 text-sm text-muted-foreground"
                                        >
                                            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                                                {num}
                                            </div>
                                            {(t as any)(`exam.take.rule${num}`)}
                                        </li>
                                    ))}
                                    <li className="flex gap-3 border-t pt-4 text-sm font-bold text-muted-foreground">
                                        <ClockIcon className="size-5 shrink-0 text-primary" />
                                        <span>
                                            {t('exam.take.rule5')}{' '}
                                            {Math.floor(
                                                attempt.remaining_time / 60,
                                            )}{' '}
                                            {t('exam.minutes')}
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="button"
                                    onClick={handleStartExam}
                                    className="h-14 w-full text-lg font-bold shadow-lg"
                                    size="lg"
                                >
                                    <MaximizeIcon className="mr-2 size-6" />
                                    {t('exam.take.start').toUpperCase()}
                                </Button>
                                <p className="mt-4 text-center text-[11px] font-black tracking-widest text-slate-400 uppercase">
                                    {t('exam.take.enteringMode')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    } else if (isPaused) {
        return (
            <>
                <Head title="Exam Paused" />
                <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/95 p-6 text-center text-foreground backdrop-blur-sm">
                    <div className="mb-8 rounded-full bg-amber-500/20 p-6 ring-1 ring-amber-500/50">
                        <PauseIcon className="size-16 animate-pulse text-amber-500" />
                    </div>
                    <h2 className="mb-4 text-4xl font-black tracking-tight uppercase italic">
                        {t('exam.take.paused.title')}
                    </h2>
                    <p className="mb-8 max-w-lg text-xl leading-relaxed font-medium text-muted-foreground">
                        {t('exam.take.paused.desc')}
                    </p>
                    <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/20 px-6 py-3 text-sm font-black tracking-widest text-muted-foreground uppercase italic">
                        <div className="size-2 animate-ping rounded-full bg-emerald-500" />
                        {t('exam.take.paused.awaiting')}
                    </div>
                </div>
            </>
        );
    } else if (
        !isPaused &&
        (isLocked ||
            (!isFullscreen &&
                !new URLSearchParams(window.location.search).has(
                    'no_security',
                )))
    ) {
        console.log(isPaused)
        return (
            <>
                <Head title={t('exam.take.fullscreenRequired')} />
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-6 backdrop-blur-sm">
                    <Card className="w-full max-w-sm border-2 border-destructive/50 shadow-2xl">
                        <CardContent className="flex flex-col items-center space-y-6 py-10 text-center">
                            {reloadCountdown !== null ? (
                                <div className="text-destructive">
                                    <p className="mb-1 text-[10px] font-black tracking-[0.2em] uppercase opacity-70">
                                        {t('exam.take.securityImminent')}
                                    </p>
                                    <p className="text-7xl leading-none font-black">
                                        {reloadCountdown}
                                    </p>
                                </div>
                            ) : (
                                <MaximizeIcon className="size-16 animate-pulse text-destructive" />
                            )}

                            <div className="space-y-2">
                                <h2 className="text-xl font-bold tracking-tight">
                                    {isLocked
                                        ? t('exam.take.locked').toUpperCase()
                                        : t(
                                              'exam.take.fullscreenRequired',
                                          ).toUpperCase()}
                                </h2>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {isLocked
                                        ? lockReason
                                        : t('exam.take.fullscreenDesc')}
                                </p>
                            </div>

                            <Button
                                onClick={
                                    isLocked ? returnToExam : enterFullscreen
                                }
                                className="h-14 w-full text-lg font-black uppercase shadow-lg"
                                variant="destructive"
                                size="lg"
                            >
                                <MaximizeIcon className="mr-2 size-5" />
                                {isLocked
                                    ? t('exam.take.return')
                                    : t('exam.take.enterFullscreen')}
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
                {/* Header */}
                <header className="sticky top-0 z-40 border-b bg-background/80 px-4 py-2 backdrop-blur-md sm:py-3">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                            <h1 className="truncate text-sm font-bold sm:text-base">
                                {exam.title}
                            </h1>

                            <div className="ml-1 hidden items-center gap-3 border-l border-border/50 pl-3 sm:flex">
                                <div className="flex shrink-0 items-center gap-1.5">
                                    <div
                                        className={cn(
                                            'size-2 rounded-full',
                                            connectionStatus === 'stable'
                                                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                                : connectionStatus ===
                                                    'unstable'
                                                    ? 'animate-pulse bg-amber-500'
                                                    : 'animate-ping bg-rose-500',
                                        )}
                                    />
                                    <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase italic">
                                        {connectionStatus === 'stable'
                                            ? t('exam.take.status.live')
                                            : connectionStatus === 'unstable'
                                                ? t(
                                                    'exam.take.status.reconnecting',
                                                )
                                                : t('exam.take.status.offline')}
                                    </span>
                                </div>

                                {saving && (
                                    <div className="flex animate-pulse items-center gap-1.5 text-blue-500">
                                        <SaveIcon className="size-3.5" />
                                        <span className="text-[10px] font-black tracking-widest uppercase italic">
                                            {t('exam.take.saving')}
                                        </span>
                                    </div>
                                )}
                                {saveError && (
                                    <div className="flex items-center gap-1.5 text-rose-500">
                                        <AlertTriangleIcon className="size-3.5" />
                                        <span className="text-[10px] font-black tracking-widest uppercase italic">
                                            {t('exam.take.errorSaving')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                            {violationCount > 0 && (
                                <Badge
                                    variant="destructive"
                                    className="h-7 px-2 text-[10px] font-black tracking-wider uppercase"
                                >
                                    <ShieldAlertIcon className="mr-1 size-3" />
                                    <span className="xs:inline hidden">
                                        {violationCount} {t('exam.violations')}
                                    </span>
                                    <span className="xs:hidden">
                                        {violationCount}
                                    </span>
                                </Badge>
                            )}

                            <div
                                className={cn(
                                    'flex items-center gap-2 rounded-[0.6rem] px-3 py-1.5 text-sm font-black transition-colors',
                                    isLowTime
                                        ? 'animate-pulse bg-destructive/10 text-destructive ring-2 ring-destructive/20'
                                        : 'border border-border bg-muted text-foreground',
                                )}
                            >
                                <ClockIcon className="size-4" />
                                {formatTime(timeRemaining)}
                            </div>

                            <Button
                                data-test="header-submit-button"
                                size="sm"
                                onClick={handleSubmit}
                                className="hidden h-9 rounded-xl bg-primary text-[10px] font-black tracking-widest uppercase shadow-md shadow-primary/20 hover:bg-primary/90 sm:flex"
                            >
                                <SendIcon className="size-3.5" />
                                {t('exam.take.submit')}
                            </Button>
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 h-[2px] w-full overflow-hidden bg-muted">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{
                                width: `${(answeredCount / questions.length) * 100}%`,
                            }}
                        />
                    </div>
                </header>

                <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col pb-24 md:flex-row md:pb-0">
                    {/* Question Navigation Sidebar */}
                    <aside className="w-full border-b bg-muted/20 p-4 md:w-64 md:border-r md:border-b-0">
                        <div className="sticky top-20">
                            <div className="mb-4">
                                <p className="text-sm text-muted-foreground">
                                    {t('exam.take.answered')}: {answeredCount}/
                                    {questions.length}
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

                            <div className="mt-4 hidden space-y-2 border-t pt-4 text-[10px] font-black tracking-widest text-muted-foreground uppercase md:block">
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
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className="border-border bg-muted text-[10px] font-bold tracking-tight text-muted-foreground uppercase"
                                            >
                                                {t('exam.take.question')}{' '}
                                                {currentIndex + 1}{' '}
                                                {t('exam.of')}{' '}
                                                {questions.length}
                                            </Badge>
                                            <Badge
                                                variant="secondary"
                                                className="border-none bg-primary/10 px-2 text-[10px] font-bold text-primary shadow-sm hover:bg-primary/20"
                                            >
                                                {currentQuestion.points}{' '}
                                                {t('exam.points')}
                                            </Badge>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                toggleFlag(currentQuestion.id)
                                            }
                                            className={cn(
                                                'h-8 rounded-lg text-xs font-bold',
                                                flagged.has(currentQuestion.id)
                                                    ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 hover:text-amber-700'
                                                    : 'text-muted-foreground hover:bg-muted',
                                            )}
                                        >
                                            <FlagIcon
                                                className={cn(
                                                    'mr-1.5 size-3.5',
                                                    flagged.has(
                                                        currentQuestion.id,
                                                    ) && 'fill-amber-500',
                                                )}
                                            />
                                            {flagged.has(currentQuestion.id)
                                                ? t('exam.take.unflag')
                                                : t('exam.take.flag')}
                                        </Button>
                                    </div>
                                    <CardTitle className="text-lg break-words whitespace-pre-wrap">
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
                                                            onClick={() =>
                                                                handleSingleChoice(
                                                                    option.id,
                                                                )
                                                            }
                                                            className={cn(
                                                                'flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all duration-200 min-w-0',
                                                                currentAnswer?.selected_options?.includes(
                                                                    option.id,
                                                                )
                                                                    ? 'border-primary bg-primary/5 shadow-sm'
                                                                    : 'border-border bg-card hover:border-primary/30 hover:bg-muted/20',
                                                            )}
                                                        >
                                                            <div
                                                                className={cn(
                                                                    'flex size-5 shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors',
                                                                    currentAnswer?.selected_options?.includes(
                                                                        option.id,
                                                                    )
                                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                                        : 'border-border bg-card',
                                                                )}
                                                            >
                                                                {currentAnswer?.selected_options?.includes(
                                                                    option.id,
                                                                ) && (
                                                                        <div className="size-2 rounded-full bg-primary-foreground shadow-sm" />
                                                                    )}
                                                            </div>
                                                            <span
                                                                className={cn(
                                                                    'text-sm font-bold transition-colors break-words whitespace-pre-wrap flex-1 min-w-0',
                                                                    currentAnswer?.selected_options?.includes(
                                                                        option.id,
                                                                    )
                                                                        ? 'text-primary'
                                                                        : 'text-foreground',
                                                                )}
                                                            >
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
                                                <p className="mb-2 text-sm font-semibold text-muted-foreground">
                                                    {t('exam.take.selectMultiple')}
                                                </p>
                                                {currentQuestion.options.map(
                                                    (option) => (
                                                        <div
                                                            key={option.id}
                                                            onClick={() =>
                                                                handleMultipleChoice(
                                                                    option.id,
                                                                    !currentAnswer?.selected_options?.includes(
                                                                        option.id,
                                                                    ),
                                                                )
                                                            }
                                                            className={cn(
                                                                'flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all duration-200 min-w-0',
                                                                currentAnswer?.selected_options?.includes(
                                                                    option.id,
                                                                )
                                                                    ? 'border-primary bg-primary/5 shadow-sm'
                                                                    : 'border-border bg-card hover:border-primary/30 hover:bg-muted/20',
                                                            )}
                                                        >
                                                            <div
                                                                className={cn(
                                                                    'flex size-5 shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors',
                                                                    currentAnswer?.selected_options?.includes(
                                                                        option.id,
                                                                    )
                                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                                        : 'border-border bg-card',
                                                                )}
                                                            >
                                                                {currentAnswer?.selected_options?.includes(
                                                                    option.id,
                                                                ) && (
                                                                        <svg
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            viewBox="0 0 24 24"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            strokeWidth="4"
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            className="size-3"
                                                                        >
                                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                                        </svg>
                                                                    )}
                                                            </div>
                                                            <span
                                                                className={cn(
                                                                    'text-sm font-bold transition-colors break-words whitespace-pre-wrap flex-1 min-w-0',
                                                                    currentAnswer?.selected_options?.includes(
                                                                        option.id,
                                                                    )
                                                                        ? 'text-primary'
                                                                        : 'text-foreground',
                                                                )}
                                                            >
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
                                                        {t(
                                                            `exams.questions.${value}` as any,
                                                        )}
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
                                            placeholder={t(
                                                'exam.take.shortTextPlaceholder',
                                            )}
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
                                            placeholder={t(
                                                'exam.take.essayPlaceholder',
                                            )}
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
                                className="h-11 rounded-xl border-2 border-border px-6 font-bold hover:bg-muted"
                                onClick={() =>
                                    setCurrentIndex(
                                        Math.max(0, currentIndex - 1),
                                    )
                                }
                                disabled={currentIndex === 0}
                            >
                                <ChevronLeftIcon className="mr-2 size-4" />
                                {t('exam.take.previous')}
                            </Button>

                            {currentIndex < questions.length - 1 ? (
                                <Button
                                    className="h-11 rounded-xl bg-primary px-8 font-bold shadow-md shadow-primary/20 hover:bg-primary/90"
                                    onClick={() =>
                                        setCurrentIndex(currentIndex + 1)
                                    }
                                >
                                    {t('exam.take.next')}
                                    <ChevronRightIcon className="ml-2 size-4" />
                                </Button>
                            ) : (
                                <Button
                                    className="h-11 rounded-xl bg-emerald-600 px-8 font-bold shadow-md shadow-emerald-600/20 hover:bg-emerald-500"
                                    onClick={handleSubmit}
                                >
                                    <SendIcon className="mr-2 size-4" />
                                    {t('exam.take.submit')}
                                </Button>
                            )}
                        </div>
                    </main>
                </div>

                {/* Sticky Bottom Navigation (Mobile Only) */}
                <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-border bg-card/95 p-4 pb-6 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md md:hidden">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="flex size-12 items-center justify-center rounded-2xl border-2 border-border p-0"
                            onClick={() =>
                                setCurrentIndex(Math.max(0, currentIndex - 1))
                            }
                            disabled={currentIndex === 0}
                        >
                            <ChevronLeftIcon className="size-6 text-muted-foreground" />
                        </Button>

                        <div className="-mt-1 flex flex-1 flex-col items-center justify-center">
                            <div className="mb-1 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                {t('exam.take.questionStatus', [
                                    currentIndex + 1,
                                    questions.length,
                                ])}
                            </div>
                            <div className="flex h-1.5 w-full max-w-[100px] items-center gap-1.5 overflow-hidden rounded-full bg-muted">
                                {questions.map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            'h-full flex-1 transition-all',
                                            i === currentIndex
                                                ? 'bg-primary'
                                                : answers[questions[i].id]
                                                    ? 'bg-emerald-500'
                                                    : 'bg-muted-foreground/30',
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        {currentIndex < questions.length - 1 ? (
                            <Button
                                className="h-12 flex-1 rounded-2xl border-none bg-foreground text-[11px] font-black tracking-widest text-background uppercase shadow-lg shadow-foreground/10"
                                onClick={() =>
                                    setCurrentIndex(currentIndex + 1)
                                }
                            >
                                {t('exam.take.next')}
                                <ChevronRightIcon className="ml-2 size-4" />
                            </Button>
                        ) : (
                            <Button
                                className="h-12 flex-1 rounded-2xl border-none bg-emerald-600 text-[11px] font-black tracking-widest uppercase shadow-lg shadow-emerald-600/10"
                                onClick={handleSubmit}
                            >
                                <SendIcon className="mr-2 size-4" />
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
                            {t('exam.take.confirmStats', [
                                answeredCount,
                                questions.length,
                            ])}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancelSubmit}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            data-test="confirm-submit-button"
                            onClick={handleConfirmSubmit}
                        >
                            {t('exam.take.submit')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
