import { Head, router, usePoll } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import {
    AlertTriangleIcon,
    CheckCircleIcon,
    ClockIcon,
    RefreshCwIcon,
    UsersIcon,
    XCircleIcon,
    RotateCcwIcon,
    TrashIcon,
    ShieldAlertIcon,
    MoreVerticalIcon,
    HistoryIcon,
    ActivityIcon,
    PauseIcon,
    PlayIcon,
    SendIcon,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLanguageStandalone } from '@/hooks/use-language';
import type { TranslationKey } from '@/hooks/use-language';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type {
    BreadcrumbItem,
    Exam,
    ExamAttempt,
    User,
    ViolationLog,
} from '@/types';

interface ActiveStudent {
    user: User;
    attempt: ExamAttempt & {
        violation_logs: ViolationLog[];
        answers_count: number;
        remaining_time: number;
        is_paused: boolean;
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

type ConfirmAction = 'reset' | 'delete' | 'clear_violations' | 'force_submit';

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
    const { t } = useLanguageStandalone();
    const [refreshing, setRefreshing] = useState(false);
    const [isPolling, setIsPolling] = useState(true);
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    // Dialog States
    const [confirmingAction, setConfirmingAction] = useState<{ type: ConfirmAction; id: number } | null>(null);
    const [extendingTime, setExtendingTime] = useState<{ id: number; minutes: string } | null>(null);

    // Real-time Live Proctoring Events
    useEcho(
        `exam-monitoring.${exam.id}`,
        'ExamViolationLogged',
        () => {
            router.reload({
                only: ['recentViolations', 'activeStudents', 'attempts'],
            });
        }
    );

    useEcho(
        `exam-monitoring.${exam.id}`,
        'ExamAttemptStatusChanged',
        () => {
            router.reload({
                only: [
                    'activeStudents', 
                    'attempts', 
                    'inProgressCount', 
                    'completedCount', 
                    'notStartedCount'
                ],
            });
        }
    );

    useEcho(
        `exam-monitoring.${exam.id}`,
        'ExamAnswerSaved',
        () => {
            router.reload({
                only: ['attempts', 'activeStudents'],
            });
        }
    );

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 10000); // More frequent updates for a "live" feel
        return () => clearInterval(interval);
    }, []);

    const handleBroadcast = (e: React.FormEvent) => {
        e.preventDefault();
        if (!broadcastMessage.trim()) return;

        setIsBroadcasting(true);
        router.post(`/exams/${exam.id}/broadcast`, {
            message: broadcastMessage
        }, {
            onSuccess: () => {
                setBroadcastMessage('');
                toast.success(t('monitor.broadcast.success'));
            },
            onFinish: () => setIsBroadcasting(false)
        });
    };

    // Inertia v2 Polling
    usePoll(15000, {
        only: [
            'activeStudents',
            'attempts',
            'inProgressCount',
            'completedCount',
            'notStartedCount',
            'recentViolations',
        ],
    }, {
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

    const executeAction = () => {
        if (!confirmingAction) return;
        
        const { type, id } = confirmingAction;
        
        if (type === 'reset') {
            router.post(`/exams/${exam.id}/attempts/${id}/reset`, {}, {
                onSuccess: () => toast.success('Attempt reset successfully')
            });
        } else if (type === 'delete') {
            router.delete(`/exams/${exam.id}/attempts/${id}`, {
                onSuccess: () => toast.success('Attempt deleted permanently')
            });
        } else if (type === 'clear_violations') {
            router.post(`/exams/${exam.id}/attempts/${id}/reset-violations`, {}, {
                onSuccess: () => toast.success('Violations cleared')
            });
        } else if (type === 'force_submit') {
            router.post(`/exams/${exam.id}/attempts/${id}/force-submit`, {}, {
                onSuccess: () => toast.success('Exam forced hand-in')
            });
        }
        
        setConfirmingAction(null);
    };

    const executeExtendTime = () => {
        if (!extendingTime) return;
        const minutes = parseInt(extendingTime.minutes);
        if (isNaN(minutes) || minutes <= 0) return;

        router.post(`/exams/${exam.id}/attempts/${extendingTime.id}/extend-time`, {
            minutes: minutes
        }, {
            onSuccess: () => toast.success(`Extended by ${minutes} minutes`)
        });
        setExtendingTime(null);
    };

    const handleTogglePause = (attemptId: number) => {
        router.post(`/exams/${exam.id}/attempts/${attemptId}/toggle-pause`);
    };

    const formatDateTime = (date: string) => {
        return new Date(date).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            in_progress: 'default',
            submitted: 'secondary',
            graded: 'outline',
            auto_submitted: 'destructive',
        };
        return variants[status] || 'secondary';
    };

    const getTimeAgo = useCallback((date: string) => {
        const seconds = Math.max(0, Math.floor((currentTime - new Date(date).getTime()) / 1000));
        if (seconds < 60) return `${seconds}${t('monitor.secShort')} ${t('monitor.ago')}`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}${t('monitor.minShort')} ${t('monitor.ago')}`;
        return `${Math.floor(seconds / 3600)}${t('monitor.hourShort')} ${t('monitor.ago')}`;
    }, [currentTime, t]);

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
            <div className="flex flex-col gap-8 p-4 md:p-8 max-w-(--breakpoint-2xl) mx-auto w-full">
                
                {/* Modern Header — Glassmorphic Control Panel */}
                <div className="relative overflow-hidden rounded-[2rem] bg-indigo-600 p-8 text-white shadow-2xl">
                    <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-white/20 p-2.5 backdrop-blur-xl shadow-inner">
                                    <ActivityIcon className="size-6 text-indigo-100" />
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-md">
                                    <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100 italic">
                                        {t('monitor.live')}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none mb-2">{exam.title}</h1>
                                <p className="text-indigo-100/70 font-bold text-lg max-w-xl">
                                    {t('monitor.subtitle')}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-4 rounded-3xl bg-white/10 px-6 py-4 backdrop-blur-2xl border border-white/10 shadow-xl group transition-all hover:bg-white/15">
                                <span className={cn(
                                    "text-xs font-black uppercase tracking-widest transition-colors",
                                    isPolling ? "text-indigo-100" : "text-white/40"
                                )}>
                                    {t('monitor.autoRefresh')}
                                </span>
                                <Switch 
                                    checked={isPolling} 
                                    onCheckedChange={setIsPolling}
                                    className="data-[state=checked]:bg-emerald-500"
                                />
                            </div>
                            <Button
                                variant="secondary"
                                size="lg"
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="h-14 rounded-3xl shadow-2xl bg-white text-indigo-600 hover:bg-indigo-50 font-black px-8 active:scale-95 transition-all"
                            >
                                <RefreshCwIcon className={cn("mr-3 size-5", refreshing && "animate-spin")} />
                                {t('monitor.refresh')}
                            </Button>
                        </div>
                    </div>
                    
                    {/* Abstract Shapes */}
                    <div className="absolute -right-20 -top-20 size-80 rounded-full bg-indigo-400/20 blur-[100px]" />
                    <div className="absolute -left-20 -bottom-20 size-80 rounded-full bg-blue-400/10 blur-[100px]" />
                </div>

                {/* Stats Dashboard */}
                <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
                    {[
                        { label: t('monitor.totalAssigned'), value: totalAssigned, icon: UsersIcon, bg: 'bg-indigo-50 dark:bg-indigo-950/30', color: 'text-indigo-600 dark:text-indigo-400' },
                        { label: t('monitor.inProgress'), value: inProgressCount, icon: ClockIcon, bg: 'bg-emerald-50 dark:bg-emerald-950/30', color: 'text-emerald-600 dark:text-emerald-400' },
                        { label: t('monitor.completed'), value: completedCount, icon: CheckCircleIcon, bg: 'bg-blue-50 dark:bg-blue-950/30', color: 'text-blue-600 dark:text-blue-400' },
                        { label: t('monitor.notStarted'), value: notStartedCount, icon: XCircleIcon, bg: 'bg-slate-50 dark:bg-slate-900', color: 'text-slate-500' },
                    ].map((stat, i) => (
                        <Card key={i} className="group border-none bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 rounded-[2rem] overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
                            <CardContent className="p-6">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className={cn("rounded-2xl p-3 shadow-inner", stat.bg, stat.color)}>
                                            <stat.icon className="size-6" />
                                        </div>
                                        <p className="text-4xl font-black tracking-tighter tabular-nums">{stat.value}</p>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">
                                        {stat.label}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Broadcast Hub */}
                <Card className="rounded-[2.5rem] border-none shadow-2xl bg-indigo-950 text-white overflow-hidden relative group">
                    <div className="absolute -top-12 -right-12 p-8 opacity-5 transition-transform group-hover:rotate-12 duration-700">
                        <SendIcon className="size-48" />
                    </div>
                    <CardContent className="p-8 md:p-10 relative z-10">
                        <div className="flex flex-col lg:flex-row items-center gap-10">
                            <div className="flex-1 space-y-3">
                                <Badge className="bg-indigo-500/20 text-indigo-300 border-none font-black tracking-[0.2em] px-3 py-1 mb-2">
                                    {t('monitor.broadcast.title')}
                                </Badge>
                                <h3 className="text-3xl font-black tracking-tight leading-tight">
                                    {t('monitor.broadcast.subtitle')}
                                </h3>
                                <p className="text-indigo-300/60 text-xs font-bold uppercase tracking-widest">
                                    {t('monitor.broadcast.placeholder')}
                                </p>
                            </div>
                            
                            <form onSubmit={handleBroadcast} className="flex-1 w-full flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Input
                                        placeholder={t('monitor.broadcast.placeholder')}
                                        value={broadcastMessage}
                                        onChange={(e) => setBroadcastMessage(e.target.value)}
                                        maxLength={500}
                                        className="h-16 bg-white/5 border-white/10 text-white placeholder:text-indigo-300/30 rounded-2xl pl-6 pr-14 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 text-lg transition-all"
                                    />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-indigo-500 font-black text-[10px] tabular-nums">
                                        {broadcastMessage.length}/500
                                    </div>
                                </div>
                                <Button 
                                    disabled={isBroadcasting || !broadcastMessage.trim()}
                                    className="h-16 rounded-2xl px-10 font-black uppercase tracking-widest text-xs bg-white text-indigo-950 hover:bg-indigo-50 shadow-xl shadow-indigo-900/40 active:scale-95 transition-all"
                                >
                                    {isBroadcasting ? t('common.loading') : t('monitor.broadcast.button')}
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Live Student Feed */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3 italic">
                                {t('monitor.activeStudents')}
                                <span className={cn(
                                    "flex size-8 items-center justify-center rounded-xl font-black text-sm transition-all",
                                    inProgressCount > 0 ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-slate-100 text-slate-400"
                                )}>
                                    {inProgressCount}
                                </span>
                            </h2>
                        </div>

                        {activeStudents.length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2">
                                {activeStudents.map(({ user, attempt, last_activity }) => {
                                    const progress = Math.round((attempt.answers_count / (exam.questions_count || 1)) * 100);
                                    const violations = attempt.violation_logs?.length || 0;
                                    const isCritical = violations >= 5;

                                    return (
                                        <Card key={attempt.id} className={cn(
                                            "group relative overflow-hidden border-none bg-white dark:bg-slate-900 shadow-sm ring-1 transition-all hover:shadow-2xl rounded-[2.5rem]",
                                            isCritical ? "ring-red-500/30" : "ring-slate-200 dark:ring-slate-800 hover:ring-indigo-500/20"
                                        )}>
                                            <CardHeader className="p-6 md:p-8 pb-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-5 min-w-0">
                                                        <div className={cn(
                                                            "flex size-16 shrink-0 items-center justify-center rounded-[1.25rem] font-black text-2xl shadow-inner transition-colors",
                                                            isCritical ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                                                        )}>
                                                            {user.name.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <CardTitle className="text-xl font-black truncate tracking-tight mb-0.5">{user.name}</CardTitle>
                                                            <CardDescription className="text-xs font-bold text-muted-foreground/70 truncate flex items-center gap-2">
                                                                <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                {user.email}
                                                            </CardDescription>
                                                        </div>
                                                    </div>
                                                    
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="size-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                                                                <MoreVerticalIcon className="size-5 text-slate-400" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-none ring-1 ring-slate-200 dark:ring-slate-800">
                                                            <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Session Management</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => handleTogglePause(attempt.id)} className="rounded-xl px-3 py-2.5 font-bold cursor-pointer">
                                                                {attempt.is_paused ? (
                                                                    <PlayIcon className="mr-3 size-4 text-emerald-500" />
                                                                ) : (
                                                                    <PauseIcon className="mr-3 size-4 text-amber-500" />
                                                                )}
                                                                {attempt.is_paused ? t('monitor.action.resume') : t('monitor.action.pause')}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                onClick={() => setExtendingTime({ id: attempt.id, minutes: '10' })} 
                                                                className="rounded-xl px-3 py-2.5 font-bold cursor-pointer"
                                                            >
                                                                <ClockIcon className="mr-3 size-4 text-indigo-500" />
                                                                {t('monitor.action.extend_time')}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="my-2 opacity-50" />
                                                            <DropdownMenuItem 
                                                                onClick={() => setConfirmingAction({ type: 'force_submit', id: attempt.id })} 
                                                                className="rounded-xl px-3 py-2.5 text-red-600 focus:bg-red-50 focus:text-red-700 font-black flex items-center gap-3 cursor-pointer"
                                                            >
                                                                <XCircleIcon className="size-4" />
                                                                {t('monitor.action.forceSubmit')}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                onClick={() => setConfirmingAction({ type: 'clear_violations', id: attempt.id })}
                                                                className="rounded-xl px-3 py-2.5 font-bold cursor-pointer"
                                                            >
                                                                <ShieldAlertIcon className="mr-3 size-4 text-indigo-400" />
                                                                {t('monitor.action.clearViolations')}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </CardHeader>
                                            
                                            <CardContent className="p-6 md:p-8 pt-0 space-y-8">
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-end">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{t('monitor.answered')}</p>
                                                        <p className="text-xl font-black tabular-nums tracking-tighter">{progress}%</p>
                                                    </div>
                                                    <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 p-0.5">
                                                        <div 
                                                            className={cn(
                                                                "h-full rounded-full transition-all duration-1000 ease-out shadow-sm",
                                                                isCritical ? "bg-red-500 shadow-red-500/20" : "bg-indigo-600 shadow-indigo-600/20"
                                                            )}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-[10px] font-bold text-muted-foreground/50 tracking-widest text-right">
                                                        {attempt.answers_count} / {exam.questions_count}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex gap-2">
                                                        {violations > 0 ? (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Badge variant="destructive" className="rounded-xl gap-2.5 px-3 py-2 shadow-xl shadow-red-500/20 border-none animate-in fade-in zoom-in duration-300">
                                                                            <AlertTriangleIcon className="size-4" />
                                                                            <span className="font-black text-sm tracking-tight">{violations}</span>
                                                                        </Badge>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className="p-0 border-none shadow-3xl rounded-[1.5rem] overflow-hidden">
                                                                        <div className="p-5 bg-indigo-950 text-white w-72 space-y-4">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="size-1.5 rounded-full bg-red-400 animate-pulse" />
                                                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 italic">Security Alerts</p>
                                                                            </div>
                                                                            <div className="space-y-3">
                                                                                {attempt.violation_logs.slice(0, 3).map((v) => (
                                                                                    <div key={v.id} className="group/item flex gap-4 text-[11px] border-l-2 border-red-500 pl-4 py-1">
                                                                                        <div className="space-y-0.5">
                                                                                            <p className="font-black tracking-tight text-white group-hover/item:text-red-300 transition-colors uppercase">{getViolationLabel(v.violation_type)}</p>
                                                                                            <p className="text-indigo-100/50 font-medium leading-relaxed italic">{v.details}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                                {violations > 3 && (
                                                                                    <p className="text-center text-[10px] font-black text-indigo-400 pt-1">+ {violations - 3} more incidents</p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        ) : (
                                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/30">
                                                                <CheckCircleIcon className="size-3.5" />
                                                                <span>Secure</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic">
                                                        <ActivityIcon className="size-3.5" />
                                                        {getTimeAgo(last_activity || attempt.started_at)}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <Card className="rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 py-32 text-center group cursor-default shadow-inner">
                                <CardContent className="space-y-6">
                                    <div className="mx-auto flex size-24 items-center justify-center rounded-[2rem] bg-white dark:bg-slate-800 shadow-2xl ring-1 ring-slate-100 dark:ring-slate-700 transition-transform group-hover:scale-110 duration-500">
                                        <UsersIcon className="size-10 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">{t('monitor.noActive')}</p>
                                        <p className="text-sm text-muted-foreground max-w-sm mx-auto font-medium">Monitoring is currently active. Any new student join will trigger an instant update.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Security Feed */}
                    <div className="lg:col-span-4 space-y-6">
                        <h2 className="text-2xl font-black tracking-tight flex items-center gap-3 italic">
                            <ShieldAlertIcon className="size-6 text-indigo-600" />
                            {t('monitor.recentViolations')}
                        </h2>

                        <Card className="h-[850px] flex flex-col border-none bg-slate-950 text-white shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/10">
                            <CardHeader className="px-8 py-6 border-b border-white/5 bg-indigo-500/5">
                                <CardDescription className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400 italic">
                                    {t('monitor.recentViolationsDesc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-hidden">
                                {recentViolations.length > 0 ? (
                                    <div className="h-full overflow-y-auto p-5 space-y-4 custom-scrollbar">
                                        {recentViolations.map((violation) => {
                                            const isCritical = violation.severity === 'critical';
                                            return (
                                                <div
                                                    key={violation.id}
                                                    className={cn(
                                                        "group relative flex flex-col gap-3 rounded-2xl border p-5 transition-all hover:bg-white/5 hover:-translate-y-1 duration-300",
                                                        isCritical 
                                                            ? "bg-red-500/10 border-red-500/20 shadow-lg shadow-red-950/20" 
                                                            : "bg-white/5 border-white/5"
                                                    )}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "size-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                                                                violation.severity === 'critical' ? 'bg-red-500 shadow-red-500/40' :
                                                                violation.severity === 'high' ? 'bg-orange-500 shadow-orange-500/40' :
                                                                'bg-amber-400 shadow-amber-400/40'
                                                            )} />
                                                            <span className={cn(
                                                                "text-[11px] font-black tracking-widest uppercase italic",
                                                                isCritical ? "text-red-400" : "text-white"
                                                            )}>
                                                                {getViolationLabel(violation.violation_type)}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] font-black text-white/30 tabular-nums">
                                                            {new Date(violation.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>

                                                    <p className="text-[11px] leading-relaxed font-bold text-white/40 pl-5 italic">
                                                        {violation.details || getViolationDescription(violation.violation_type)}
                                                    </p>

                                                    <div className="mt-2 flex items-center justify-between pl-5 border-t border-white/5 pt-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="size-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-300 shadow-inner">
                                                                {violation.attempt?.student?.name.charAt(0)}
                                                            </div>
                                                            <span className="text-[11px] font-black tracking-tight truncate max-w-[150px] text-white/80">
                                                                {violation.attempt?.student?.name}
                                                            </span>
                                                        </div>
                                                        {(violation.duration_seconds ?? 0) > 0 && (
                                                            <Badge variant="outline" className="h-5 px-2 text-[9px] font-black border-white/10 text-indigo-400 rounded-lg bg-indigo-500/10">
                                                                {violation.duration_seconds}s
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center p-12 text-center gap-6">
                                        <div className="rounded-[2rem] bg-white/5 p-6 border border-white/5 shadow-2xl">
                                            <ShieldAlertIcon className="size-12 text-indigo-500 opacity-20" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-black text-indigo-500 uppercase tracking-[0.3em] italic">{t('monitor.noViolations')}</p>
                                            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">System perimeter secure.</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* All Attempts History — Advanced Searchable Table */}
                <div className="mt-8 space-y-6">
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-3 italic">
                        <HistoryIcon className="size-6 text-indigo-600" />
                        {t('monitor.studentAttempts')}
                    </h2>

                    <Card className="border-none bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 rounded-[2.5rem] overflow-hidden p-1">
                        <CardContent className="p-0">
                            {attempts.length === 0 ? (
                                <div className="py-32 text-center space-y-6">
                                    <div className="mx-auto flex size-20 items-center justify-center rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-100 dark:ring-slate-700 shadow-inner">
                                        <HistoryIcon className="size-10 text-slate-200" />
                                    </div>
                                    <p className="text-xl font-black text-slate-400 tracking-tight uppercase italic">{t('monitor.noAttempts')}</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1000px]">
                                        <thead>
                                            <tr className="border-b bg-slate-50/50 dark:bg-slate-800/20 text-left">
                                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">Student</th>
                                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 text-center">Status</th>
                                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">Completion</th>
                                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 text-center">Security</th>
                                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">Started At</th>
                                                <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                            {attempts.map((attempt) => (
                                                <tr key={attempt.id} className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 transition-colors duration-300">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-black text-base shadow-inner">
                                                                {attempt.student?.name.charAt(0)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-black text-sm text-slate-900 dark:text-white truncate tracking-tight mb-0.5">{attempt.student?.name}</p>
                                                                <p className="text-[10px] font-bold text-muted-foreground/60 truncate tracking-wide">{attempt.student?.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <Badge variant={getStatusBadge(attempt.status)} className="font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-lg border-none shadow-sm">
                                                            {attempt.status.replace(/_/g, ' ')}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="space-y-2 max-w-[150px]">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner">
                                                                    <div
                                                                        className="h-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.3)] transition-all duration-700"
                                                                        style={{ width: `${Math.round((attempt.answers_count / (exam.questions_count || 1)) * 100)}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-[10px] font-black tracking-widest tabular-nums italic">
                                                                    {Math.round((attempt.answers_count / (exam.questions_count || 1)) * 100)}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        {attempt.violation_count > 0 ? (
                                                            <Badge variant="destructive" className="gap-2 font-black text-[10px] px-3 py-1.5 rounded-lg shadow-lg shadow-red-500/20 border-none">
                                                                <AlertTriangleIcon className="size-3.5" />
                                                                {attempt.violation_count}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="border-emerald-100 bg-emerald-50/30 text-emerald-500 text-[10px] font-black px-3 py-1.5 rounded-lg">All Regular</Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-6 text-[11px] font-black text-muted-foreground/80 tabular-nums italic">
                                                        {formatDateTime(attempt.started_at)}
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex justify-end gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => setConfirmingAction({ type: 'reset', id: attempt.id })}
                                                                            className="size-10 rounded-xl hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40"
                                                                        >
                                                                            <RotateCcwIcon className="size-5" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className="font-bold border-none bg-indigo-950 text-white rounded-lg px-3 py-1.5 shadow-2xl">{t('monitor.action.reset')}</TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>

                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => setConfirmingAction({ type: 'delete', id: attempt.id })}
                                                                            className="size-10 rounded-xl hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40"
                                                                        >
                                                                            <TrashIcon className="size-5" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className="font-bold border-none bg-indigo-950 text-white rounded-lg px-3 py-1.5 shadow-2xl">{t('monitor.action.delete')}</TooltipContent>
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

            {/* Action Confirmation Modals */}
            <Dialog 
                open={confirmingAction !== null} 
                onOpenChange={(open) => !open && setConfirmingAction(null)}
            >
                <DialogContent className="rounded-[2.5rem] border-none shadow-3xl max-w-sm p-8 bg-white dark:bg-slate-900 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
                    <DialogHeader className="pt-4">
                        <DialogTitle className="text-2xl font-black italic tracking-tight">
                            {confirmingAction?.type === 'reset' && t('monitor.action.reset')}
                            {confirmingAction?.type === 'delete' && t('monitor.action.delete')}
                            {confirmingAction?.type === 'clear_violations' && t('monitor.action.clearViolations')}
                            {confirmingAction?.type === 'force_submit' && t('monitor.action.forceSubmit')}
                        </DialogTitle>
                        <DialogDescription className="text-sm font-bold pt-4 text-slate-500 leading-relaxed">
                            {confirmingAction?.type === 'reset' && t('monitor.action.resetDesc')}
                            {confirmingAction?.type === 'delete' && t('monitor.action.deleteDesc')}
                            {confirmingAction?.type === 'clear_violations' && t('monitor.action.clearViolationsDesc')}
                            {confirmingAction?.type === 'force_submit' && t('monitor.action.forceSubmit.confirm')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-row gap-3 pt-8">
                        <Button 
                            variant="ghost" 
                            onClick={() => setConfirmingAction(null)}
                            className="rounded-2xl font-black uppercase tracking-widest text-xs h-12 flex-1"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button 
                            variant={confirmingAction?.type === 'delete' || confirmingAction?.type === 'force_submit' ? 'destructive' : 'default'}
                            onClick={executeAction}
                            className={cn(
                                "rounded-2xl font-black uppercase tracking-widest text-xs h-12 flex-1 shadow-lg",
                                confirmingAction?.type !== 'delete' && confirmingAction?.type !== 'force_submit' && "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
                            )}
                        >
                            {t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Extend Time Modal */}
            <Dialog 
                open={extendingTime !== null} 
                onOpenChange={(open) => !open && setExtendingTime(null)}
            >
                <DialogContent className="rounded-[2.5rem] border-none shadow-3xl max-w-sm p-8 bg-white dark:bg-slate-900 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
                    <DialogHeader className="pt-4">
                        <DialogTitle className="text-2xl font-black italic tracking-tight">
                            {t('monitor.action.extend_time')}
                        </DialogTitle>
                        <DialogDescription className="text-sm font-bold pt-4 text-slate-500 leading-relaxed">
                            {t('monitor.action.extend_time.prompt')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                        <div className="relative">
                            <Input
                                type="number"
                                value={extendingTime?.minutes || ''}
                                onChange={(e) => setExtendingTime(prev => prev ? { ...prev, minutes: e.target.value } : null)}
                                placeholder={t('monitor.action.extend_time.placeholder')}
                                className="h-14 rounded-2xl bg-slate-50 border-none font-black text-lg pl-6 pr-14 focus-visible:ring-indigo-600"
                            />
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-[10px] uppercase text-indigo-400">min</div>
                        </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-3 pt-4">
                        <Button 
                            variant="ghost" 
                            onClick={() => setExtendingTime(null)}
                            className="rounded-2xl font-black uppercase tracking-widest text-xs h-12 flex-1"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button 
                            onClick={executeExtendTime}
                            className="rounded-2xl font-black uppercase tracking-widest text-xs h-12 flex-1 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
                        >
                            {t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(99, 102, 241, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                    background: rgba(99, 102, 241, 0.3);
                }
            ` }} />
        </AppLayout>
    );
}
