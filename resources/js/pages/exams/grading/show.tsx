import { Head, router, Link } from '@inertiajs/react';
import {
    SaveIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ArrowLeftIcon,
    ClockIcon,
    ShieldAlertIcon,
    TrophyIcon,
    CheckIcon,
    XIcon,
    AlertCircleIcon,
    AlertTriangleIcon,
    BanIcon,
    CheckCircleIcon,
    EyeIcon,
    EyeOffIcon,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useLanguageStandalone } from '@/hooks/use-language';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as examsIndex, show as showExam } from '@/routes/exams';
import grading from '@/routes/grading';
import type {
    BreadcrumbItem,
    Exam,
    ExamAttempt,
    Question,
    ExamAnswer,
    User,
    ViolationLog,
} from '@/types';

interface QuestionWithAnswer extends Question {
    answer?: ExamAnswer;
}

interface AttemptWithDetails extends ExamAttempt {
    student: User;
    violation_logs: ViolationLog[];
    penalty_points?: number | null;
    penalty_reason?: string | null;
    is_published: boolean;
    published_at?: string | null;
}

interface Props {
    exam: Exam & { total_points: number };
    attempt: AttemptWithDetails;
    questions: QuestionWithAnswer[];
    previousAttemptId?: number;
    nextAttemptId?: number;
}

