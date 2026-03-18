import { Head, router, usePoll } from '@inertiajs/react';
import { useState } from 'react';
import {
    AlertTriangleIcon,
    CheckCircleIcon,
    ClockIcon,
    RefreshCwIcon,
    UsersIcon,
    XCircleIcon,
    RotateCcwIcon,
    TrashIcon,
    UserIcon,
    ShieldAlertIcon,
    MoreVerticalIcon,
    HistoryIcon,
    ActivityIcon,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type {
    BreadcrumbItem,
    Exam,
    ExamAttempt,
    User,
    ViolationLog,
} from '@/types';
import { useLanguage, type TranslationKey } from '@/hooks/use-language';

interface ActiveStudent {
    user: User;
    attempt: ExamAttempt & {
        violation_logs: ViolationLog[];
        answers_count: number;
    };
    last_activity: string;
}

interface ViolationWithStudent extends ViolationLog {
    attempt?: {
        student?: {
            name: string;
        };
    };
}

interface Props {
    exam: Exam & { questions_count: number };
    activeStudents: ActiveStudent[];
    attempts: (ExamAttempt & {
        student: { id: number; name: string; email: string };
        answers_count: number;
    })[];
    inProgressCount: number;
    completedCount: number;
    notStartedCount: number;
    totalAssigned: number;
    recentViolations: ViolationWithStudent[];
}

export default function MonitorExam({
    exam,
    activeStudents,
    attempts,
    inProgressCount,
    completedCount,
    notStartedCount,
    totalAssigned,
    recentViolations,
}: Props) {
    const { t } = useLanguage();
    const [refreshing, setRefreshing] = useState(false);
    const [isPolling, setIsPolling] = useState(true);

    // Inertia v2 Polling
    usePoll(10000, {
        only: [
            'activeStudents',
            'attempts',
            'inProgressCount',
            'completedCount',
            'notStartedCount',
            'recentViolations',
        ],
    }, {
        keepScroll: true,
        autoStart: isPolling
    });

    const handleRefresh = () => {
        setRefreshing(true);
        router.reload({
            only: [
                'activeStudents',
                'attempts',
                'inProgressCount',
                'completedCount',
                'notStartedCount',
                'recentViolations',
            ],
            onFinish: () => setRefreshing(false),
        });
    };

    const handleResetAttempt = (attemptId: number) => {
        if (confirm(t('monitor.action.resetDesc'))) {
            router.post(`/exams/${exam.id}/attempts/${attemptId}/reset`);
        }
    };

    const handleDeleteAttempt = (attemptId: number) => {
        if (confirm(t('monitor.action.deleteDesc'))) {
            router.delete(`/exams/${exam.id}/attempts/${attemptId}`);
        }
    };

    const handleResetViolations = (attemptId: number) => {
        if (confirm(t('monitor.action.clearViolationsDesc'))) {
            router.post(`/exams/${exam.id}/attempts/${attemptId}/reset-violations`);
        }
    };

    const handleForceSubmit = (attemptId: number) => {
        if (confirm('Are you sure you want to force submit this exam? The student will not be able to continue.')) {
            router.post(`/exams/${exam.id}/attempts/${attemptId}/force-submit`);
        }
    };

    const formatDateTime = (date: string) => new Date(date).toLocaleString();

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            in_progress: 'default',
            submitted: 'secondary',
            graded: 'outline',
            auto_submitted: 'destructive',
        };
        return variants[status] || 'secondary';
    };

    const getTimeAgo = (date: string) => {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return `${seconds}${t('monitor.secShort')} ${t('monitor.ago')}`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}${t('monitor.minShort')} ${t('monitor.ago')}`;
        return `${Math.floor(seconds / 3600)}${t('monitor.hourShort')} ${t('monitor.ago')}`;
    };

    const getViolationLabel = (type: string) => {
        return t(`violation.${type}` as TranslationKey) || type.replace(/_/g, ' ');
    };

    const getViolationDescription = (type: string) => {
        return t(`violation.${type}.desc` as TranslationKey) || '';
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('common.dashboard'), href: '/dashboard' },
        { title: t('dashboard.myExams'), href: '/exams' },
        { title: exam.title, href: `/exams/${exam.id}` },
        { title: t('monitor.title'), href: `/exams/${exam.id}/monitor` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('monitor.title')}: ${exam.title}`} />
            <div className="flex flex-col gap-8 p-8 max-w-(--breakpoint-2xl) mx-auto w-full">
                {/* Modern Header */}
                <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground shadow-2xl">
                    <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-white/20 p-2 backdrop-blur-md">
                                    <ActivityIcon className="size-6" />
                                </div>
                                <Badge className="bg-white/20 hover:bg-white/30 border-none px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
                                    {t('monitor.live')}
                                </Badge>
                            </div>
                            <h1 className="text-4xl font-black tracking-tight">{exam.title}</h1>
                            <p className="text-primary-foreground/80 font-medium text-lg">
                                {t('monitor.subtitle')}
                            </p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-xl border border-white/10 shadow-inner">
                                <div className="relative flex size-2.5 shrink-0">
                                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${isPolling ? 'bg-emerald-400' : 'bg-white/40'}`}></span>
                                    <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isPolling ? 'bg-emerald-400' : 'bg-white/40'}`}></span>
                                </div>
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={isPolling}
                                        onChange={(e) => setIsPolling(e.target.checked)}
                                        className="hidden"
                                    />
                                    <span className="text-xs font-black uppercase tracking-widest text-white/90">
                                        {t('monitor.autoRefresh')}
                                    </span>
                                </label>
                            </div>
                            <Button
                                variant="secondary"
                                size="lg"
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="rounded-2xl shadow-lg bg-white text-primary hover:bg-white/90 font-bold px-6"
                            >
                                <RefreshCwIcon className={`mr-2 size-5 ${refreshing ? 'animate-spin' : ''}`} />
                                {t('monitor.refresh')}
                            </Button>
                        </div>
                    </div>
                    
                    {/* Decorative Elements */}
                    <div className="absolute -right-20 -top-20 size-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute -left-20 -bottom-20 size-64 rounded-full bg-black/10 blur-3xl" />
                </div>

                {/* Stats Grid - Unified Blue Style */}
                <div className="grid gap-6 sm:grid-cols-4">
                    {[
                        { label: t('monitor.totalAssigned'), value: totalAssigned, icon: UsersIcon, color: 'primary' },
                        { label: t('monitor.inProgress'), value: inProgressCount, icon: ClockIcon, color: 'primary' },
                        { label: t('monitor.completed'), value: completedCount, icon: CheckCircleIcon, color: 'primary' },
                        { label: t('monitor.notStarted'), value: notStartedCount, icon: XCircleIcon, color: 'primary' },
                    ].map((stat, i) => (
                        <Card key={i} className="group relative overflow-hidden border-none bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 transition-all hover:shadow-md hover:-translate-y-1 rounded-3xl">
                            <CardContent className="p-6">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="rounded-2xl bg-primary/5 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                                            <stat.icon className="size-6" />
                                        </div>
                                        <p className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">{stat.value}</p>
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">
                                        {stat.label}
                                    </p>
                                </div>
                            </CardContent>
                            <div className="absolute bottom-0 left-0 h-1.5 w-full bg-primary/10 transition-all group-hover:bg-primary" />
                        </Card>
                    ))}
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Active Students - Primary Blue Theme */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                                {t('monitor.activeStudents')}
                                <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-black">
                                    {inProgressCount}
                                </span>
                            </h2>
                        </div>

                        {activeStudents.length > 0 ? (
                            <div className="grid gap-6 sm:grid-cols-2">
                                {activeStudents.map(({ user, attempt, last_activity }) => {
                                    const progress = Math.round((attempt.answers_count / exam.questions_count) * 100);
                                    const violations = attempt.violation_logs?.length || 0;
                                    const isCritical = violations >= 5;

                                    return (
                                        <Card key={attempt.id} className={`group overflow-hidden border-none bg-white dark:bg-slate-900 shadow-sm ring-1 transition-all hover:shadow-xl rounded-3xl ${isCritical ? 'ring-destructive/30' : 'ring-slate-200 dark:ring-slate-800'}`}>
                                            <CardHeader className="p-6 pb-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div className="relative">
                                                            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/5 text-primary font-black text-xl shadow-inner">
                                                                {user.name.charAt(0)}
                                                            </div>
                                                            <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-4 border-white dark:border-slate-900 bg-emerald-500 shadow-sm">
                                                                <div className="size-1.5 animate-pulse rounded-full bg-white" />
                                                            </div>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <CardTitle className="text-lg font-black truncate text-slate-900 dark:text-white">{user.name}</CardTitle>
                                                            <CardDescription className="text-xs font-bold text-muted-foreground truncate">{user.email}</CardDescription>
                                                        </div>
                                                    </div>
                                                    
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="size-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                                                                <MoreVerticalIcon className="size-5" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-none ring-1 ring-slate-200 dark:ring-slate-800">
                                                            <DropdownMenuLabel className="px-3 py-2 text-xs font-black uppercase tracking-widest text-muted-foreground">Student Controls</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => handleForceSubmit(attempt.id)} className="rounded-xl px-3 py-2 text-destructive focus:bg-destructive/10 focus:text-destructive font-bold">
                                                                <XCircleIcon className="mr-2 size-4" />
                                                                {t('monitor.action.forceSubmit')}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="my-2" />
                                                            <DropdownMenuItem onClick={() => handleResetViolations(attempt.id)} className="rounded-xl px-3 py-2 font-bold">
                                                                <ShieldAlertIcon className="mr-2 size-4 text-primary" />
                                                                {t('monitor.action.clearViolations')}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-6 pt-0 space-y-6">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-muted-foreground/80">
                                                        <span>{t('monitor.answered')}</span>
                                                        <span className="text-primary">{progress}%</span>
                                                    </div>
                                                    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                        <div 
                                                            className="h-full bg-primary transition-all duration-1000 ease-out"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-[10px] font-black text-muted-foreground/60 text-right tracking-widest">
                                                        {attempt.answers_count} / {exam.questions_count}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex gap-2">
                                                        {violations > 0 ? (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Badge variant="destructive" className="rounded-xl gap-2 px-3 py-1.5 shadow-lg shadow-destructive/20 border-none">
                                                                            <AlertTriangleIcon className="size-3.5" />
                                                                            <span className="font-black text-xs tracking-tight">{violations}</span>
                                                                        </Badge>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className="p-0 border-none shadow-2xl rounded-2xl overflow-hidden">
                                                                        <div className="p-4 bg-slate-900 text-white w-64 space-y-3">
                                                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Security Events</p>
                                                                            <div className="space-y-2.5">
                                                                                {attempt.violation_logs.slice(0, 3).map((v) => (
                                                                                    <div key={v.id} className="flex gap-3 text-[11px] border-l-2 border-red-500 pl-3 py-0.5">
                                                                                        <div className="space-y-0.5">
                                                                                            <p className="font-black tracking-tight text-white">{getViolationLabel(v.violation_type)}</p>
                                                                                            <p className="text-slate-400 font-medium leading-tight">{v.details}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        ) : (
                                                            <Badge className="rounded-xl gap-2 border-none bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 font-black text-xs">
                                                                <CheckCircleIcon className="size-3.5" />
                                                                <span>Secure</span>
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                                                        <HistoryIcon className="size-3.5" />
                                                        {getTimeAgo(last_activity || attempt.started_at)}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <Card className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 py-24 text-center">
                                <CardContent className="space-y-4">
                                    <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700">
                                        <UsersIcon className="size-8 text-slate-300" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-lg font-black tracking-tight text-slate-900 dark:text-white">{t('monitor.noActive')}</p>
                                        <p className="text-sm text-muted-foreground font-medium max-w-xs mx-auto">New attempts will automatically appear here as students join.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Activity Feed - Clean Blue Styled List */}
                    <div className="lg:col-span-4 space-y-6">
                        <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <ShieldAlertIcon className="size-6 text-primary" />
                            {t('monitor.recentViolations')}
                        </h2>

                        <Card className="h-[750px] flex flex-col border-none bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 rounded-3xl overflow-hidden">
                            <CardHeader className="px-6 py-5 border-b bg-slate-50/50 dark:bg-slate-800/20">
                                <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">
                                    {t('monitor.recentViolationsDesc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-hidden">
                                {recentViolations.length > 0 ? (
                                    <div className="h-full overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                        {recentViolations.map((violation) => {
                                            const isHighSeverity = violation.severity === 'critical' || violation.severity === 'high';
                                            return (
                                                <div
                                                    key={violation.id}
                                                    className={`group relative flex flex-col gap-2 rounded-2xl border p-4 transition-all hover:scale-[1.02] ${
                                                        isHighSeverity
                                                            ? 'bg-destructive/5 border-destructive/10'
                                                            : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={`size-2.5 rounded-full shadow-sm ${
                                                                violation.severity === 'critical' ? 'bg-red-600' :
                                                                violation.severity === 'high' ? 'bg-orange-500' :
                                                                'bg-amber-400'
                                                            }`} />
                                                            <span className={`text-[11px] font-black tracking-widest uppercase ${isHighSeverity ? 'text-destructive' : 'text-slate-900 dark:text-white'}`}>
                                                                {getViolationLabel(violation.violation_type)}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] font-black text-muted-foreground/60 tabular-nums">
                                                            {new Date(violation.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>

                                                    <p className="text-[11px] leading-relaxed font-medium text-slate-600 dark:text-slate-400 pl-5">
                                                        {getViolationDescription(violation.violation_type)}
                                                    </p>

                                                    <div className="mt-1 flex items-center justify-between pl-5 border-t border-slate-200/50 dark:border-slate-700/50 pt-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="size-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[8px] font-black">
                                                                {violation.attempt?.student?.name.charAt(0)}
                                                            </div>
                                                            <span className="text-[10px] font-black tracking-tight truncate max-w-[140px]">
                                                                {violation.attempt?.student?.name}
                                                            </span>
                                                        </div>
                                                        {violation.duration_seconds > 0 && (
                                                            <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-black border-slate-200 rounded-lg">
                                                                {violation.duration_seconds}s
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center p-12 text-center gap-4">
                                        <div className="rounded-3xl bg-slate-50 dark:bg-slate-800 p-4">
                                            <ShieldAlertIcon className="size-10 text-slate-200 dark:text-slate-700" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{t('monitor.noViolations')}</p>
                                            <p className="text-xs text-slate-400/60 font-medium">Monitoring is active and secure.</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Comprehensive Student List */}
                <div className="mt-8 space-y-6">
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                        <HistoryIcon className="size-6 text-primary" />
                        {t('monitor.studentAttempts')}
                    </h2>

                    <Card className="border-none bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 rounded-[2rem] overflow-hidden">
                        <CardContent className="p-0">
                            {attempts.length === 0 ? (
                                <div className="py-24 text-center space-y-4">
                                    <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-100 dark:ring-slate-700">
                                        <HistoryIcon className="size-8 text-slate-200" />
                                    </div>
                                    <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{t('monitor.noAttempts')}</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b bg-slate-50/50 dark:bg-slate-800/20 text-left">
                                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Student</th>
                                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Status</th>
                                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Completion</th>
                                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Security</th>
                                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Started At</th>
                                                <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                            {attempts.map((attempt) => (
                                                <tr key={attempt.id} className="group hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-primary font-black text-sm">
                                                                {attempt.student?.name.charAt(0)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-black text-sm text-slate-900 dark:text-white truncate tracking-tight">{attempt.student?.name}</p>
                                                                <p className="text-[10px] font-bold text-muted-foreground/70 truncate tracking-wide">{attempt.student?.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <Badge variant={getStatusBadge(attempt.status)} className="font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg border-none">
                                                            {attempt.status.replace(/_/g, ' ')}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-primary"
                                                                        style={{ width: `${Math.round((attempt.answers_count / exam.questions_count) * 100)}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-[10px] font-black tracking-widest tabular-nums">
                                                                    {Math.round((attempt.answers_count / exam.questions_count) * 100)}%
                                                                </span>
                                                            </div>
                                                            <p className="text-[9px] font-black text-muted-foreground/50 tracking-widest text-right">
                                                                {attempt.answers_count} / {exam.questions_count}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        {attempt.violation_count > 0 ? (
                                                            <Badge variant="destructive" className="gap-2 font-black text-[10px] px-2.5 py-1 rounded-lg shadow-sm shadow-destructive/20 border-none">
                                                                <AlertTriangleIcon className="size-3" />
                                                                {attempt.violation_count}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="border-slate-200 text-slate-400 text-[10px] font-black px-2.5 py-1 rounded-lg">None</Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-5 text-xs font-bold text-muted-foreground/80 tabular-nums">
                                                        {formatDateTime(attempt.started_at)}
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => handleResetAttempt(attempt.id)}
                                                                            className="size-9 rounded-xl hover:text-primary hover:bg-primary/10"
                                                                        >
                                                                            <RotateCcwIcon className="size-4.5" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>{t('monitor.action.reset')}</TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>

                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => handleResetViolations(attempt.id)}
                                                                            className="size-9 rounded-xl hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                                                        >
                                                                            <ShieldAlertIcon className="size-4.5" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>{t('monitor.action.clearViolations')}</TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>

                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => handleDeleteAttempt(attempt.id)}
                                                                            className="size-9 rounded-xl hover:text-destructive hover:bg-destructive/10"
                                                                        >
                                                                            <TrashIcon className="size-4.5" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>{t('monitor.action.delete')}</TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1e293b;
                }
            ` }} />
        </AppLayout>
    );
}
