import { Head, Link } from '@inertiajs/react';
import {
    ClockIcon,
    UsersIcon,
    FileTextIcon,
    SettingsIcon,
    MonitorIcon,
    ChevronRightIcon,
    DownloadIcon,
    ClipboardCheckIcon,
    AlertTriangleIcon,
    UserIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useLanguageStandalone } from '@/hooks/use-language';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type {
    BreadcrumbItem,
    Exam,
    Question,
    User,
    ExamAttempt,
} from '@/types';

interface Props {
    exam: Exam & {
        questions: Question[];
        assigned_students: User[];
        attempts_count: number;
    };
    attempts: (ExamAttempt & {
        student: { id: number; name: string; email: string };
    })[];
}

export default function ShowExam({ exam, attempts }: Props) {
    const { t } = useLanguageStandalone();
    
    const totalPoints = 
        exam.questions?.reduce((sum, q) => sum + Number(q.points), 0) || 0;
        
    const formatDate = (date: string) => new Date(date).toLocaleString();
    
    const isActive =
        exam.is_published &&
        new Date(exam.start_time) <= new Date() &&
        new Date(exam.end_time) >= new Date();

    const getStatusBadge = (status: string) => {
        const variants: Record<
            string,
            'default' | 'secondary' | 'destructive' | 'outline'
        > = {
            in_progress: 'default',
            submitted: 'secondary',
            graded: 'outline',
            auto_submitted: 'destructive',
        };
        return variants[status] || 'secondary';
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('common.dashboard'), href: '/dashboard' },
        { title: t('exams.title'), href: '/exams' },
        { title: exam.title, href: `/exams/${exam.id}` },
    ];

    const pendingReviews = attempts.filter(a => a.status === 'submitted' || a.status === 'auto_submitted').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={exam.title} />
            <div className="flex flex-col gap-8 p-6 mx-auto max-w-7xl">
                {/* Header */}
                <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-8 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between border border-white/10">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl font-black tracking-tight">{exam.title}</h1>
                            <Badge className="bg-white/20 font-bold text-white backdrop-blur-md border-white/10 uppercase tracking-widest text-[10px]">
                                {exam.type === 'auto' ? t('exams.fields.type.auto') : t('exams.fields.type.hybrid')}
                            </Badge>
                            <Badge
                                variant="secondary"
                                className={cn(
                                    "font-bold uppercase tracking-widest text-[10px] backdrop-blur-md",
                                    exam.is_published
                                        ? isActive
                                            ? 'bg-emerald-400 text-emerald-950'
                                            : 'bg-white text-blue-600'
                                        : 'bg-amber-400 text-amber-950'
                                )}
                            >
                                {exam.is_published
                                    ? isActive
                                        ? t('exams.show.live_now')
                                        : t('exams.status.published')
                                    : t('exams.status.draft')}
                            </Badge>
                        </div>
                        {exam.description && (
                            <p className="max-w-2xl text-lg font-medium opacity-90 leading-relaxed line-clamp-2">
                                {exam.description}
                            </p>
                        )}
                    </div>
                    <div className="flex shrink-0 gap-3">
                        <Button
                            variant="secondary"
                            size="lg"
                            asChild
                            className="bg-white/10 text-white hover:bg-white/20 border-white/20"
                        >
                            <Link href={`/exams/${exam.id}/edit`}>
                                <SettingsIcon className="mr-2 size-5" />
                                {t('exams.show.manage')}
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Command Center Action Cards */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Action Card: Configure */}
                    <Link href={`/exams/${exam.id}/edit`} className="group">
                        <Card className="h-full transition-all duration-300 hover:shadow-xl hover:border-blue-500/50 group-hover:-translate-y-1 bg-white/50 backdrop-blur-sm">
                            <CardHeader className="pb-2">
                                <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm shadow-blue-200">
                                    <FileTextIcon className="size-6" />
                                </div>
                                <CardTitle className="text-lg font-bold">{t('exams.show.configure')}</CardTitle>
                                <CardDescription className="text-xs">{t('exams.show.configure.desc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center text-sm font-black text-blue-600 mt-2">
                                    {exam.questions?.length || 0} {t('exams.questions')}
                                    <ChevronRightIcon className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Action Card: Access */}
                    <Link href={`/exams/${exam.id}/assign`} className="group">
                        <Card className="h-full transition-all duration-300 hover:shadow-xl hover:border-indigo-500/50 group-hover:-translate-y-1 bg-white/50 backdrop-blur-sm">
                            <CardHeader className="pb-2">
                                <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm shadow-indigo-200">
                                    <UsersIcon className="size-6" />
                                </div>
                                <CardTitle className="text-lg font-bold">{t('exams.show.access')}</CardTitle>
                                <CardDescription className="text-xs">{t('exams.show.access.desc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center text-sm font-black text-indigo-600 mt-2">
                                    {exam.assigned_students?.length || 0} {t('exams.show.assigned')}
                                    <ChevronRightIcon className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Action Card: Proctor */}
                    <Link href={`/exams/${exam.id}/monitor`} className="group">
                        <Card className="h-full transition-all duration-300 hover:shadow-xl hover:border-rose-500/50 group-hover:-translate-y-1 bg-white/50 backdrop-blur-sm">
                            <CardHeader className="pb-2">
                                <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300 shadow-sm shadow-rose-200">
                                    <MonitorIcon className="size-6" />
                                </div>
                                <CardTitle className="text-lg font-bold">{t('exams.show.proctor')}</CardTitle>
                                <CardDescription className="text-xs">{t('exams.show.proctor.desc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center text-sm font-black text-rose-600 mt-2">
                                    {t('dashboard.monitor')}
                                    <ChevronRightIcon className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Action Card: Grading */}
                    <Link href={`/grading/${exam.id}`} className="group">
                        <Card className={cn(
                            "h-full transition-all duration-300 hover:shadow-xl group-hover:-translate-y-1 bg-white/50 backdrop-blur-sm",
                            pendingReviews > 0 ? "border-amber-500/50 bg-amber-50/50" : "hover:border-emerald-500/50"
                        )}>
                            <CardHeader className="pb-2">
                                <div className={cn(
                                    "mb-3 flex size-12 items-center justify-center rounded-2xl transition-all duration-300 shadow-sm",
                                    pendingReviews > 0 
                                        ? "bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white shadow-amber-200" 
                                        : "bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white shadow-emerald-200"
                                )}>
                                    <ClipboardCheckIcon className="size-6" />
                                </div>
                                <CardTitle className="text-lg font-bold">{t('exams.show.grading')}</CardTitle>
                                <CardDescription className="text-xs">{t('exams.show.grading.desc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className={cn(
                                    "flex items-center text-sm font-black mt-2",
                                    pendingReviews > 0 ? "text-amber-600" : "text-emerald-600"
                                )}>
                                    {pendingReviews > 0 ? `${pendingReviews} ${t('exams.show.needs_review')}` : t('exams.show.all_graded')}
                                    <ChevronRightIcon className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Main Content: Attempts List */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="overflow-hidden border-none shadow-lg bg-white/80 backdrop-blur-md">
                            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 pb-4">
                                <div>
                                    <CardTitle className="text-xl font-bold">{t('exams.show.recent')}</CardTitle>
                                    <CardDescription>{t('exams.show.recent.desc')}</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" asChild className="font-bold">
                                    <a href={`/grading/${exam.id}/export`}>
                                        <DownloadIcon className="mr-2 size-4" />
                                        {t('exams.show.export')}
                                    </a>
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                {attempts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-muted/50">
                                            <UserIcon className="size-10 text-muted-foreground/30" />
                                        </div>
                                        <p className="text-xl font-bold text-muted-foreground">{t('exams.show.none')}</p>
                                        <p className="text-sm text-muted-foreground/60 max-w-xs">{t('exams.show.none.desc')}</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/50">
                                        {attempts.map((attempt) => (
                                            <div
                                                key={attempt.id}
                                                className="flex items-center justify-between px-6 py-5 hover:bg-muted/30 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 font-bold border shadow-xs">
                                                        {attempt.student?.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="font-bold text-slate-900">
                                                                {attempt.student?.name}
                                                            </span>
                                                            <Badge
                                                                variant={getStatusBadge(attempt.status)}
                                                                className="text-[10px] font-black uppercase tracking-tight h-5 px-1.5"
                                                            >
                                                                {t(`status.${attempt.status}` as any)}
                                                            </Badge>
                                                            {attempt.violation_count > 0 && (
                                                                <Badge
                                                                    variant="destructive"
                                                                    className="gap-1 text-[10px] font-black h-5 px-1.5"
                                                                >
                                                                    <AlertTriangleIcon className="size-3" />
                                                                    {attempt.violation_count}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground font-medium">
                                                            #{attempt.attempt_number} • {formatDate(attempt.started_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {attempt.score !== null && (
                                                        <div className="text-right hidden sm:block">
                                                            <div className="text-sm font-black">{attempt.score}/{attempt.total_points}</div>
                                                            <div className="text-[10px] text-muted-foreground uppercase font-black tracking-tight">{attempt.percentage}%</div>
                                                        </div>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                        className="font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8"
                                                    >
                                                        <Link href={`/grading/attempt/${attempt.id}`}>
                                                            {t('exams.show.review')}
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <Card className="border-none shadow-lg bg-white/80 backdrop-blur-md">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-black">{t('exams.show.stats')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                                            <FileTextIcon className="size-4" />
                                        </div>
                                        {t('exams.show.points_total')}
                                    </div>
                                    <span className="font-black text-lg">{totalPoints}</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                                            <UsersIcon className="size-4" />
                                        </div>
                                        {t('exams.show.assigned')}
                                    </div>
                                    <span className="font-black text-lg">{exam.assigned_students?.length || 0}</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                                            <ClipboardCheckIcon className="size-4" />
                                        </div>
                                        {t('exams.show.success_score')}
                                    </div>
                                    <span className="font-black text-lg">{exam.passing_score}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                        <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                                            <ClockIcon className="size-4" />
                                        </div>
                                        {t('exams.show.duration')}
                                    </div>
                                    <span className="font-black text-lg">{exam.duration_minutes}m</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg bg-white/80 backdrop-blur-md">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-black">{t('exams.show.availability')}</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="group">
                                    <div className="text-[10px] font-black text-muted-foreground uppercase mb-1.5 group-hover:text-blue-600 transition-colors">{t('exams.show.starts')}</div>
                                    <div className="text-sm font-bold bg-slate-50/50 p-3 rounded-xl border border-border/50 shadow-xs group-hover:border-blue-200 group-hover:bg-blue-50/30 transition-all duration-300">
                                        {formatDate(exam.start_time)}
                                    </div>
                                </div>
                                <div className="group">
                                    <div className="text-[10px] font-black text-muted-foreground uppercase mb-1.5 group-hover:text-rose-600 transition-colors">{t('exams.show.ends')}</div>
                                    <div className="text-sm font-bold bg-slate-50/50 p-3 rounded-xl border border-border/50 shadow-xs group-hover:border-rose-200 group-hover:bg-rose-50/30 transition-all duration-300">
                                        {formatDate(exam.end_time)}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
