import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangleIcon,
    UserIcon,
    ArrowLeftIcon,
    DownloadIcon,
    ClipboardCheckIcon,
    ArrowRightIcon,
    TrophyIcon,
    FilterIcon,
    PlayIcon,
    EyeIcon,
    GraduationCapIcon,
    CheckCircle2Icon,
    CircleIcon,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useLanguageStandalone } from '@/hooks/use-language';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem, Exam, ExamAttempt, User, ViolationLog } from '@/types';
import grading from '@/routes/grading';
import { show as showExam, toggleShowResults } from '@/routes/exams';
import { dashboard } from '@/routes';

interface AttemptWithStudent extends ExamAttempt {
    student: User;
    answers_count: number;
    violation_logs: ViolationLog[];
    penalty_points: number | null;
    penalty_reason: string | null;
    is_published: boolean;
    published_at: string | null;
}

interface Props {
    exam: Exam & { questions_count: number; total_points: number; show_results: boolean };
    attempts: AttemptWithStudent[];
    stats: {
        total: number;
        completed: number;
        pending_grading: number;
        graded: number;
        published: number;
        average_score: number | null;
    };
}

export default function GradingIndex({ exam, attempts, stats }: Props) {
    const { t } = useLanguageStandalone();
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [violationFilter, setViolationFilter] = useState<string>('all');
    const [performanceFilter, setPerformanceFilter] = useState<string>('all');
    const [selectedViolations, setSelectedViolations] = useState<AttemptWithStudent | null>(null);
    const [isBulkGrading, setIsBulkGrading] = useState(false);
    const [isBulkPublishing, setIsBulkPublishing] = useState(false);

    const formatDate = (date: string) => new Date(date).toLocaleString();

    const getStatusBadge = (status: string, isPublished: boolean = false) => {
        if (isPublished) {
            return (
                <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 uppercase text-[10px] font-black tracking-wider px-2 h-5">
                    {t('status.graded')} & {t('exams.status.published')}
                </Badge>
            );
        }

        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            in_progress: 'default',
            submitted: 'secondary',
            graded: 'outline',
            auto_submitted: 'destructive',
        };
        
        return (
            <Badge 
                variant={variants[status] || 'secondary'}
                className="uppercase text-[10px] font-black tracking-wider px-2 h-5"
            >
                {t(`status.${status}` as any)}
            </Badge>
        );
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('common.dashboard'), href: dashboard().url },
        { title: t('exams.title'), href: '/exams' },
        { title: exam.title, href: showExam(exam.id).url },
        { title: t('grading.title'), href: grading.index(exam.id).url },
    ];

    const filteredAttempts = useMemo(() => {
        return attempts.filter(attempt => {
            // Status filter
            if (statusFilter === 'pending' && attempt.status === 'graded') return false;
            if (statusFilter === 'graded' && attempt.status !== 'graded') return false;
            if (statusFilter === 'published' && !attempt.is_published) return false;

            // Violation filter
            if (violationFilter === 'has' && attempt.violation_count === 0) return false;
            if (violationFilter === 'none' && attempt.violation_count > 0) return false;

            // Performance filter
            if (performanceFilter !== 'all' && attempt.percentage !== null) {
                const passingScore = exam.passing_score ?? 0;
                const passed = attempt.percentage >= passingScore;
                if (performanceFilter === 'pass' && !passed) return false;
                if (performanceFilter === 'fail' && passed) return false;
            } else if (performanceFilter !== 'all' && attempt.percentage === null) {
                return false;
            }

            return true;
        });
    }, [attempts, statusFilter, violationFilter, performanceFilter, exam.passing_score]);

    const toggleAll = () => {
        if (selectedIds.length === filteredAttempts.length && filteredAttempts.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredAttempts.map(a => a.id));
        }
    };

    const toggleAttempt = (id: number) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkGrade = () => {
        if (!selectedIds.length) return;
        setIsBulkGrading(true);
        router.post(grading.bulkAutoGrade(exam.id).url, { attempt_ids: selectedIds }, {
            preserveScroll: true,
            onFinish: () => {
                setIsBulkGrading(false);
                setSelectedIds([]);
            }
        });
    };

    const handleBulkPublish = () => {
        if (!selectedIds.length) return;
        setIsBulkPublishing(true);
        router.post(grading.bulkPublish(exam.id).url, { attempt_ids: selectedIds }, {
            preserveScroll: true,
            onFinish: () => {
                setIsBulkPublishing(false);
                setSelectedIds([]);
            }
        });
    };

    const isAllSelected = filteredAttempts.length > 0 && selectedIds.length === filteredAttempts.length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('grading.title')}: ${exam.title}`} />
            <div className="flex flex-col gap-8 p-6 mx-auto max-w-7xl pb-32">
                {/* Header */}
                <div className="flex flex-col gap-4 rounded-3xl bg-slate-900 p-8 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                    
                    <div className="flex items-center gap-5 relative z-10">
                        <Button variant="ghost" size="icon" asChild className="rounded-2xl text-white hover:bg-white/10 hover:text-white border border-white/10 shadow-sm">
                            <Link href={showExam(exam.id).url}>
                                <ArrowLeftIcon className="size-5" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-black tracking-tight text-blue-400 uppercase italic">
                                    {t('grading.title')}
                                </h1>
                                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 font-bold px-3">
                                    {stats.pending_grading} {t('grading.stats.pending')}
                                </Badge>
                            </div>
                            <p className="text-sm font-bold text-slate-400">
                                {exam.title} • {exam.questions_count} {t('exams.questions')}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 relative z-10">
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "rounded-xl font-black uppercase tracking-widest text-[10px] h-10 transition-all border-none bg-white/5 text-slate-300 hover:bg-white/10",
                                exam.show_results && "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-50"
                            )}
                            onClick={() => router.post(toggleShowResults(exam.id).url)}
                        >
                            <GraduationCapIcon className="mr-2 size-4" />
                            {t('exams.fields.show_results')}: {exam.show_results ? t('common.on') : t('common.off')}
                        </Button>
                        <Button variant="outline" size="sm" asChild className="rounded-xl h-10 bg-white/5 text-white border-white/10 hover:bg-white/10 font-bold uppercase tracking-widest text-[10px]">
                            <a href={grading.export(exam.id).url}>
                                <DownloadIcon className="mr-2 size-4" />
                                {t('grading.show.export')}
                            </a>
                        </Button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col gap-4">
                    {/* Filter Bar */}
                    <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm sticky top-0 z-20">
                        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground mr-2">
                                    <FilterIcon className="size-3" />
                                    {t('common.filters')}:
                                </div>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[170px] h-10 rounded-xl font-bold text-xs bg-white border-slate-200 shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        <SelectItem value="all">{t('grading.filter.all')}</SelectItem>
                                        <SelectItem value="pending">{t('grading.filter.pending')}</SelectItem>
                                        <SelectItem value="graded">{t('grading.filter.graded')}</SelectItem>
                                        <SelectItem value="published">{t('grading.filter.published')}</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={violationFilter} onValueChange={setViolationFilter}>
                                    <SelectTrigger className="w-[170px] h-10 rounded-xl font-bold text-xs bg-white border-slate-200 shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        <SelectItem value="all">{t('common.all')} {t('grading.table.violations')}</SelectItem>
                                        <SelectItem value="has">{t('grading.filter.has_violations')}</SelectItem>
                                        <SelectItem value="none">{t('grading.filter.no_violations')}</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                                    <SelectTrigger className="w-[170px] h-10 rounded-xl font-bold text-xs bg-white border-slate-200 shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        <SelectItem value="all">Performance: {t('common.all')}</SelectItem>
                                        <SelectItem value="pass">{t('grading.filter.passed')}</SelectItem>
                                        <SelectItem value="fail">{t('grading.filter.failed')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submissions List */}
                    <Card className="rounded-3xl overflow-hidden border-none shadow-xl bg-white/80 backdrop-blur-md transition-all duration-500">
                        <div className="bg-slate-50/50 dark:bg-slate-900/50 border-b px-8 py-5 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <button 
                                    onClick={toggleAll}
                                    className="flex items-center justify-center p-1 rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    {isAllSelected ? (
                                        <CheckCircle2Icon className="size-6 text-blue-600 fill-blue-50" />
                                    ) : (
                                        <CircleIcon className="size-6 text-slate-300" />
                                    )}
                                </button>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                                    {t('grading.table.student')}s ({filteredAttempts.length})
                                </h3>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs font-bold text-slate-400 italic">
                                <span>{stats.graded} / {stats.total} {t('status.graded')}</span>
                                <span className="text-slate-200">|</span>
                                <span>{stats.published} {t('grading.stats.published')}</span>
                            </div>
                        </div>

                        <CardContent className="p-0">
                            {filteredAttempts.length > 0 ? (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredAttempts.map((attempt) => (
                                        <div
                                            key={attempt.id}
                                            className={cn(
                                                "group flex items-center gap-6 px-8 py-5 transition-all hover:bg-blue-50/30 dark:hover:bg-blue-900/10",
                                                selectedIds.includes(attempt.id) ? "bg-blue-50/50 dark:bg-blue-900/20" : ""
                                            )}
                                        >
                                            <button 
                                                onClick={() => toggleAttempt(attempt.id)}
                                                className="shrink-0 transition-all hover:scale-110"
                                            >
                                                {selectedIds.includes(attempt.id) ? (
                                                    <CheckCircle2Icon className="size-6 text-blue-600 fill-blue-50" />
                                                ) : (
                                                    <CircleIcon className="size-6 text-slate-300" />
                                                )}
                                            </button>
                                            
                                            <Link href={grading.show(attempt.id).url} className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-center gap-5 min-w-0">
                                                    <div className="relative shrink-0">
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border shadow-xs group-hover:border-blue-500/50 group-hover:shadow-blue-200 transition-all duration-300">
                                                            <UserIcon className="size-6 text-slate-400 group-hover:text-blue-600" />
                                                        </div>
                                                        {attempt.violation_count > 0 && (
                                                            <button 
                                                                type="button"
                                                                onClick={(e) => { e.preventDefault(); setSelectedViolations(attempt); }}
                                                                className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-rose-600 text-white border-2 border-white dark:border-slate-900 shadow-lg hover:scale-110 transition-transform z-10 animate-pulse"
                                                            >
                                                                <AlertTriangleIcon className="size-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-base font-black tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">
                                                            {attempt.student.name}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-0.5 min-w-0">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                                                                {attempt.student.email}
                                                            </p>
                                                            <span className="text-slate-300 hidden sm:inline">•</span>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">
                                                                #{attempt.attempt_number}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between md:justify-end gap-8 md:gap-12">
                                                    <div className="text-right shrink-0">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t('grading.table.submitted')}</p>
                                                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                                            {formatDate(attempt.submitted_at || attempt.started_at)}
                                                        </p>
                                                    </div>

                                                    <div className="text-right min-w-[100px] shrink-0">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t('grading.table.status')}</p>
                                                        {getStatusBadge(attempt.status, attempt.is_published)}
                                                    </div>

                                                    <div className="text-right min-w-[90px] shrink-0">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t('grading.table.score')}</p>
                                                        {attempt.score !== null ? (
                                                            <div className="space-y-0.5">
                                                                <div className="flex items-center justify-end gap-1.5">
                                                                    <p className={cn(
                                                                        "text-xl font-black italic tracking-tighter leading-none",
                                                                        (attempt.percentage ?? 0) >= (exam.passing_score ?? 0) ? "text-emerald-600" : "text-rose-600"
                                                                    )}>
                                                                        {attempt.percentage}%
                                                                    </p>
                                                                    {attempt.penalty_points && (
                                                                        <Badge variant="destructive" className="h-4 px-1 text-[8px] font-black uppercase tracking-tighter bg-rose-600 animate-pulse">
                                                                            -{attempt.penalty_points}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase leading-none">
                                                                    {attempt.score} / {attempt.total_points} PTS
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-end gap-2 text-slate-300">
                                                                <ClipboardCheckIcon className="size-4 opacity-50" />
                                                                <p className="text-xl font-black italic tracking-tighter">—</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex size-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:translate-x-2 shrink-0">
                                                        <ArrowRightIcon className="size-5" />
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <div className="mb-6 flex size-24 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
                                        <ClipboardCheckIcon className="size-12 text-slate-300" />
                                    </div>
                                    <p className="text-xl font-black text-slate-400 uppercase tracking-tighter">{t('common.noResults')}</p>
                                    <p className="text-sm font-bold text-slate-400/60 mt-1 uppercase tracking-widest italic">{t('grading.empty')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Floating Bulk Action Bar */}
            <div className={cn(
                "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 transform",
                selectedIds.length > 0 ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-95 pointer-events-none"
            )}>
                <div className="bg-slate-900 text-white rounded-3xl p-4 shadow-2xl flex items-center gap-6 border border-white/10 backdrop-blur-xl ring-1 ring-white/20">
                    <div className="flex items-center gap-3 pl-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500 shadow-lg shadow-blue-500/40">
                            <span className="text-sm font-black tracking-tight">{selectedIds.length}</span>
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
                                {t('common.filters').split(':')[0]}
                            </p>
                            <p className="text-xs font-bold leading-none uppercase">
                                {t('grading.bulk.selected', [selectedIds.length])}
                            </p>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-white/10" />

                    <div className="flex gap-2 pr-2">
                        <Button 
                            onClick={handleBulkGrade}
                            disabled={isBulkGrading}
                            className="rounded-2xl bg-white text-slate-900 border-none hover:bg-white/90 font-black uppercase tracking-widest text-[10px] h-11 px-6 shadow-xl transition-all hover:scale-[1.02]"
                        >
                            {isBulkGrading ? t('common.loading') : (
                                <>
                                    <PlayIcon className="size-4 mr-2 text-blue-600 fill-blue-600" />
                                    {t('grading.bulk.grade_selected')}
                                </>
                            )}
                        </Button>
                        <Button 
                            onClick={handleBulkPublish}
                            disabled={isBulkPublishing}
                            className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 border-none font-black uppercase tracking-widest text-[10px] h-11 px-6 shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                        >
                            {isBulkPublishing ? t('common.loading') : (
                                <>
                                    <EyeIcon className="size-4 mr-2" />
                                    {t('grading.bulk.publish_selected')}
                                </>
                            )}
                        </Button>
                        <Button 
                            variant="ghost" 
                            onClick={() => setSelectedIds([])}
                            className="rounded-2xl text-white/60 hover:text-white hover:bg-white/5 font-bold text-xs h-11 px-4"
                        >
                            {t('common.cancel')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Violation Details Sheet */}
            <Sheet open={!!selectedViolations} onOpenChange={(open) => !open && setSelectedViolations(null)}>
                <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto border-l-rose-100 flex flex-col p-0 bg-white/95 backdrop-blur-xl">
                    <div className="p-8 border-b bg-rose-50/10 relative overflow-hidden shrink-0">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="flex size-14 items-center justify-center rounded-[2rem] bg-rose-600 text-white shadow-xl shadow-rose-600/20 animate-pulse">
                                <AlertTriangleIcon className="size-7" />
                            </div>
                            <div>
                                <SheetTitle className="text-3xl font-black underline decoration-rose-600 decoration-4 underline-offset-4 tracking-tighter uppercase italic">{t('grading.review.sidebar.violations')}</SheetTitle>
                                <SheetDescription className="font-bold uppercase tracking-widest text-[10px] text-slate-500 mt-2">
                                    {selectedViolations?.student.name} • Attempt #{selectedViolations?.attempt_number}
                                </SheetDescription>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-8 space-y-6 overflow-y-auto">
                        {selectedViolations && selectedViolations.violation_logs?.length > 0 ? (
                            <div className="grid gap-4">
                                {selectedViolations.violation_logs.map((log) => (
                                    <div key={log.id} className="group relative rounded-3xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-rose-100 transition-all duration-300 overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-600" />
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex flex-col gap-1">
                                                <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none uppercase text-[9px] font-black tracking-widest w-fit rounded-lg px-2 py-0.5">
                                                    {t(`violation.${log.violation_type}` as any)}
                                                </Badge>
                                                <h4 className="text-lg font-black tracking-tight text-slate-900 mt-1">
                                                    {t(`violation.${log.violation_type}` as any)}
                                                </h4>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-300 uppercase shrink-0 bg-slate-50 px-2 py-1 rounded-lg">
                                                {formatDate(log.occurred_at).split(',')[1]}
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-500 leading-relaxed italic">
                                            {t(`violation.${log.violation_type}.desc` as any)}
                                        </p>
                                        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600">
                                            {log.details || 'System capture: Standard focus breach detected.'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                                <CheckCircle2Icon className="size-16 text-emerald-500 mb-4" />
                                <p className="text-xl font-black text-slate-400 uppercase tracking-tighter">PÉRIMITRE SÉCURISÉ</p>
                                <p className="text-xs font-bold text-slate-400/60 uppercase tracking-widest italic mt-2">No alerts detected for this session</p>
                            </div>
                        )}
                    </div>

                    <div className="p-8 border-t bg-slate-50/50 shrink-0">
                        <Button asChild className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/10 font-black uppercase tracking-widest transition-all hover:scale-[1.02] group">
                            <Link href={grading.show(selectedViolations?.id || 0).url}>
                                {t('grading.action.review')} & Penalize
                                <ArrowRightIcon className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </AppLayout>
    );
}
