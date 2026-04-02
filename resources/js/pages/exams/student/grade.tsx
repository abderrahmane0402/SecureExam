import { Head, Link } from '@inertiajs/react';
import {
    ShieldAlertIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    XCircleIcon,
    AlertCircleIcon,
    LayoutDashboardIcon,
    EyeOffIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

interface Question {
    id: number;
    type: string;
    content: string;
    points: number;
    correct_answer?: string;
    options?: {
        id: number;
        content: string;
        is_correct: boolean;
    }[];
    answer?: {
        text_answer: string | null;
        selected_options: number[] | null;
        points_earned: number;
        is_correct: boolean | null;
        instructor_feedback: string | null;
    };
}

interface Props {
    exam: {
        id: number;
        title: string;
        total_points: number;
        passing_score: number;
        show_results: boolean;
        questions?: Question[];
    };
    attempt: {
        id: number;
        score: number;
        percentage: number;
        violation_count: number;
        penalty_points: number | null;
        penalty_reason: string | null;
        submitted_at: string;
        published_at: string;
    };
}

export default function GradeDetail({ exam, attempt }: Props) {
    const { t } = useLanguage();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('common.dashboard'), href: '/dashboard' },
        { title: t('student.exams.title'), href: '/student/exams' },
        { title: t('student.results.title'), href: '/student/results' },
        {
            title: exam.title,
            href: `/student/exams/${exam.id}/attempts/${attempt.id}`,
        },
    ];

    const passed = attempt.percentage >= (exam.passing_score ?? 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('student.grade.title')}: ${exam.title}`} />

            <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-4 pb-24 sm:p-6">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="shrink-0 rounded-full"
                        >
                            <Link href="/student/results">
                                <ArrowLeftIcon className="size-5" />
                            </Link>
                        </Button>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-black tracking-tight break-words text-slate-900 uppercase sm:text-3xl dark:text-foreground">
                                {exam.title}
                            </h1>
                            <p className="mt-1 text-xs font-black tracking-[0.2em] text-muted-foreground uppercase">
                                {t('student.results.published')}{' '}
                                {new Date(
                                    attempt.published_at,
                                ).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Performance Overview */}
                <div className="grid w-full gap-6 md:grid-cols-3">
                    <Card
                        className={cn(
                            'min-w-0 overflow-hidden border-2 md:col-span-2 pt-0',
                            passed
                                ? 'border-emerald-500/20 shadow-lg shadow-emerald-500/5'
                                : 'border-rose-500/20 shadow-lg shadow-rose-500/5',
                        )}
                    >
                        <CardHeader
                            className={cn(
                                'border-b p-4',
                                passed
                                    ? 'bg-emerald-500/[0.03]'
                                    : 'bg-rose-500/[0.03]',
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs font-black tracking-widest text-muted-foreground uppercase">
                                    {t('student.grade.summary')}
                                </CardTitle>
                                <Badge
                                    className={cn(
                                        'h-5 px-3 text-[10px] font-black tracking-widest uppercase break-all',
                                        passed
                                            ? 'bg-emerald-500 hover:bg-emerald-600'
                                            : 'bg-rose-500 hover:bg-rose-600',
                                    )}
                                >
                                    {passed
                                        ? t(
                                              'student.results.passed',
                                          ).toUpperCase()
                                        : t(
                                              'student.results.failed',
                                          ).toUpperCase()}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 sm:pt-8">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
                                <div className="space-y-1">
                                    <p className="text-sm font-black tracking-widest text-muted-foreground uppercase">
                                        {t('student.results.score')}
                                    </p>
                                    <div className="flex items-baseline gap-2">
                                        <p
                                            className={cn(
                                                'text-5xl font-black tracking-tighter sm:text-6xl',
                                                passed
                                                    ? 'text-emerald-600'
                                                    : 'text-rose-600',
                                            )}
                                        >
                                            {Math.round(attempt.percentage)}
                                            <span className="text-2xl opacity-50 sm:text-3xl">
                                                %
                                            </span>
                                        </p>
                                    </div>
                                    <p className="text-sm font-bold text-muted-foreground">
                                        {attempt.score} / {exam.total_points}{' '}
                                        {t('exam.points')}
                                    </p>
                                </div>
                                <div className="flex h-3 w-full items-end sm:max-w-[200px] sm:flex-1">
                                    <div className="h-3 w-full overflow-hidden rounded-2xl bg-muted">
                                        <div
                                            className={cn(
                                                'h-full transition-all duration-1000 ease-out',
                                                passed
                                                    ? 'bg-emerald-500'
                                                    : 'bg-rose-500',
                                            )}
                                            style={{
                                                width: `${attempt.percentage}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="min-w-0 space-y-4">
                        <Card className="border-none bg-slate-900 shadow-xl">
                            <CardContent className="p-6">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="rounded-xl bg-blue-500/20 p-2 text-blue-400">
                                        <ShieldAlertIcon className="size-5" />
                                    </div>
                                    <span className="text-[10px] font-black tracking-[0.2em] text-blue-200 uppercase">
                                        {t('student.grade.violations')}
                                    </span>
                                </div>
                                <p className="text-4xl font-black text-white">
                                    {attempt.violation_count}
                                </p>
                                <p className="mt-1 text-[10px] font-bold text-blue-300/60 uppercase">
                                    {t('student.grade.detectedBreaches')}
                                </p>
                            </CardContent>
                        </Card>

                        {attempt.penalty_points !== null && (
                            <Card className="border-none bg-rose-950 shadow-xl">
                                <CardContent className="p-6">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-xl bg-rose-500/20 p-2 text-rose-400">
                                                <AlertCircleIcon className="size-5" />
                                            </div>
                                            <span className="text-[10px] font-black tracking-[0.2em] text-rose-200 uppercase">
                                                {t('student.grade.penalty')}
                                            </span>
                                        </div>
                                        <Badge
                                            variant="destructive"
                                            className="bg-rose-500 text-[10px] font-black text-white uppercase break-all"
                                        >
                                            -{attempt.penalty_points} PTS
                                        </Badge>
                                    </div>
                                    <p className="line-clamp-2 text-[11px] font-bold text-rose-200/80 italic">
                                        "{attempt.penalty_reason}"
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Breakdown Section */}
                <div className="w-full min-w-0 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="flex items-center gap-3 text-xl font-black tracking-widest uppercase">
                            <LayoutDashboardIcon className="size-5 shrink-0 text-blue-500" />
                            {t('student.grade.breakdown')}
                        </h2>
                    </div>

                    {!exam.show_results ? (
                        <Card className="border-2 border-dashed bg-muted py-16 text-center dark:bg-card/50">
                            <CardContent>
                                <div className="mb-6 inline-flex rounded-full bg-accent p-4 dark:bg-accent">
                                    <EyeOffIcon className="size-8 text-muted-foreground" />
                                </div>
                                <h3 className="mb-2 text-lg font-black tracking-widest uppercase">
                                    {t('student.grade.solutionsPrivate')}
                                </h3>
                                <p className="mx-auto max-w-sm text-sm leading-relaxed font-medium text-muted-foreground">
                                    {t('student.grade.solutionsPrivateDesc')}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="w-full min-w-0 space-y-4">
                            {exam.questions?.map((q, idx) => {
                                const isCorrect = q.answer?.is_correct === true;
                                const isPartial =
                                    q.answer?.is_correct === null &&
                                    (q.answer?.points_earned || 0) > 0;
                                const isIncorrect =
                                    q.answer?.is_correct === false ||
                                    ((q.answer?.points_earned || 0) === 0 &&
                                        q.answer?.is_correct === null);

                                return (
                                    <Card
                                        key={q.id}
                                        className={cn(
                                            'w-full min-w-0 border-l-4 transition-all hover:bg-muted/50',
                                            isCorrect
                                                ? 'border-l-emerald-500'
                                                : isPartial
                                                  ? 'border-l-amber-500'
                                                  : 'border-l-rose-500',
                                        )}
                                    >
                                        <CardContent className="p-4 sm:p-6">
                                            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                                                <div className="flex min-w-0 flex-1 gap-3">
                                                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">
                                                        {idx + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="leading-snug font-bold break-all text-foreground">
                                                            {q.content}
                                                        </p>
                                                        <Badge
                                                            variant="outline"
                                                            className="mt-2 text-[8px] font-black tracking-tighter uppercase opacity-60 break-all"
                                                        >
                                                            {q.type.replace(
                                                                /_/g,
                                                                ' ',
                                                            )}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <p
                                                        className={cn(
                                                            'text-sm font-black',
                                                            isCorrect
                                                                ? 'text-emerald-600'
                                                                : isPartial
                                                                  ? 'text-amber-600'
                                                                  : 'text-rose-600',
                                                        )}
                                                    >
                                                        {q.answer
                                                            ?.points_earned ||
                                                            0}{' '}
                                                        / {q.points} PTS
                                                    </p>
                                                    <div className="mt-1 flex items-center justify-end gap-1">
                                                        {isCorrect && (
                                                            <CheckCircleIcon className="size-3 text-emerald-500" />
                                                        )}
                                                        {isPartial && (
                                                            <AlertCircleIcon className="size-3 text-amber-500" />
                                                        )}
                                                        {isIncorrect && (
                                                            <XCircleIcon className="size-3 text-rose-500" />
                                                        )}
                                                        <span className="text-[10px] font-black uppercase opacity-60">
                                                            {isCorrect
                                                                ? t(
                                                                      'student.grade.correct',
                                                                  )
                                                                : isPartial
                                                                  ? t(
                                                                        'student.grade.partial',
                                                                    )
                                                                  : t(
                                                                        'student.grade.incorrect',
                                                                    )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-full min-w-0 space-y-4 rounded-xl bg-muted p-4">
                                                {/* Student Answer */}
                                                <div>
                                                    <span className="mb-2 block text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                                        {t(
                                                            'student.grade.yourAnswer',
                                                        )}
                                                    </span>
                                                    <div className="text-sm font-medium">
                                                        {q.type ===
                                                            'multiple_choice_single' ||
                                                        q.type ===
                                                            'multiple_choice_multiple' ? (
                                                            <div className="flex min-w-0 flex-wrap gap-2">
                                                                {q.options
                                                                    ?.filter(
                                                                        (o) =>
                                                                            q.answer?.selected_options?.includes(
                                                                                o.id,
                                                                            ),
                                                                    )
                                                                    .map(
                                                                        (o) => (
                                                                            <Badge
                                                                                key={
                                                                                    o.id
                                                                                }
                                                                                variant="secondary"
                                                                                className="h-auto py-1 text-left font-bold break-all whitespace-normal"
                                                                            >
                                                                                {
                                                                                    o.content
                                                                                }
                                                                            </Badge>
                                                                        ),
                                                                    ) || (
                                                                    <span className="text-muted-foreground italic">
                                                                        {t(
                                                                            'student.grade.noSelection',
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p className="break-words whitespace-pre-wrap">
                                                                {q.answer
                                                                    ?.text_answer || (
                                                                    <span className="text-muted-foreground italic">
                                                                        {t(
                                                                            'student.grade.noResponse',
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Correct Answer / Comparison */}
                                                <div className="w-full min-w-0">
                                                    <span className="mb-2 block text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                                        {t(
                                                            'student.grade.correctAnswer',
                                                        )}
                                                    </span>
                                                    <div className="w-full text-sm font-bold text-emerald-600">
                                                        {q.type ===
                                                            'multiple_choice_single' ||
                                                        q.type ===
                                                            'multiple_choice_multiple' ? (
                                                            <div className="w-full min-w-0 gap-2 flex flex-wrap">
                                                                {q.options
                                                                    ?.filter(
                                                                        (o) =>
                                                                            o.is_correct,
                                                                    )
                                                                    .map(
                                                                        (o) => (
                                                                            <Badge
                                                                                key={
                                                                                    o.id
                                                                                }
                                                                                variant="outline"
                                                                                className="max-w-full min-w-0 border-emerald-200 bg-emerald-50 py-1 text-left font-bold break-all whitespace-normal text-emerald-700"
                                                                            >
                                                                                {
                                                                                    o.content
                                                                                }
                                                                            </Badge>
                                                                        ),
                                                                    )}
                                                            </div>
                                                        ) : (
                                                            <p className="wrap-break-words w-full whitespace-pre-wrap">
                                                                {q.correct_answer ||
                                                                    t(
                                                                        'student.grade.notProvided',
                                                                    )}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Instructor Feedback */}
                                                {q.answer
                                                    ?.instructor_feedback && (
                                                    <div className="border-t border-border pt-4">
                                                        <span className="mb-2 block text-[10px] font-black tracking-widest text-blue-500 uppercase">
                                                            {t(
                                                                'student.grade.feedback',
                                                            )}
                                                        </span>
                                                        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm leading-relaxed font-medium break-words text-blue-900 italic dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
                                                            "
                                                            {
                                                                q.answer
                                                                    .instructor_feedback
                                                            }
                                                            "
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
