import { Head, Link } from '@inertiajs/react';
import { 
    ShieldAlertIcon, 
    ArrowLeftIcon, 
    CheckCircleIcon,
    XCircleIcon,
    AlertCircleIcon,
    LayoutDashboardIcon,
    EyeOffIcon
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
        { title: exam.title, href: `/student/exams/${exam.id}/attempts/${attempt.id}` },
    ];

    const passed = attempt.percentage >= (exam.passing_score ?? 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('student.grade.title')}: ${exam.title}`} />
            
            <div className="flex flex-col gap-8 p-6 max-w-5xl mx-auto pb-24">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild className="rounded-full">
                            <Link href="/student/results">
                                <ArrowLeftIcon className="size-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-foreground uppercase">
                                {exam.title}
                            </h1>
                            <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">
                                {t('student.results.published')} {new Date(attempt.published_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Performance Overview */}
                <div className="grid gap-6 md:grid-cols-3">
                    <Card className={cn(
                        "md:col-span-2 overflow-hidden border-2",
                        passed ? "border-emerald-500/20 shadow-lg shadow-emerald-500/5" : "border-rose-500/20 shadow-lg shadow-rose-500/5"
                    )}>
                        <CardHeader className={cn(
                            "pb-4 border-b",
                            passed ? "bg-emerald-500/[0.03]" : "bg-rose-500/[0.03]"
                        )}>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                    {t('student.grade.summary')}
                                </CardTitle>
                                <Badge className={cn(
                                    "font-black uppercase text-[10px] px-3 h-5 tracking-widest",
                                    passed ? "bg-emerald-500 hover:bg-emerald-600" : "bg-rose-500 hover:bg-rose-600"
                                )}>
                                    {passed ? 'PASSED' : 'FAILED'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <div className="flex items-end justify-between gap-8">
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">{t('student.results.score')}</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className={cn("text-6xl font-black tracking-tighter", passed ? "text-emerald-600" : "text-rose-600")}>
                                            {Math.round(attempt.percentage)}<span className="text-3xl opacity-50">%</span>
                                        </p>
                                    </div>
                                    <p className="text-sm font-bold text-muted-foreground">
                                        {attempt.score} / {exam.total_points} {t('exam.points')}
                                    </p>
                                </div>
                                <div className="flex-1 max-w-[200px] h-32 flex items-end">
                                    <div className="w-full bg-muted rounded-2xl h-3 overflow-hidden">
                                        <div 
                                            className={cn("h-full transition-all duration-1000 ease-out", passed ? "bg-emerald-500" : "bg-rose-500")}
                                            style={{ width: `${attempt.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <Card className="bg-slate-900 border-none shadow-xl">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                                        <ShieldAlertIcon className="size-5" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">
                                        {t('student.grade.violations')}
                                    </span>
                                </div>
                                <p className="text-4xl font-black text-white">{attempt.violation_count}</p>
                                <p className="text-[10px] font-bold text-blue-300/60 uppercase mt-1">Detected breaches</p>
                            </CardContent>
                        </Card>

                        {attempt.penalty_points !== null && (
                            <Card className="bg-rose-950 border-none shadow-xl">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                                                <AlertCircleIcon className="size-5" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-200">
                                                Penalty
                                            </span>
                                        </div>
                                        <Badge variant="destructive" className="bg-rose-500 text-white font-black text-[10px] uppercase">
                                            -{attempt.penalty_points} PTS
                                        </Badge>
                                    </div>
                                    <p className="text-[11px] font-bold text-rose-200/80 italic line-clamp-2">
                                        "{attempt.penalty_reason}"
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Breakdown Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                            <LayoutDashboardIcon className="size-5 text-blue-500" />
                            {t('student.grade.breakdown')}
                        </h2>
                    </div>

                    {!exam.show_results ? (
                        <Card className="bg-muted dark:bg-card/50 border-dashed border-2 py-16 text-center">
                            <CardContent>
                                <div className="inline-flex p-4 rounded-full bg-accent dark:bg-accent mb-6">
                                    <EyeOffIcon className="size-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-black uppercase tracking-widest mb-2">
                                    {t('student.grade.solutionsPrivate')}
                                </h3>
                                <p className="text-sm text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">
                                    {t('student.grade.solutionsPrivateDesc')}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {exam.questions?.map((q, idx) => {
                                const isCorrect = q.answer?.is_correct === true;
                                const isPartial = q.answer?.is_correct === null && (q.answer?.points_earned || 0) > 0;
                                const isIncorrect = q.answer?.is_correct === false || ((q.answer?.points_earned || 0) === 0 && q.answer?.is_correct === null);

                                return (
                                    <Card key={q.id} className={cn(
                                        "overflow-hidden border-l-4 transition-all hover:bg-muted/50",
                                        isCorrect ? "border-l-emerald-500" : isPartial ? "border-l-amber-500" : "border-l-rose-500"
                                    )}>
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex gap-4">
                                                    <span className="flex size-7 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">
                                                        {idx + 1}
                                                    </span>
                                                    <div>
                                                        <p className="font-bold text-foreground leading-snug">
                                                            {q.content}
                                                        </p>
                                                        <Badge variant="outline" className="mt-2 text-[8px] font-black uppercase tracking-tighter opacity-60">
                                                            {q.type.replace(/_/g, ' ')}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="text-right whitespace-nowrap">
                                                    <p className={cn(
                                                        "text-sm font-black",
                                                        isCorrect ? "text-emerald-600" : isPartial ? "text-amber-600" : "text-rose-600"
                                                    )}>
                                                        {q.answer?.points_earned || 0} / {q.points} PTS
                                                    </p>
                                                    <div className="flex items-center gap-1 mt-1 justify-end">
                                                        {isCorrect && <CheckCircleIcon className="size-3 text-emerald-500" />}
                                                        {isPartial && <AlertCircleIcon className="size-3 text-amber-500" />}
                                                        {isIncorrect && <XCircleIcon className="size-3 text-rose-500" />}
                                                        <span className="text-[10px] font-black uppercase opacity-60">
                                                            {isCorrect ? t('student.grade.correct') : isPartial ? t('student.grade.partial') : t('student.grade.incorrect')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-muted dark:bg-background rounded-xl p-4 space-y-4">
                                                {/* Student Answer */}
                                                <div>
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2">{t('student.grade.yourAnswer')}</span>
                                                    <div className="text-sm font-medium">
                                                        {(q.type === 'multiple_choice_single' || q.type === 'multiple_choice_multiple') ? (
                                                            <div className="flex flex-wrap gap-2">
                                                                {q.options?.filter(o => q.answer?.selected_options?.includes(o.id)).map(o => (
                                                                    <Badge key={o.id} variant="secondary" className="font-bold">
                                                                        {o.content}
                                                                    </Badge>
                                                                )) || <span className="text-muted-foreground italic">No selection</span>}
                                                            </div>
                                                        ) : (
                                                            <p className="whitespace-pre-wrap">{q.answer?.text_answer || <span className="text-muted-foreground italic">No response provided</span>}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Correct Answer / Comparison */}
                                                <div>
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2">{t('student.grade.correctAnswer')}</span>
                                                    <div className="text-sm font-bold text-emerald-600">
                                                        {(q.type === 'multiple_choice_single' || q.type === 'multiple_choice_multiple') ? (
                                                            <div className="flex flex-wrap gap-2">
                                                                {q.options?.filter(o => o.is_correct).map(o => (
                                                                    <Badge key={o.id} variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 font-bold">
                                                                        {o.content}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p>{q.correct_answer || 'Reference not provided'}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Instructor Feedback */}
                                                {q.answer?.instructor_feedback && (
                                                    <div className="pt-4 border-t border-border">
                                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-2">{t('student.grade.feedback')}</span>
                                                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 italic text-sm font-medium text-blue-900 leading-relaxed">
                                                            "{q.answer.instructor_feedback}"
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