export default function GradeAttempt({
    exam,
    attempt,
    questions,
    previousAttemptId,
    nextAttemptId,
}: Props) {
    const { t } = useLanguageStandalone();
    const [savingQuestion, setSavingQuestion] = useState<number | null>(null);
    const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(
        questions.find(q => q.type === 'short_text' || q.type === 'essay')?.id || questions[0]?.id || null
    );
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const [isViolationSheetOpen, setIsViolationSheetOpen] = useState(false);

    const activeQuestionIndex = useMemo(() => questions.findIndex(q => q.id === selectedQuestionId), [questions, selectedQuestionId]);
    const activeQuestion = questions[activeQuestionIndex];

    const handleNextQuestion = () => {
        if (activeQuestionIndex > -1 && activeQuestionIndex < questions.length - 1) {
            const nextId = questions[activeQuestionIndex + 1].id;
            setSelectedQuestionId(nextId);
            document.getElementById(`q-${nextId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handlePrevQuestion = () => {
        if (activeQuestionIndex > 0) {
            const prevId = questions[activeQuestionIndex - 1].id;
            setSelectedQuestionId(prevId);
            document.getElementById(`q-${prevId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    // Live score calculated from current props
    const liveScore = useMemo(() => {
        return questions.reduce((sum, q) => 
            sum + (q.answer?.points_earned !== undefined ? Number(q.answer.points_earned) : 0), 
        0);
    }, [questions]);

    // Live penalty-adjusted score
    const previewScore = useMemo(() => {
        let score = liveScore;
        if (attempt.penalty_points) {
            score = Math.max(0, score - Number(attempt.penalty_points));
        }
        return score;
    }, [liveScore, attempt.penalty_points]);

    const previewPercentage = useMemo(() => {
        return (previewScore / (exam.total_points || 1)) * 100;
    }, [previewScore, exam.total_points]);

    // Penalty Dialog State
    const [isPenaltyDialogOpen, setIsPenaltyDialogOpen] = useState(false);
    const [penaltyMode, setPenaltyMode] = useState<'none' | 'penalty' | 'zero'>(
        attempt.penalty_points == exam.total_points ? 'zero' :
        attempt.penalty_points ? 'penalty' : 'none'
    );
    const [penaltyPoints, setPenaltyPoints] = useState<string>(
        attempt.penalty_points && attempt.penalty_points != exam.total_points 
            ? attempt.penalty_points.toString() 
            : '5'
    );
    const [penaltyReason, setPenaltyReason] = useState<string>(attempt.penalty_reason || '');
    const [isApplyingPenalty, setIsApplyingPenalty] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);

    const handleApplyPenalty = () => {
        setIsApplyingPenalty(true);
        router.post(grading.penalty(attempt.id).url, {
            mode: penaltyMode,
            penalty_points: penaltyMode === 'penalty' ? parseFloat(penaltyPoints) : undefined,
            reason: penaltyMode === 'none' ? undefined : penaltyReason,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsPenaltyDialogOpen(false);
                router.reload();
            },
            onFinish: () => {
                setIsApplyingPenalty(false);
            }
        });
    };

    const handleGradeAnswer = async (
        answerId: number,
        points: number,
        feedback: string,
    ) => {
        setSavingQuestion(answerId);
        try {
            const response = await fetch(grading.answer(attempt.id).url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'))?.[2] || ''),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    answer_id: answerId,
                    points_earned: points,
                    feedback: feedback,
                }),
            });
            
            if (response.ok) {
                router.reload({ only: ['questions', 'attempt'] });
            }
        } finally {
            setSavingQuestion(null);
        }
    };

    // Summary of manual review progress
    const manualQuestions = questions.filter(q => q.type === 'short_text' || q.type === 'essay');
    const needsManualGradingCount = manualQuestions.filter(q => q.answer && q.answer.points_earned === null).length;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('common.dashboard'), href: dashboard().url },
        { title: t('exams.title'), href: examsIndex().url },
        { title: exam.title, href: showExam(exam.id).url },
        { title: t('grading.title'), href: grading.index(exam.id).url },
        {
            title: attempt.student.name,
            href: grading.show(attempt.id).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('grading.review.title')}: ${attempt.student.name}`} />
            
            <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-background">
                {/* Sticky Top Nav Bar */}
                <div className="sticky top-0 z-40 w-full bg-white/90 dark:bg-background/90 backdrop-blur-md border-b border-slate-200 dark:border-border shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 md:px-8 py-3 md:py-4">
                        <div className="flex items-center gap-3 min-w-0">
                        <Button variant="ghost" size="icon" asChild className="rounded-2xl hover:bg-slate-100 dark:hover:bg-accent border dark:border-border transition-all shrink-0">
                            <Link href={grading.index(exam.id).url}>
                                <ArrowLeftIcon className="size-5 text-slate-900 dark:text-foreground" />
                            </Link>
                        </Button>
                        <div className="min-w-0">
                            <h1 className="text-base md:text-xl font-black tracking-tight text-slate-900 dark:text-foreground leading-none mb-0.5 truncate">
                                {attempt.student.name}
                            </h1>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1.5 truncate">
                                <span className="truncate hidden sm:inline">{exam.title} <span className="opacity-30">•</span></span> {t('exams.attempts')} #{attempt.attempt_number}
                            </p>
                        </div>
                        <Badge className={cn(
                            "shrink-0 uppercase text-[10px] font-black h-5 px-1.5 sm:px-2 border-none shadow-sm",
                            attempt.status === 'graded' ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 hover:bg-amber-600"
                        )}>
                            {attempt.status === 'graded' ? <CheckCircleIcon className="size-3 sm:mr-1" /> : <ClockIcon className="size-3 sm:mr-1" />}
                            <span className="hidden sm:inline">{t(`status.${attempt.status}` as any)}</span>
                        </Badge>

                        {attempt.is_published && (
                            <Badge className="shrink-0 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase text-[10px] font-black tracking-wider px-1.5 sm:px-2 h-5">
                                <EyeIcon className="size-3 sm:mr-1" />
                                <span className="hidden sm:inline">{t('exams.status.published')}</span>
                            </Badge>
                        )}
                        
                        {attempt.penalty_points && (
                            <Badge variant="destructive" className="shrink-0 bg-rose-600 uppercase text-[10px] font-black border-none animate-pulse shadow-rose-200 shadow-lg px-1.5 sm:px-2 h-5">
                                <BanIcon className="size-3 sm:mr-1" />
                                <span className="hidden sm:inline">-{attempt.penalty_points} {t('grading.table.pts')}</span>
                                <span className="sm:hidden">-{attempt.penalty_points}</span>
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-2 sm:gap-3 flex-wrap">
                        {/* Penalty Dialog */}
                        <Dialog open={isPenaltyDialogOpen} onOpenChange={setIsPenaltyDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="h-10 rounded-xl text-rose-600 border-rose-200 dark:border-border/50 hover:bg-rose-50 dark:hover:bg-destructive/10 font-black uppercase tracking-widest text-[10px] transition-all px-3 sm:px-4">
                                    <BanIcon className="size-4 sm:mr-2" />
                                    <span className="hidden sm:inline">
                                        {attempt.penalty_points ? t('common.edit') : t('grading.review.penalty.apply')}
                                    </span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] rounded-3xl border-slate-200 dark:border-border bg-white dark:bg-background shadow-2xl">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-3 text-rose-600 dark:text-destructive text-xl font-black uppercase italic">
                                        <BanIcon className="size-6" />
                                        {t('grading.review.penalty.apply')}
                                    </DialogTitle>
                                    <DialogDescription className="font-bold">
                                        {t('grading.review.penalty.evaluate')}
                                    </DialogDescription>
                                </DialogHeader>
                                
                                <div className="grid gap-6 py-4">
                                    <div className="space-y-3">
                                        <div 
                                            role="button"
                                            onClick={() => setPenaltyMode('none')}
                                            className={cn(
                                                "flex items-center space-x-3 rounded-2xl border-2 p-4 cursor-pointer transition-all",
                                                penaltyMode === 'none' ? "border-blue-500 bg-blue-50/50 ring-4 ring-blue-50" : "hover:bg-slate-50 border-slate-100"
                                            )}
                                        >
                                            <div className={cn("size-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0", penaltyMode === 'none' && "border-blue-600")}>
                                                {penaltyMode === 'none' && <div className="size-2.5 rounded-full bg-blue-600" />}
                                            </div>
                                            <Label className="flex-1 cursor-pointer font-black text-sm">{t('grading.review.penalty.none')}</Label>
                                        </div>

                                        <div 
                                            role="button"
                                            onClick={() => setPenaltyMode('penalty')}
                                            className={cn(
                                                "flex items-start space-x-3 rounded-2xl border-2 p-4 cursor-pointer transition-all",
                                                penaltyMode === 'penalty' ? "border-amber-500 bg-amber-50/50 ring-4 ring-amber-50" : "hover:bg-slate-50 border-slate-100"
                                            )}
                                        >
                                            <div className={cn("size-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0 mt-0.5", penaltyMode === 'penalty' && "border-amber-600")}>
                                                {penaltyMode === 'penalty' && <div className="size-2.5 rounded-full bg-amber-600" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <Label className="cursor-pointer font-black text-sm block mb-2">{t('grading.review.penalty.manual')}</Label>
                                                {penaltyMode === 'penalty' && (
                                                    <div className="flex items-center gap-3 animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
                                                        <Input 
                                                            type="number" 
                                                            value={penaltyPoints} 
                                                            onChange={e => setPenaltyPoints(e.target.value)} 
                                                            min={0.5} max={exam.total_points}
                                                            step={0.5}
                                                            className="w-20 font-black h-10 rounded-xl bg-white focus-visible:ring-amber-500"
                                                        />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('exams.points')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div 
                                            role="button"
                                            onClick={() => setPenaltyMode('zero')}
                                            className={cn(
                                                "flex items-center space-x-3 rounded-2xl border-2 p-4 cursor-pointer transition-all",
                                                penaltyMode === 'zero' ? "border-rose-500 bg-rose-500/10 ring-4 ring-rose-500/20" : "border-rose-100 dark:border-destructive/30 hover:bg-rose-50 dark:hover:bg-destructive/10"
                                            )}
                                        >
                                            <div className={cn("size-5 rounded-full border-2 border-slate-300 dark:border-border flex items-center justify-center shrink-0", penaltyMode === 'zero' && "border-rose-600")}>
                                                {penaltyMode === 'zero' && <div className="size-2.5 rounded-full bg-rose-600" />}
                                            </div>
                                            <Label className="flex-1 cursor-pointer font-black text-sm text-rose-700 dark:text-foreground">{t('grading.review.penalty.zero')}</Label>
                                        </div>
                                    </div>

                                    {penaltyMode !== 'none' && (
                                        <div className="space-y-4 animate-in slide-in-from-top-2">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('grading.review.penalty.reason')}</Label>
                                                <Textarea 
                                                    value={penaltyReason} 
                                                    onChange={e => setPenaltyReason(e.target.value)}
                                                    placeholder={t('grading.review.penalty.placeholder')}
                                                    className="resize-none font-bold text-sm h-24 border-2 rounded-2xl focus-visible:ring-rose-500 focus-visible:border-rose-500"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <DialogFooter className="gap-2 sm:gap-0">
                                    <Button variant="ghost" onClick={() => setIsPenaltyDialogOpen(false)} className="rounded-xl font-bold">{t('common.cancel')}</Button>
                                    <Button 
                                        className="bg-rose-600 hover:bg-rose-700 rounded-xl font-black uppercase tracking-widest text-xs px-6 h-11 shadow-lg shadow-rose-200"
                                        onClick={handleApplyPenalty}
                                        disabled={isApplyingPenalty || (penaltyMode !== 'none' && !penaltyReason.trim())}
                                    >
                                        {isApplyingPenalty ? t('common.loading') : t('common.save')}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {attempt.status === 'graded' && (
                            <Button
                                variant="outline"
                                className={cn(
                                    "h-10 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all px-3 sm:px-4",
                                    attempt.is_published ? "text-rose-600 border-rose-200 hover:bg-rose-100" : "text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                                )}
                                onClick={() => router.post(grading.publish(attempt.id).url)}
                            >
                                {attempt.is_published ? <EyeOffIcon className="size-4 sm:mr-2" /> : <EyeIcon className="size-4 sm:mr-2" />}
                                <span className="hidden sm:inline">
                                    {attempt.is_published ? t('grading.action.unpublish') : t('grading.action.publish')}
                                </span>
                            </Button>
                        )}
                        
                        <div className="flex items-center border dark:border-border rounded-xl overflow-hidden bg-slate-100/50 dark:bg-muted/50 p-1">
                            {previousAttemptId ? (
                                <Link 
                                    href={grading.show(previousAttemptId).url}
                                    className="p-2 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-accent hover:shadow-sm transition-all text-slate-900 dark:text-foreground"
                                    title={t('grading.review.navigate.prev')}
                                >
                                    <ChevronLeftIcon className="size-4" />
                                </Link>
                            ) : (
                                <div className="p-2 h-8 w-8 flex items-center justify-center opacity-20 cursor-not-allowed">
                                    <ChevronLeftIcon className="size-4" />
                                </div>
                            )}
                            
                            {nextAttemptId ? (
                                <Link 
                                    href={grading.show(nextAttemptId).url}
                                    className="p-2 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-accent hover:shadow-sm transition-all text-slate-900 dark:text-foreground"
                                    title={t('grading.review.navigate.next')}
                                >
                                    <ChevronRightIcon className="size-4" />
                                </Link>
                            ) : (
                                <div className="p-2 h-8 w-8 flex items-center justify-center opacity-20 cursor-not-allowed">
                                    <ChevronRightIcon className="size-4" />
                                </div>
                            )}
                        </div>

                        <Button
                            asChild
                            disabled={needsManualGradingCount > 0}
                            className={cn(
                                "h-10 px-4 sm:h-11 sm:px-6 rounded-2xl font-black uppercase tracking-[0.1em] text-[10px] sm:text-xs shadow-xl transition-all",
                                needsManualGradingCount === 0 
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20" 
                                    : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                            )}
                        >
                            {needsManualGradingCount > 0 ? (
                                <div className="flex items-center">
                                    <ClockIcon className="mr-2 size-4" />
                                    {t('grading.review.manual_needed')} ({needsManualGradingCount})
                                </div>
                            ) : (
                                <Link 
                                    href={grading.finalize(attempt.id).url} 
                                    method="post" 
                                    preserveScroll 
                                    onStart={() => setIsFinalizing(true)} 
                                    onFinish={() => setIsFinalizing(false)}
                                >
                                    {isFinalizing ? (
                                        <div className="flex items-center">
                                            <SaveIcon className="mr-2 size-4 animate-spin" />
                                            {t('common.loading')}
                                        </div>
                                    ) : (
                                        attempt.status === 'graded' ? t('common.update') : t('grading.review.sidebar.finalize')
                                    )}
                                </Link>
                            )}
                        </Button>
                    </div>
                </div>
                </div>

                {/* Main Side-by-Side Area */}
                <div className="flex flex-col lg:flex-row flex-1">
                    {/* Left Panel: Full Exam View */}
                    <div className="flex-1 w-full bg-slate-50 dark:bg-muted/50 lg:border-r flex flex-col min-h-full">
                        
                        {/* Violations Informational Banner */}
                        {attempt.violation_count > 0 && (
                            <div className="bg-slate-50/50 dark:bg-muted/20 backdrop-blur-md border-b border-slate-200 dark:border-border px-4 md:px-8 py-5 flex items-start gap-6 shadow-sm">
                                <div className="mt-1 rounded-2xl bg-white dark:bg-card p-3 text-rose-600 shadow-md border border-slate-100 dark:border-border ring-4 ring-rose-50 dark:ring-rose-500/10">
                                    <ShieldAlertIcon className="size-6 animate-pulse" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-sm font-black text-slate-900 dark:text-foreground uppercase tracking-tighter">
                                                {t('grading.review.violations.detected')}
                                            </h3>
                                            <Badge className="bg-rose-600 text-white border-none rounded-lg h-5 px-2 font-black text-[10px]">
                                                {attempt.violation_count}
                                            </Badge>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => setIsViolationSheetOpen(true)}
                                            className="h-9 rounded-xl bg-white dark:bg-background border border-slate-200 dark:border-border text-blue-600 font-black uppercase text-[10px] tracking-widest hover:bg-blue-50 dark:hover:bg-accent hover:border-blue-200 dark:hover:border-blue-800 shadow-sm transition-all"
                                        >
                                            {t('grading.review.violations.view_log')}
                                        </Button>
                                    </div>
                                    <p className="text-xs font-bold text-slate-500 dark:text-muted-foreground max-w-2xl leading-relaxed">
                                        {t('grading.review.violations.notice')}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {attempt.violation_logs?.slice(0, 3).map((log) => (
                                            <Badge key={log.id} variant="outline" className="bg-white dark:bg-muted border-border text-slate-600 dark:text-muted-foreground text-[9px] font-black px-1.5 sm:px-2.5 py-0.5 shadow-xs uppercase">
                                                <AlertTriangleIcon className="size-3 sm:mr-1.5 text-rose-500" />
                                                <span className="hidden sm:inline">{log.violation_type.replace(/_/g, ' ')}</span>
                                            </Badge>
                                        ))}
                                        {attempt.violation_logs && attempt.violation_logs.length > 3 && (
                                            <Badge variant="outline" className="bg-white dark:bg-muted border-border text-muted-foreground text-[9px] font-black px-1.5 sm:px-2.5 h-5 uppercase">
                                                +{attempt.violation_logs.length - 3} <span className="hidden sm:inline">{t('common.more')}</span>
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <Sheet open={isViolationSheetOpen} onOpenChange={setIsViolationSheetOpen}>
                            <SheetContent className="w-full sm:max-w-md md:max-w-lg p-0 border-l-0 shadow-2xl">
                                <SheetHeader className="p-8 pb-4 bg-blue-950 text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 scale-150">
                                        <ShieldAlertIcon className="size-32" />
                                    </div>
                                    <div className="flex items-center gap-4 mb-2 relative z-10">
                                        <div className="p-3 bg-rose-600 rounded-2xl shadow-lg ring-4 ring-rose-500/20">
                                            <ShieldAlertIcon className="size-6 text-white" />
                                        </div>
                                        <div className="text-left">
                                            <SheetTitle className="text-2xl font-black text-white uppercase tracking-tight">{t('grading.review.violations.sheet_title')}</SheetTitle>
                                            <SheetDescription className="text-slate-400 font-bold">
                                                {t('grading.review.violations.sheet_desc')}
                                            </SheetDescription>
                                        </div>
                                    </div>
                                </SheetHeader>
                                
                                <div className="flex flex-col h-[calc(100vh-140px)]">
                                    <div className="p-8 pb-0 shrink-0">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('grading.review.violations.total_count')}</span>
                                                <span className="text-3xl font-black text-slate-900">{attempt.violation_count}</span>
                                            </div>
                                            <Badge className="bg-blue-600 text-white border-none h-6 px-3 rounded-xl font-black text-[10px] uppercase shadow-md shadow-blue-500/20">
                                                {t('monitor.live')}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto px-8 pb-10 space-y-4">
                                        {attempt.violation_logs?.length > 0 ? (
                                            attempt.violation_logs.map((log) => (
                                                <div key={log.id} className="group relative rounded-3xl border-2 border-slate-100 dark:border-border bg-white dark:bg-muted/50 p-5 hover:border-rose-200 dark:hover:border-rose-800 hover:bg-rose-50/20 dark:hover:bg-rose-900/10 transition-all duration-300">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className="bg-rose-50 border-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wider px-3 py-1">
                                                                    {t(`violation.${log.violation_type}` as any) || log.violation_type}
                                                                </Badge>
                                                                {log.severity && (
                                                                    <span className={cn(
                                                                        "text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md",
                                                                        log.severity === 'high' || log.severity === 'critical' ? "bg-rose-600 text-white" : "bg-slate-200 text-slate-600"
                                                                    )}>
                                                                        {log.severity}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                                <ClockIcon className="size-3" />
                                                                <span className="text-[10px] font-bold tracking-tight">
                                                                    {new Date(log.occurred_at).toLocaleTimeString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {log.duration_seconds !== null && log.duration_seconds > 0 && (
                                                            <Badge variant="secondary" className="bg-slate-100 font-black text-[10px] text-slate-500 h-6">
                                                                {log.duration_seconds}s {t('grading.review.violations.duration')}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    
                                                    {log.details && (
                                                        <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-muted/50 border border-slate-100 dark:border-border text-[11px] font-bold text-slate-600 dark:text-muted-foreground leading-relaxed italic">
                                                            {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-20 opacity-20 italic">
                                                <ShieldAlertIcon className="size-16 mb-4" />
                                                <p className="text-sm font-black uppercase">{t('grading.review.violations.none')}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="p-8 border-t border-slate-200 dark:border-border bg-slate-50/80 dark:bg-muted/80 backdrop-blur-md shrink-0">
                                        <Button 
                                            variant="outline" 
                                            className="w-full h-12 rounded-2xl border-2 border-slate-200 dark:border-border font-black uppercase tracking-widest text-[11px] hover:bg-white dark:hover:bg-accent"
                                            onClick={() => setIsViolationSheetOpen(false)}
                                        >
                                            {t('grading.review.violations.close')}
                                        </Button>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>

                        <div className="px-4 md:px-8 py-4 border-b dark:border-border bg-white/50 dark:bg-muted/50 backdrop-blur-sm flex items-center justify-between sticky top-[57px] md:top-[73px] z-30">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                {t('grading.review.details')}
                            </span>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase">
                                    <ClockIcon className="size-3.5" />
                                    {attempt.submitted_at 
                                        ? Math.round((new Date(attempt.submitted_at).getTime() - new Date(attempt.started_at).getTime()) / 60000)
                                        : '?'
                                    }m {t('grading.review.time_taken')}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex-1 p-4 md:p-8 scroll-smooth">
                            <div className="max-w-3xl mx-auto space-y-8 md:space-y-12 pb-32">
                                {questions.map((q, idx) => (
                                    <div 
                                        key={q.id} 
                                        id={`q-${q.id}`}
                                        className={cn(
                                            "group relative rounded-3xl border-2 bg-white/80 dark:bg-card/40 backdrop-blur-sm p-5 sm:p-8 transition-all duration-300",
                                            selectedQuestionId === q.id ? "border-blue-500 shadow-2xl shadow-blue-500/10 scale-[1.01] z-10" : "border-slate-100 dark:border-border hover:border-slate-200 dark:hover:border-border shadow-sm",
                                        )}
                                        onClick={() => setSelectedQuestionId(q.id)}
                                    >
                                        <div className="mb-6 flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <span className={cn(
                                                    "flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-black shadow-sm transition-all",
                                                    selectedQuestionId === q.id 
                                                        ? "bg-blue-600 text-white ring-4 ring-blue-50/20" 
                                                        : "bg-slate-100 dark:bg-muted text-slate-900 dark:text-foreground border border-slate-200 dark:border-border"
                                                )}>
                                                    #{idx + 1}
                                                </span>
                                                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-3 h-6 border-slate-200 dark:border-border dark:bg-background dark:text-foreground">
                                                    {q.type.replace(/_/g, ' ')}
                                                </Badge>
                                            </div>
                                            <div className="text-xs font-black text-slate-400 group-hover:text-slate-600 transition-colors uppercase tracking-widest mt-2">
                                                {q.answer?.points_earned ?? 0} / {q.points} {t('exams.points')}
                                            </div>
                                        </div>

                                        <p className="mb-8 text-lg font-black text-slate-900 dark:text-foreground leading-snug tracking-tight">
                                            {q.content}
                                        </p>

                                        {/* Answer Content based on Type */}
                                        <div className="rounded-3xl bg-slate-50/50 dark:bg-background p-6 border-2 border-slate-50 dark:border-border">
                                            {(q.type === 'multiple_choice_single' || q.type === 'multiple_choice_multiple') && (
                                                <div className="space-y-3">
                                                    {q.options?.map(opt => {
                                                        const isSelected = q.answer?.selected_options?.includes(opt.id);
                                                        return (
                                                            <div key={opt.id} className={cn(
                                                                "flex items-center justify-between rounded-2xl px-5 py-4 text-sm border-2 transition-all duration-300",
                                                                isSelected 
                                                                    ? opt.is_correct 
                                                                        ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 dark:border-emerald-400 text-emerald-900 dark:text-emerald-300 font-black shadow-sm" 
                                                                        : "bg-rose-50 dark:bg-destructive/10 border-rose-500 dark:border-rose-400 text-rose-900 dark:text-rose-300 font-black shadow-sm"
                                                                    : opt.is_correct 
                                                                        ? "bg-slate-50/80 dark:bg-muted/40 border-emerald-200 dark:border-emerald-500/30 border-dashed text-slate-800 dark:text-emerald-100 italic" 
                                                                        : "bg-white dark:bg-background border-slate-100 dark:border-border text-slate-600 dark:text-muted-foreground opacity-80"
                                                            )}>
                                                                        <div className="flex items-center gap-4">
                                                                    <div className={cn(
                                                                        "size-6 rounded-lg flex items-center justify-center border-2 transition-all",
                                                                        isSelected 
                                                                            ? opt.is_correct ? "bg-emerald-500 border-emerald-500 text-white" : "bg-rose-500 border-rose-500 text-white"
                                                                            : "bg-white dark:bg-muted border-slate-200 dark:border-border"
                                                                    )}>
                                                                        {isSelected && (opt.is_correct ? <CheckIcon className="size-4" /> : <XIcon className="size-4" />)}
                                                                    </div>
                                                                    <span className="font-bold whitespace-normal">{opt.content}</span>
                                                                </div>
                                                                {opt.is_correct && (
                                                                    <Badge className="bg-emerald-500 hover:bg-emerald-500 border-none h-5 px-1.5 sm:px-2.5 text-[9px] font-black uppercase tracking-widest">
                                                                        <CheckCircleIcon className="size-3 sm:mr-1.5" />
                                                                        <span className="hidden sm:inline">{t('exams.questions.correct_answer')}</span>
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {q.type === 'true_false' && (
                                                <div className="flex items-center gap-6">
                                                    <div className={cn(
                                                        "flex-1 rounded-[1.5rem] border-3 p-6 text-center text-base font-black uppercase tracking-[0.1em] shadow-sm",
                                                        q.answer?.text_answer === q.correct_answer 
                                                            ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-400" 
                                                            : "bg-rose-50 dark:bg-destructive/10 border-rose-400 dark:border-rose-500/50 text-rose-700 dark:text-rose-400"
                                                    )}>
                                                        {q.answer?.text_answer || t('grading.review.no_answer')}
                                                    </div>
                                                    <div className="bg-white dark:bg-muted p-4 rounded-2xl border-2 border-slate-100 dark:border-border text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] min-w-[140px] text-center">
                                                        {t('grading.review.reference')}:<br/>
                                                        <span className="text-slate-900 dark:text-foreground text-xs mt-1 block">{q.correct_answer}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {(q.type === 'short_text' || q.type === 'essay') && (
                                                <div className="space-y-4">
                                                    <div className="text-base font-bold whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-muted-foreground p-2">
                                                        {q.answer?.text_answer || (
                                                            <div className="flex flex-col items-center justify-center py-10 opacity-30 italic">
                                                                <BanIcon className="size-10 mb-2" />
                                                                <span className="text-sm font-black uppercase">{t('grading.review.no_submission')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sticky Right Panel: Grading Sidebar */}
                    <aside className="w-full lg:w-[420px] lg:sticky lg:top-[73px] lg:h-[calc(100vh-73px)] flex flex-col bg-white dark:bg-card/50 backdrop-blur-xl border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-border shadow-2xl z-20 lg:self-start">
                        <div className="p-5 border-b border-slate-200 dark:border-border flex items-center justify-between bg-slate-50/50 dark:bg-muted/50 shrink-0">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-muted-foreground">{t('grading.review.sidebar.score_control')}</h2>
                            <TrophyIcon className="size-5 text-amber-500 drop-shadow-sm" />
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-0">
                            <div className="p-8 space-y-10 pb-32">
                                {/* Overall Progress */}
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-md font-black text-slate-900 dark:text-foreground tracking-tight">{t('grading.review.score_preview')}</p>
                                            {attempt.penalty_points ? (
                                                <Badge variant="destructive" className="h-5 rounded-lg text-[9px] font-black uppercase px-2 shadow-sm animate-pulse">
                                                    {t('grading.review.penalty_active')}
                                                </Badge>
                                            ) : (
                                                <p className="text-[10px] font-black text-muted-foreground uppercase opacity-60">{t('grading.review.real_time')}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-end gap-1.5 justify-end mb-1">
                                                <p className="text-5xl font-black tracking-tighter text-blue-600 leading-none">
                                                    {Math.round(previewScore * 10) / 10}
                                                </p>
                                                <p className="text-xl font-black text-slate-300 italic mb-1">
                                                    / {exam.total_points}
                                                </p>
                                            </div>
                                            <Badge className={cn(
                                                "font-black text-[11px] px-3 h-6 rounded-xl shadow-xs border-none uppercase tracking-widest",
                                                attempt.penalty_points ? "bg-rose-100 dark:bg-destructive/10 text-rose-700 dark:text-destructive" : "bg-blue-100 dark:bg-accent/30 text-blue-700 dark:text-foreground"
                                            )}>
                                                {Math.round(previewPercentage * 10) / 10}%
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 dark:bg-muted rounded-2xl overflow-hidden shadow-inner p-0.5">
                                        <div 
                                            className={cn(
                                                "h-full rounded-2xl transition-all duration-700 ease-out shadow-lg",
                                                attempt.penalty_points ? "bg-rose-500 shadow-rose-200" : "bg-blue-600 shadow-blue-200"
                                            )}
                                            style={{ width: `${previewPercentage}%` }}
                                        />
                                    </div>

                                    {/* Penalty Info on Sidebar */}
                                    {attempt.penalty_points && (
                                        <div className="animate-in slide-in-from-right-8 duration-500 rounded-[2rem] border-2 border-slate-100 dark:border-border bg-slate-50/50 dark:bg-destructive/5 p-6 shadow-sm overflow-hidden relative">
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
                                            <div className="flex items-center justify-between mb-3 px-1">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-700 flex items-center gap-2">
                                                    <BanIcon className="size-4" />
                                                    {t('grading.review.disciplinary_penalty')}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-700 dark:text-muted-foreground leading-relaxed italic border-l-2 border-slate-200 dark:border-border pl-4 py-1 ml-1">
                                                "{attempt.penalty_reason}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t pt-8">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">{t('grading.review.review_queue')}</h3>
                                    
                                    {manualQuestions.length === 0 ? (
                                        <div className="rounded-[2.5rem] border-3 border-dashed border-slate-100 dark:border-border p-12 text-center bg-slate-50/20 dark:bg-muted/20">
                                            <div className="inline-flex size-16 items-center justify-center rounded-3xl bg-slate-50 dark:bg-muted text-emerald-500 mb-6 group hover:scale-110 transition-transform duration-300">
                                                <CheckCircleIcon className="size-8" />
                                            </div>
                                            <p className="text-sm font-black uppercase tracking-tight text-slate-400">{t('grading.review.no_review_needed')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {manualQuestions.map((q, i) => {
                                                const isSelected = selectedQuestionId === q.id;
                                                const isGraded = !!q.answer && q.answer.points_earned !== null;
                                                const isFullPoints = isGraded && Number(q.answer?.points_earned) === Number(q.points);
                                                const isNoPoints = isGraded && Number(q.answer?.points_earned) === 0;
                                                const isPartial = isGraded && !isFullPoints && !isNoPoints;

                                                return (
                                                    <div key={q.id} className="space-y-4">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedQuestionId(q.id);
                                                                document.getElementById(`q-${q.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                            }}
                                                            className={cn(
                                                                "w-full flex items-center justify-between rounded-2xl border-2 p-4 text-left transition-all duration-300 group",
                                                                isSelected 
                                                                    ? "border-blue-500 bg-blue-50/30 dark:bg-accent/20 shadow-xl shadow-blue-500/5 ring-4 ring-blue-50 dark:ring-accent/30 scale-[1.03]" 
                                                                    : cn(
                                                                        "hover:border-slate-300 dark:hover:border-border hover:bg-slate-50 dark:hover:bg-accent border-slate-100 dark:border-border",
                                                                        isFullPoints && "bg-emerald-50/20 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30",
                                                                        isNoPoints && "bg-rose-50/20 dark:bg-destructive/10 border-rose-100 dark:border-destructive/30",
                                                                        isPartial && "bg-amber-50/20 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30"
                                                                    )
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-4 min-w-0 pr-2">
                                                                <div className={cn(
                                                                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black transition-all duration-300 shadow-sm",
                                                                    isFullPoints ? "bg-emerald-600 text-white" :
                                                                    isNoPoints ? "bg-rose-600 text-white" :
                                                                    isPartial ? "bg-amber-600 text-white" :
                                                                    "bg-slate-900 text-white"
                                                                )}>
                                                                    {i + 1}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className={cn(
                                                                        "text-[13px] font-black truncate leading-tight group-hover:text-blue-600 transition-colors",
                                                                        isSelected && "text-blue-700"
                                                                    )}>
                                                                        {q.content}
                                                                    </p>
                                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                                        {q.type.replace(/_/g, ' ')} • {t('grading.review.max_pts', [q.points])}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="shrink-0 flex items-center gap-3">
                                                                {isGraded ? (
                                                                    <Badge className={cn(
                                                                        "h-7 rounded-xl font-black text-[10px] px-3 uppercase tracking-tighter shadow-xs border-none",
                                                                        isFullPoints ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400" :
                                                                        isNoPoints ? "bg-rose-100 dark:bg-destructive/10 text-rose-800 dark:text-destructive" :
                                                                        "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400"
                                                                    )}>
                                                                        {q.answer?.points_earned} {t('grading.table.pts')}
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="h-7 rounded-xl font-black text-[9px] text-slate-400 border-slate-200 border-2 uppercase px-3 italic">
                                                                        {t('grading.review.pending')}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </button>

                                                        {isSelected && (
                                                            <div className="ml-4 pl-6 border-l-4 border-blue-100 space-y-6 animate-in slide-in-from-top-4 duration-500 pb-8">
                                                                {/* Correct/Reference Answer Panel */}
                                                                {q.correct_answer && (
                                                                    <div className="rounded-3xl border-2 border-slate-100 dark:border-border bg-slate-50/80 dark:bg-muted/80 p-6 shadow-sm">
                                                                        <div className="flex items-center gap-3 mb-3">
                                                                            <CheckCircleIcon className="size-4 text-emerald-600" />
                                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{t('grading.review.instructor_reference')}</span>
                                                                        </div>
                                                                        <p className="text-[11px] font-bold text-slate-800 dark:text-muted-foreground leading-relaxed italic">
                                                                            "{q.correct_answer}"
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                {q.answer ? (
                                                                    <div className="bg-white dark:bg-card rounded-[2rem] border-2 border-blue-50 dark:border-accent/30 p-6 shadow-lg shadow-blue-500/5">
                                                                        <GradeForm
                                                                            key={`${q.id}-${q.answer.id}`}
                                                                            answer={q.answer}
                                                                            maxPoints={q.points}
                                                                            saving={savingQuestion === q.answer.id}
                                                                            onSave={(points, feedback) => 
                                                                                handleGradeAnswer(q.answer!.id, points, feedback)
                                                                            }
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div className="rounded-3xl bg-slate-50 dark:bg-muted/50 p-10 text-center border-2 border-dashed border-slate-100 dark:border-border">
                                                                        <XIcon className="size-8 text-slate-200 mx-auto mb-3" />
                                                                        <p className="text-xs font-black uppercase text-slate-300">{t('grading.review.incomplete')}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>

                {/* Mobile Sticky Grading Bar & Drawer */}
                <div className="lg:hidden sticky bottom-0 z-40 bg-white dark:bg-background/95 backdrop-blur-xl border-t dark:border-border shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] p-4">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-border">
                        <div className="flex items-center gap-3">
                           <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-500">
                               <TrophyIcon className="size-5" />
                           </div>
                           <div className="flex flex-col">
                               <span className="text-[10px] font-black uppercase text-slate-400 dark:text-muted-foreground tracking-widest leading-none mb-1">{t('grading.review.live_score')}</span>
                               <span className="text-xl font-black text-blue-600 dark:text-blue-400 leading-none">{Math.round(previewScore * 10) / 10}<span className="text-sm text-slate-300 dark:text-slate-600">/{exam.total_points}</span></span>
                           </div>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-muted p-1.5 rounded-2xl shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-white dark:hover:bg-accent transition-all shadow-sm" onClick={handlePrevQuestion} disabled={activeQuestionIndex <= 0}>
                                <ChevronLeftIcon className="size-4" />
                            </Button>
                             <span className="text-[11px] font-black w-10 text-center text-slate-500 dark:text-muted-foreground uppercase tracking-widest">{activeQuestionIndex + 1}/{questions.length}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-white dark:hover:bg-accent transition-all shadow-sm" onClick={handleNextQuestion} disabled={activeQuestionIndex === questions.length - 1}>
                                <ChevronRightIcon className="size-4" />
                            </Button>
                        </div>
                    </div>
                    
                    <Sheet open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
                        <SheetTrigger asChild>
                            <Button className="w-full h-12 rounded-2xl bg-slate-900 dark:bg-background dark:ring-border ring-1 dark:text-foreground hover:bg-slate-800 dark:hover:bg-accent font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 text-xs text-white">
                                {t('grading.review.grade_question', [activeQuestionIndex + 1])}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[85vh] rounded-t-[2.5rem] px-2 sm:px-4 pb-8 overflow-y-auto bg-slate-50 dark:bg-background border-t-0 ring-1 ring-slate-900/5 dark:ring-border shadow-2xl">
                            <SheetHeader className="px-4 mb-6 mt-4 relative">
                                <div className="absolute left-1/2 -top-8 -translate-x-1/2 w-12 h-1.5 bg-slate-200 rounded-full" />
                                <SheetTitle className="text-xl font-black flex flex-col justify-start">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-blue-600 text-white text-lg font-black shadow-lg shadow-blue-500/20 shrink-0">
                                                #{activeQuestionIndex + 1}
                                            </div>
                                            <div className="text-left flex flex-col gap-1.5">
                                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest h-5 border-slate-200 dark:border-border bg-white dark:bg-muted shadow-sm flex-wrap w-fit">
                                                    {activeQuestion?.type.replace(/_/g, ' ')}
                                                </Badge>
                                                <span className="text-[10px] font-black tracking-widest text-slate-500">{t('grading.review.max_pts', [activeQuestion?.points])}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 p-1.5 rounded-2xl shrink-0">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl hover:bg-white transition-all shadow-sm" onClick={handlePrevQuestion} disabled={activeQuestionIndex <= 0}>
                                                <ChevronLeftIcon className="size-5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl hover:bg-white transition-all shadow-sm" onClick={handleNextQuestion} disabled={activeQuestionIndex === questions.length - 1}>
                                                <ChevronRightIcon className="size-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </SheetTitle>
                                <SheetDescription className="sr-only">
                                    {t('grading.review.violations.sheet_desc')}
                                </SheetDescription>
                            </SheetHeader>

                            <div className="px-2 sm:px-4 space-y-6">
                                {activeQuestion?.answer ? (
                                    <div className="bg-white rounded-[2rem] border-2 border-slate-100 p-5 sm:p-6 shadow-xl shadow-slate-200/40 relative">
                                        <GradeForm
                                            key={`mobile-${activeQuestion.id}-${activeQuestion.answer.id}`}
                                            answer={activeQuestion.answer}
                                            maxPoints={activeQuestion.points}
                                            saving={savingQuestion === activeQuestion.answer.id}
                                            onSave={(points, feedback) => {
                                                handleGradeAnswer(activeQuestion.answer!.id, points, feedback);
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="rounded-[2.5rem] bg-slate-100 p-12 text-center border-2 border-dashed border-slate-200">
                                        <XIcon className="size-10 text-slate-300 mx-auto mb-4" />
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t('grading.review.incomplete')}</p>
                                    </div>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </AppLayout>
    );
}

interface GradeFormProps {
    answer: ExamAnswer;
    maxPoints: number;
    saving: boolean;
    onSave: (points: number, feedback: string) => void;
}

function GradeForm({ answer, maxPoints, saving, onSave }: GradeFormProps) {
    const { t } = useLanguageStandalone();
    const [points, setPoints] = useState(
        answer.points_earned !== null ? answer.points_earned.toString() : ''
    );
    const [feedback, setFeedback] = useState(answer.instructor_feedback || '');
    const [mode, setMode] = useState<'correct' | 'incorrect' | 'partial' | null>(
        answer.points_earned !== null 
            ? (answer.points_earned == maxPoints ? 'correct' : answer.points_earned == 0 ? 'incorrect' : 'partial')
            : null
    );

    const handleQuickAction = (actionMode: 'correct' | 'incorrect' | 'partial') => {
        setMode(actionMode);
        if (actionMode === 'correct') {
            setPoints(maxPoints.toString());
            onSave(maxPoints, feedback);
        } else if (actionMode === 'incorrect') {
            setPoints('0');
            onSave(0, feedback);
        } else {
            // Partial just toggles the input field
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-3 gap-3">
                <Button 
                    type="button" 
                    variant="outline" 
                    className={cn(
                        "h-16 flex-col gap-1.5 border-2 rounded-2xl font-black uppercase text-[9px] tracking-[0.1em] transition-all duration-300",
                        mode === 'correct' 
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-400 ring-4 ring-emerald-100 dark:ring-emerald-500/10" 
                            : "border-slate-100 dark:border-border/5 hover:border-emerald-300 hover:bg-emerald-50/30"
                    )}
                    onClick={() => handleQuickAction('correct')}
                >
                    <CheckCircleIcon className={cn("size-5", mode === 'correct' ? "text-emerald-600" : "text-slate-400")} />
                    {t('common.status.correct')}
                </Button>
                <Button 
                    type="button" 
                    variant="outline" 
                    className={cn(
                        "h-16 flex-col gap-1.5 border-2 rounded-2xl font-black uppercase text-[9px] tracking-[0.1em] transition-all duration-300",
                        mode === 'partial' 
                            ? "border-amber-400 bg-amber-50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 ring-4 ring-amber-100 dark:ring-amber-500/10" 
                            : "border-slate-100 dark:border-border/5 hover:border-amber-300 hover:bg-amber-50/30"
                    )}
                    onClick={() => handleQuickAction('partial')}
                >
                    <AlertCircleIcon className={cn("size-5", mode === 'partial' ? "text-amber-600" : "text-slate-400")} />
                    {t('common.status.partial')}
                </Button>
                <Button 
                    type="button" 
                    variant="outline" 
                    className={cn(
                        "h-16 flex-col gap-1.5 border-2 rounded-2xl font-black uppercase text-[9px] tracking-[0.1em] transition-all duration-300",
                        mode === 'incorrect' 
                            ? "border-rose-400 bg-rose-50 dark:bg-destructive/10 text-rose-800 dark:text-destructive ring-4 ring-rose-100 dark:ring-rose-500/10" 
                            : "border-slate-100 dark:border-border/5 hover:border-rose-300 hover:bg-rose-50/30"
                    )}
                    onClick={() => handleQuickAction('incorrect')}
                >
                    <XIcon className={cn("size-5", mode === 'incorrect' ? "text-rose-600" : "text-slate-400")} />
                    {t('common.status.incorrect')}
                </Button>
            </div>

            {mode === 'partial' && (
                <div className="animate-in slide-in-from-top-4 duration-500 space-y-4 rounded-3xl border-2 border-amber-100 dark:border-amber-800/40 bg-amber-50/30 dark:bg-amber-900/20 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-800 dark:text-amber-400">{t('grading.review.assign_score')}</Label>
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-500/60 italic opacity-60">{t('grading.review.limit')}: {maxPoints}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Input
                            type="number"
                            min={0}
                            max={maxPoints}
                            step={0.1}
                            value={points}
                            onChange={(e) => setPoints(e.target.value)}
                            className="h-14 text-2xl font-black text-center w-28 border-3 border-amber-200 dark:border-amber-800/50 rounded-2xl focus-visible:ring-amber-500 transition-all bg-white dark:bg-background"
                        />
                        <Button 
                            className="flex-1 h-14 rounded-2xl bg-amber-500 dark:bg-amber-600 hover:bg-amber-600 dark:hover:bg-amber-500 font-black uppercase tracking-widest text-xs shadow-lg shadow-amber-200 dark:shadow-amber-950/20"
                            onClick={() => onSave(parseFloat(points) || 0, feedback)}
                            disabled={saving}
                        >
                            {saving ? t('common.loading') : t('common.save')}
                        </Button>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center justify-between px-1">
                    {t('grading.review.question.feedback')}
                    <span className="opacity-40 font-bold italic normal-case tracking-normal">{t('common.optional')}</span>
                </Label>
                <div className="relative group">
                    <Textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder={t('grading.review.question.feedback.placeholder')}
                        className="min-h-[140px] w-full rounded-[2rem] border-3 border-slate-50 dark:border-border p-6 pb-16 text-sm font-bold focus:border-blue-300 focus:ring-0 transition-all duration-300 resize-none bg-slate-50/30 dark:bg-background/50 group-hover:bg-white dark:group-hover:bg-background"
                    />
                    <div className="absolute bottom-4 right-4 animate-in fade-in zoom-in-95 duration-700">
                        <Button
                            size="sm"
                            className="h-10 px-5 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white shadow-xl font-black text-[10px] tracking-[0.1em] uppercase transition-all"
                            onClick={() => onSave(parseFloat(points) || 0, feedback)}
                            disabled={saving || !mode}
                        >
                            {saving ? (
                                <SaveIcon className="mr-2 size-4 animate-spin" />
                            ) : (
                                <SaveIcon className="mr-2 size-4" />
                            )}
                            {t('grading.review.save_feedback')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
