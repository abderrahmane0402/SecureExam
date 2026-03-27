import { Head, router, Link } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { index as examsIndex, show as showExam } from '@/routes/exams';
import grading from '@/routes/grading';
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
    FileTextIcon,
    AlertCircleIcon,
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
import { Textarea } from '@/components/ui/textarea';
import { useLanguageStandalone } from '@/hooks/use-language';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
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
            
            <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
                {/* Sticky Top Nav Bar */}
                <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b flex items-center justify-between px-6 py-4 shadow-sm">
                    <div className="flex items-center gap-5">
                        <Button variant="ghost" size="icon" asChild className="rounded-2xl hover:bg-slate-100 border transition-all">
                            <Link href={grading.index(exam.id).url}>
                                <ArrowLeftIcon className="size-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none mb-1">
                                {attempt.student.name}
                            </h1>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
                                {exam.title} <span className="opacity-30">•</span> {t('exams.attempts')} #{attempt.attempt_number}
                            </p>
                        </div>
                        <Badge className={cn(
                            "ml-2 uppercase text-[10px] font-black h-5 border-none shadow-sm",
                            attempt.status === 'graded' ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 hover:bg-amber-600"
                        )}>
                            {t(`status.${attempt.status}` as any)}
                        </Badge>

                        {attempt.is_published && (
                            <Badge className="ml-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase text-[10px] font-black tracking-wider px-2 h-5">
                                {t('exams.status.published')}
                            </Badge>
                        )}
                        
                        {attempt.penalty_points && (
                            <Badge variant="destructive" className="ml-2 bg-rose-600 uppercase text-[10px] font-black border-none animate-pulse shadow-rose-200 shadow-lg">
                                {attempt.penalty_points} {t('exams.points')} {t('grading.review.sidebar.penalty')}
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Penalty Dialog */}
                        <Dialog open={isPenaltyDialogOpen} onOpenChange={setIsPenaltyDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="h-10 rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50 font-black uppercase tracking-widest text-[10px] transition-all">
                                    <BanIcon className="size-4 mr-2" />
                                    {attempt.penalty_points ? t('common.edit') : t('grading.review.penalty.apply')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] rounded-3xl">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-3 text-rose-600 text-xl font-black">
                                        <BanIcon className="size-6" />
                                        {t('grading.review.penalty.apply')}
                                    </DialogTitle>
                                    <DialogDescription className="font-bold">
                                        Evaluate disciplinary action for this student submission.
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
                                                penaltyMode === 'zero' ? "border-rose-500 bg-rose-50/50 ring-4 ring-rose-50" : "border-rose-100 hover:bg-rose-50"
                                            )}
                                        >
                                            <div className={cn("size-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0", penaltyMode === 'zero' && "border-rose-600")}>
                                                {penaltyMode === 'zero' && <div className="size-2.5 rounded-full bg-rose-600" />}
                                            </div>
                                            <Label className="flex-1 cursor-pointer font-black text-sm text-rose-700">{t('grading.review.penalty.zero')}</Label>
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
                                    "h-10 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all",
                                    attempt.is_published ? "text-rose-600 border-rose-200 hover:bg-rose-100" : "text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                                )}
                                onClick={() => router.post(grading.publish(attempt.id).url)}
                            >
                                {attempt.is_published ? <EyeOffIcon className="size-4 mr-2" /> : <EyeIcon className="size-4 mr-2" />}
                                {attempt.is_published ? t('grading.action.unpublish') : t('grading.action.publish')}
                            </Button>
                        )}
                        
                        <div className="flex items-center border rounded-xl overflow-hidden bg-slate-100/50 p-1">
                            {previousAttemptId ? (
                                <Link 
                                    href={grading.show(previousAttemptId).url}
                                    className="p-2 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all"
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
                                    className="p-2 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all"
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
                                "h-11 px-6 rounded-2xl font-black uppercase tracking-[0.1em] text-xs shadow-xl transition-all",
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

                {/* Main Side-by-Side Area */}
                <div className="flex flex-1 items-start">
                    {/* Left Panel: Full Exam View */}
                    <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 border-r flex flex-col min-h-full">
                        
                        {/* Violations Informational Banner */}
                        {attempt.violation_count > 0 && (
                            <div className="bg-rose-50/80 backdrop-blur-sm border-b border-rose-100 px-8 py-4 flex items-start gap-5 shadow-inner">
                                <div className="mt-1 rounded-2xl bg-white p-2.5 text-rose-600 shadow-sm border border-rose-100">
                                    <ShieldAlertIcon className="size-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-black text-rose-900 uppercase tracking-tighter">
                                        {t('grading.review.sidebar.violations')} Detéctées ({attempt.violation_count})
                                    </h3>
                                    <p className="text-xs font-bold text-rose-700/80 mt-1 max-w-2xl leading-relaxed">
                                        Review security flags and decided if a penalty is appropriate. Detailed violations can be viewed in the dashboard.
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {attempt.violation_logs?.slice(0, 3).map((log, i) => (
                                            <Badge key={i} variant="outline" className="bg-white/80 border-rose-200 text-rose-900 text-[9px] uppercase font-black px-2.5 py-0.5">
                                                {log.violation_type.replace(/_/g, ' ')}
                                            </Badge>
                                        ))}
                                        {attempt.violation_logs && attempt.violation_logs.length > 3 && (
                                            <Badge variant="outline" className="bg-white/80 border-rose-200 text-rose-900 text-[9px] uppercase font-black">
                                                +{attempt.violation_logs.length - 3} {t('common.more')}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="px-8 py-4 border-b bg-white/50 backdrop-blur-sm flex items-center justify-between sticky top-[73px] z-30">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                {t('grading.review.details')}
                            </span>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase">
                                    <ClockIcon className="size-3.5" />
                                    {attempt.submitted_at 
                                        ? Math.round((new Date(attempt.submitted_at).getTime() - new Date(attempt.started_at).getTime()) / 60000)
                                        : '?'
                                    }m taken
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex-1 p-8 scroll-smooth">
                            <div className="max-w-3xl mx-auto space-y-12 pb-32">
                                {questions.map((q, idx) => (
                                    <div 
                                        key={q.id} 
                                        id={`q-${q.id}`}
                                        className={cn(
                                            "group relative rounded-[2.5rem] border-2 bg-white p-8 transition-all duration-300",
                                            selectedQuestionId === q.id ? "border-blue-500 shadow-2xl shadow-blue-500/10 scale-[1.02] z-10" : "border-slate-100 hover:border-slate-200 shadow-sm",
                                        )}
                                        onClick={() => setSelectedQuestionId(q.id)}
                                    >
                                        <div className="mb-6 flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <span className={cn(
                                                    "flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-black shadow-sm transition-all",
                                                    selectedQuestionId === q.id ? "bg-blue-600 text-white" : "bg-slate-900 text-white"
                                                )}>
                                                    #{idx + 1}
                                                </span>
                                                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-3 h-6 border-slate-200">
                                                    {q.type.replace(/_/g, ' ')}
                                                </Badge>
                                            </div>
                                            <div className="text-xs font-black text-slate-400 group-hover:text-slate-600 transition-colors uppercase tracking-widest mt-2">
                                                {q.answer?.points_earned ?? 0} / {q.points} {t('exams.points')}
                                            </div>
                                        </div>

                                        <p className="mb-8 text-lg font-black text-slate-900 dark:text-slate-100 leading-snug tracking-tight">
                                            {q.content}
                                        </p>

                                        {/* Answer Content based on Type */}
                                        <div className="rounded-3xl bg-slate-50/50 dark:bg-slate-900/80 p-6 border-2 border-slate-50">
                                            {(q.type === 'multiple_choice_single' || q.type === 'multiple_choice_multiple') && (
                                                <div className="space-y-3">
                                                    {q.options?.map(opt => {
                                                        const isSelected = q.answer?.selected_options?.includes(opt.id);
                                                        return (
                                                            <div key={opt.id} className={cn(
                                                                "flex items-center justify-between rounded-2xl px-5 py-4 text-sm border-2 transition-all duration-300",
                                                                isSelected 
                                                                    ? opt.is_correct 
                                                                        ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-black shadow-sm" 
                                                                        : "bg-rose-50 border-rose-500 text-rose-900 font-black shadow-sm"
                                                                    : opt.is_correct 
                                                                        ? "bg-slate-50/80 border-emerald-200 border-dashed opacity-80" 
                                                                        : "bg-white border-slate-100 opacity-60"
                                                            )}>
                                                                <div className="flex items-center gap-4">
                                                                    <div className={cn(
                                                                        "size-6 rounded-lg flex items-center justify-center border-2 transition-all",
                                                                        isSelected 
                                                                            ? opt.is_correct ? "bg-emerald-500 border-emerald-500 text-white" : "bg-rose-500 border-rose-500 text-white"
                                                                            : "bg-white border-slate-200"
                                                                    )}>
                                                                        {isSelected && (opt.is_correct ? <CheckIcon className="size-4" /> : <XIcon className="size-4" />)}
                                                                    </div>
                                                                    <span className="font-bold">{opt.content}</span>
                                                                </div>
                                                                {opt.is_correct && (
                                                                    <Badge className="bg-emerald-500 hover:bg-emerald-500 border-none h-5 text-[9px] font-black uppercase tracking-widest">
                                                                        {t('exams.questions.correct_answer')}
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
                                                            ? "bg-emerald-50 border-emerald-400 text-emerald-700" 
                                                            : "bg-rose-50 border-rose-400 text-rose-700"
                                                    )}>
                                                        {q.answer?.text_answer || 'NO ANSWER'}
                                                    </div>
                                                    <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] min-w-[140px] text-center">
                                                        Reference:<br/>
                                                        <span className="text-slate-900 text-xs mt-1 block">{q.correct_answer}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {(q.type === 'short_text' || q.type === 'essay') && (
                                                <div className="space-y-4">
                                                    <div className="text-base font-bold whitespace-pre-wrap leading-relaxed text-slate-800 p-2">
                                                        {q.answer?.text_answer || (
                                                            <div className="flex flex-col items-center justify-center py-10 opacity-30 italic">
                                                                <BanIcon className="size-10 mb-2" />
                                                                <span className="text-sm font-black uppercase">No Submission</span>
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
                    <aside className="w-[480px] sticky top-[73px] h-[calc(100vh-73px)] flex flex-col bg-white border-l shadow-2xl z-20 self-start">
                        <div className="p-5 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-900 shrink-0">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{t('grading.review.sidebar.score')} CONTROL</h2>
                            <TrophyIcon className="size-5 text-amber-500 drop-shadow-sm" />
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-0">
                            <div className="p-8 space-y-10 pb-32">
                                {/* Overall Progress */}
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-md font-black text-slate-900 dark:text-slate-100 tracking-tight">Live Score Preview</p>
                                            {attempt.penalty_points ? (
                                                <Badge variant="destructive" className="h-5 rounded-lg text-[9px] font-black uppercase px-2 shadow-sm animate-pulse">
                                                    Penalty Active
                                                </Badge>
                                            ) : (
                                                <p className="text-[10px] font-black text-muted-foreground uppercase opacity-60">Real-time update</p>
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
                                                attempt.penalty_points ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                                            )}>
                                                {Math.round(previewPercentage * 10) / 10}%
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 rounded-2xl overflow-hidden shadow-inner p-0.5">
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
                                        <div className="animate-in slide-in-from-right-8 duration-500 rounded-[2rem] border-2 border-rose-100 bg-rose-50/50 p-6 shadow-sm">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-700 flex items-center gap-2">
                                                    <BanIcon className="size-4" />
                                                    Disciplinary Penalty
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-rose-950 leading-relaxed italic border-l-3 border-rose-300 pl-4 py-1">
                                                "{attempt.penalty_reason}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t pt-8">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Review Queue</h3>
                                    
                                    {manualQuestions.length === 0 ? (
                                        <div className="rounded-[2.5rem] border-3 border-dashed border-slate-100 p-12 text-center bg-slate-50/20">
                                            <div className="inline-flex size-16 items-center justify-center rounded-3xl bg-slate-50 text-emerald-500 mb-6 group hover:scale-110 transition-transform duration-300">
                                                <CheckCircleIcon className="size-8" />
                                            </div>
                                            <p className="text-sm font-black uppercase tracking-tight text-slate-400">Perfect: No essay/text grading required</p>
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
                                                                    ? "border-blue-500 bg-blue-50/30 shadow-xl shadow-blue-500/5 ring-4 ring-blue-50 scale-[1.03]" 
                                                                    : cn(
                                                                        "hover:border-slate-300 hover:bg-slate-50 border-slate-100",
                                                                        isFullPoints && "bg-emerald-50/20 border-emerald-100",
                                                                        isNoPoints && "bg-rose-50/20 border-rose-100",
                                                                        isPartial && "bg-amber-50/20 border-amber-100"
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
                                                                        {q.type.replace(/_/g, ' ')} • MAX {q.points} PTS
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="shrink-0 flex items-center gap-3">
                                                                {isGraded ? (
                                                                    <Badge className={cn(
                                                                        "h-7 rounded-xl font-black text-[10px] px-3 uppercase tracking-tighter shadow-xs border-none",
                                                                        isFullPoints ? "bg-emerald-100 text-emerald-800" :
                                                                        isNoPoints ? "bg-rose-100 text-rose-800" :
                                                                        "bg-amber-100 text-amber-800"
                                                                    )}>
                                                                        {q.answer?.points_earned} PTS
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="h-7 rounded-xl font-black text-[9px] text-slate-400 border-slate-200 border-2 uppercase px-3 italic">
                                                                        Pending
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </button>

                                                        {isSelected && (
                                                            <div className="ml-4 pl-6 border-l-4 border-blue-100 space-y-6 animate-in slide-in-from-top-4 duration-500 pb-8">
                                                                {/* Correct/Reference Answer Panel */}
                                                                {q.correct_answer && (
                                                                    <div className="rounded-3xl border-2 border-slate-100 bg-slate-50/80 p-6 shadow-sm">
                                                                        <div className="flex items-center gap-3 mb-3">
                                                                            <CheckCircleIcon className="size-4 text-emerald-600" />
                                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Instructor Reference</span>
                                                                        </div>
                                                                        <p className="text-[11px] font-bold text-slate-800 leading-relaxed italic">
                                                                            "{q.correct_answer}"
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                {q.answer ? (
                                                                    <div className="bg-white rounded-[2rem] border-2 border-blue-50 p-6 shadow-lg shadow-blue-500/5">
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
                                                                    <div className="rounded-3xl bg-slate-50 p-10 text-center border-2 border-dashed border-slate-100">
                                                                        <XIcon className="size-8 text-slate-200 mx-auto mb-3" />
                                                                        <p className="text-xs font-black uppercase text-slate-300">Incomplete Submission</p>
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
                            ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-4 ring-emerald-100" 
                            : "border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/30"
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
                            ? "border-amber-400 bg-amber-50 text-amber-800 ring-4 ring-amber-100" 
                            : "border-slate-100 hover:border-amber-300 hover:bg-amber-50/30"
                    )}
                    onClick={() => handleQuickAction('partial')}
                >
                    <AlertCircleIcon className={cn("size-5", mode === 'partial' ? "text-amber-600" : "text-slate-400")} />
                    Partial
                </Button>
                <Button 
                    type="button" 
                    variant="outline" 
                    className={cn(
                        "h-16 flex-col gap-1.5 border-2 rounded-2xl font-black uppercase text-[9px] tracking-[0.1em] transition-all duration-300",
                        mode === 'incorrect' 
                            ? "border-rose-400 bg-rose-50 text-rose-800 ring-4 ring-rose-100" 
                            : "border-slate-100 hover:border-rose-300 hover:bg-rose-50/30"
                    )}
                    onClick={() => handleQuickAction('incorrect')}
                >
                    <XIcon className={cn("size-5", mode === 'incorrect' ? "text-rose-600" : "text-slate-400")} />
                    {t('common.status.incorrect')}
                </Button>
            </div>

            {mode === 'partial' && (
                <div className="animate-in slide-in-from-top-4 duration-500 space-y-4 rounded-3xl border-2 border-amber-100 bg-amber-50/30 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-800">Assign Score</Label>
                        <span className="text-[10px] font-black text-amber-600 italic opacity-60">Limit: {maxPoints}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Input
                            type="number"
                            min={0}
                            max={maxPoints}
                            step={0.1}
                            value={points}
                            onChange={(e) => setPoints(e.target.value)}
                            className="h-14 text-2xl font-black text-center w-28 border-3 border-amber-200 rounded-2xl focus-visible:ring-amber-500 transition-all"
                        />
                        <Button 
                            className="flex-1 h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 font-black uppercase tracking-widest text-xs shadow-lg shadow-amber-200"
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
                        className="min-h-[140px] w-full rounded-[2rem] border-3 border-slate-50 p-6 pb-16 text-sm font-bold focus:border-blue-300 focus:ring-0 transition-all duration-300 resize-none bg-slate-50/30 group-hover:bg-white"
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
