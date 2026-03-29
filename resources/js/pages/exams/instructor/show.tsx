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
    UserIcon,
    ActivityIcon,
    EyeIcon,
    CheckCircleIcon,
    ShieldAlertIcon,
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
                <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-600 to-violet-500 dark:from-primary/30 dark:via-primary/10 dark:to-background p-6 text-white shadow-2xl shadow-blue-500/20 sm:flex-row sm:items-center sm:justify-between border border-white/10 relative overflow-hidden">
                    <div className="space-y-2 relative z-10">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl font-black tracking-tight drop-shadow-sm">{exam.title}</h1>
                            <Badge className="bg-white/20 font-bold text-white backdrop-blur-md border-white/10 uppercase tracking-widest text-[10px] px-2 sm:px-3">
                                {exam.type === 'auto' ? (
                                    <>
                                        <SettingsIcon className="size-3 sm:mr-1.5" />
                                        <span className="hidden sm:inline">{t('exams.fields.type.auto')}</span>
                                    </>
                                ) : (
                                    <>
                                        <UsersIcon className="size-3 sm:mr-1.5" />
                                        <span className="hidden sm:inline">{t('exams.fields.type.hybrid')}</span>
                                    </>
                                )}
                            </Badge>
                            <Badge
                                variant="secondary"
                                className={cn(
                                    "font-bold uppercase tracking-widest text-[10px] backdrop-blur-md px-2 sm:px-3",
                                    exam.is_published
                                        ? isActive
                                            ? 'bg-emerald-400 text-emerald-950 shadow-[0_0_15px_-3px_rgba(52,211,153,0.5)]'
                                            : 'bg-white text-blue-600'
                                        : 'bg-amber-400 text-amber-950'
                                )}
                            >
                                {exam.is_published ? (
                                    isActive ? (
                                        <>
                                            <ActivityIcon className="size-3 sm:mr-1.5 animate-pulse" />
                                            <span className="hidden sm:inline">{t('exams.show.live_now')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <EyeIcon className="size-3 sm:mr-1.5" />
                                            <span className="hidden sm:inline">{t('exams.status.published')}</span>
                                        </>
                                    )
                                ) : (
                                    <>
                                        <FileTextIcon className="size-3 sm:mr-1.5" />
                                        <span className="hidden sm:inline">{t('exams.status.draft')}</span>
                                    </>
                                )}
                            </Badge>
                        </div>
                        {exam.description && (
                            <p className="max-w-2xl text-lg font-medium opacity-90 leading-relaxed line-clamp-2 italic">
                                {exam.description}
                            </p>
                        )}
                    </div>
                    <div className="flex shrink-0 gap-3 relative z-10">
                        <Button
                            variant="secondary"
                            size="lg"
                            asChild
                            className="bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-md shadow-xl"
                        >
                            <Link href={`/exams/${exam.id}/edit`}>
                                <SettingsIcon className="mr-2 size-5" />
                                {t('exams.show.manage')}
                            </Link>
                        </Button>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                </div>

                {/* Command Center Action Cards */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Action Card: Configure */}
                    <Link href={`/exams/${exam.id}/edit`} className="group">
                        <Card className="h-full transition-all duration-300 rounded-3xl border border-border group-hover:border-primary/50 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-primary/20 bg-card/40 backdrop-blur-md shadow-lg">
                            <CardHeader className="pb-2 px-6 pt-6">
                                <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-[radial-gradient(at_center,_var(--color-primary)_/_0.2,_transparent)] text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-sm border border-primary/10">
                                    <FileTextIcon className="size-6" />
                                </div>
                                <CardTitle className="text-lg font-black text-foreground uppercase tracking-tight">{t('exams.show.configure')}</CardTitle>
                                <CardDescription className="text-xs text-muted-foreground font-medium italic">{t('exams.show.configure.desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="px-6 pb-6">
                                <div className="flex items-center text-sm font-black text-primary mt-2 uppercase tracking-widest">
                                    {exam.questions?.length || 0} {t('exams.questions')}
                                    <ChevronRightIcon className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Action Card: Access */}
                    <Link href={`/exams/${exam.id}/assign`} className="group">
                        <Card className="h-full transition-all duration-300 rounded-3xl border border-border group-hover:border-primary/50 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-primary/20 bg-card/40 backdrop-blur-md shadow-lg">
                            <CardHeader className="pb-2 px-6 pt-6">
                                <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-[radial-gradient(at_center,_var(--color-primary)_/_0.2,_transparent)] text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-sm border border-primary/10">
                                    <UsersIcon className="size-6" />
                                </div>
                                <CardTitle className="text-lg font-black text-foreground uppercase tracking-tight">{t('exams.show.access')}</CardTitle>
                                <CardDescription className="text-xs text-muted-foreground font-medium italic">{t('exams.show.access.desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="px-6 pb-6">
                                <div className="flex items-center text-sm font-black text-primary mt-2 uppercase tracking-widest">
                                    {exam.assigned_students?.length || 0} {t('exams.show.assigned')}
                                    <ChevronRightIcon className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Action Card: Proctor */}
                    <Link href={`/exams/${exam.id}/monitor`} className="group">
                        <Card className="h-full transition-all duration-300 rounded-3xl border border-border group-hover:border-rose-500/50 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-rose-500/20 bg-card/40 backdrop-blur-md shadow-lg">
                            <CardHeader className="pb-2 px-6 pt-6">
                                <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-[radial-gradient(at_center,_oklch(0.55_0.18_25)_/_0.2,_transparent)] text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all duration-500 shadow-sm border border-rose-500/10">
                                    <MonitorIcon className="size-6" />
                                </div>
                                <CardTitle className="text-lg font-black text-foreground uppercase tracking-tight">{t('exams.show.proctor')}</CardTitle>
                                <CardDescription className="text-xs text-muted-foreground font-medium italic">{t('exams.show.proctor.desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="px-6 pb-6">
                                <div className="flex items-center text-sm font-black text-rose-600 mt-2 uppercase tracking-widest">
                                    {t('dashboard.monitor')}
                                    <ChevronRightIcon className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Action Card: Grading */}
                    <Link href={`/grading/${exam.id}`} className="group">
                        <Card className={cn(
                            "h-full transition-all duration-300 rounded-3xl border border-border group-hover:-translate-y-1 bg-card/40 backdrop-blur-md shadow-lg group-hover:shadow-2xl",
                            pendingReviews > 0 
                                ? "border-amber-500/50 bg-amber-500/5 group-hover:shadow-amber-500/20" 
                                : "hover:border-emerald-500/50 group-hover:shadow-emerald-500/20"
                        )}>
                            <CardHeader className="pb-2 px-6 pt-6">
                                <div className={cn(
                                    "mb-3 flex size-12 items-center justify-center rounded-2xl transition-all duration-500 shadow-sm border",
                                    pendingReviews > 0
                                        ? "bg-[radial-gradient(at_center,_oklch(0.7_0.15_80)_/_0.2,_transparent)] text-amber-600 group-hover:bg-amber-600 group-hover:text-white border-amber-500/10"
                                        : "bg-[radial-gradient(at_center,_oklch(0.6_0.2_160)_/_0.2,_transparent)] text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white border-emerald-500/10"
                                )}>
                                    <ClipboardCheckIcon className="size-6" />
                                </div>
                                <CardTitle className="text-lg font-black text-foreground uppercase tracking-tight">{t('exams.show.grading')}</CardTitle>
                                <CardDescription className="text-xs text-muted-foreground font-medium italic">{t('exams.show.grading.desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="px-6 pb-6">
                                <div className={cn(
                                    "flex items-center text-sm font-black mt-2 uppercase tracking-widest",
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
                        <Card className="rounded-3xl overflow-hidden border border-border/50 shadow-xl bg-card/40 backdrop-blur-md pt-0 border-t-white/10 dark:border-t-white/5">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-primary/10 bg-primary/5 dark:bg-primary/10 pb-6 pt-8 px-6">
                                <div>
                                    <CardTitle className="text-xl font-black text-foreground uppercase tracking-tight italic">{t('exams.show.recent')}</CardTitle>
                                    <CardDescription className="text-muted-foreground font-bold text-xs uppercase tracking-widest">{t('exams.show.recent.desc')}</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" asChild className="font-black text-[10px] uppercase tracking-widest h-9 rounded-xl border-border hover:bg-accent transition-all shadow-sm">
                                    <a href={`/grading/${exam.id}/export`}>
                                        <DownloadIcon className="mr-2 size-4" />
                                        {t('exams.show.export')}
                                    </a>
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                {attempts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                                        <div className="mb-4 flex size-20 items-center justify-center rounded-2xl bg-muted shadow-2xl ring-1 ring-border">
                                            <UserIcon className="size-10 text-muted-foreground" />
                                        </div>
                                        <p className="text-xl font-black text-muted-foreground uppercase tracking-tight italic">{t('exams.show.none')}</p>
                                        <p className="text-sm text-muted-foreground font-medium max-w-xs">{t('exams.show.none.desc')}</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/50">
                                        {attempts.map((attempt) => (
                                            <div
                                                key={attempt.id}
                                                className="flex items-center justify-between px-6 py-5 hover:bg-primary/5 transition-all group"
                                            >
                                                <div className="flex items-center gap-5 min-w-0">
                                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted border border-border text-foreground font-black shadow-inner group-hover:border-primary/30 group-hover:text-primary transition-all">
                                                        {attempt.student?.name.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="font-black text-foreground tracking-tight truncate">
                                                                {attempt.student?.name}
                                                            </span>
                                                            <Badge
                                                                variant={getStatusBadge(attempt.status)}
                                                                className="text-[10px] font-black uppercase tracking-tight h-5 px-1.5 sm:px-2 border-none shadow-sm"
                                                            >
                                                                {attempt.status === 'graded' ? <CheckCircleIcon className="size-3 sm:mr-1" /> : <ClockIcon className="size-3 sm:mr-1" />}
                                                                <span className="hidden sm:inline">{t(`status.${attempt.status}` as any)}</span>
                                                            </Badge>
                                                            {attempt.violation_count > 0 && (
                                                                <Badge
                                                                    variant="destructive"
                                                                    className="gap-1 text-[10px] font-black h-5 px-1.5 sm:px-2 animate-pulse"
                                                                >
                                                                    <ShieldAlertIcon className="size-3" />
                                                                    <span className="hidden sm:inline">{t('grading.review.violations.detected')}</span>
                                                                    {attempt.violation_count}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                                            #{attempt.attempt_number} • {formatDate(attempt.started_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    {attempt.score !== null && (
                                                        <div className="text-right hidden sm:block">
                                                            <div className="text-sm font-black text-foreground tabular-nums tracking-tighter italic">{attempt.score}/{attempt.total_points} {t('grading.table.pts')}</div>
                                                            <div className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">{attempt.percentage}%</div>
                                                        </div>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                        className="font-black text-[10px] uppercase tracking-widest text-primary hover:text-primary hover:bg-primary/10 h-9 rounded-xl px-4 transition-all"
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
                        <Card className="rounded-3xl border border-border shadow-xl bg-card/40 backdrop-blur-md overflow-hidden pt-0 border-t-white/10 dark:border-t-white/5">
                            <CardHeader className="pb-4 pt-8 px-6 bg-primary/5 dark:bg-primary/10 border-b border-primary/10">
                                <CardTitle className="text-[10px] uppercase tracking-[0.2em] text-primary font-black italic">{t('exams.show.stats')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6 px-6 pb-8">
                                <div className="flex items-center justify-between border-b border-border/50 pb-3 group">
                                    <div className="flex items-center gap-3 text-sm font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">
                                        <div className="p-2 rounded-xl bg-[radial-gradient(at_center,_var(--color-primary)_/_0.2,_transparent)] text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all border border-primary/10">
                                            <FileTextIcon className="size-4" />
                                        </div>
                                        {t('exams.show.points_total')}
                                    </div>
                                    <span className="font-black text-2xl text-foreground tabular-nums italic tracking-tighter">{totalPoints}</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-border/50 pb-3 group">
                                    <div className="flex items-center gap-3 text-sm font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">
                                        <div className="p-2 rounded-xl bg-[radial-gradient(at_center,_var(--color-primary)_/_0.2,_transparent)] text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all border border-primary/10">
                                            <UsersIcon className="size-4" />
                                        </div>
                                        {t('exams.show.assigned')}
                                    </div>
                                    <span className="font-black text-2xl text-foreground tabular-nums italic tracking-tighter">{exam.assigned_students?.length || 0}</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-border/50 pb-3 group">
                                    <div className="flex items-center gap-3 text-sm font-black text-foreground uppercase tracking-tight group-hover:text-emerald-600 transition-colors">
                                        <div className="p-2 rounded-xl bg-[radial-gradient(at_center,_oklch(0.6_0.2_160)_/_0.2,_transparent)] text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all border border-emerald-500/10">
                                            <ClipboardCheckIcon className="size-4" />
                                        </div>
                                        {t('exams.show.success_score')}
                                    </div>
                                    <span className="font-black text-2xl text-foreground tabular-nums italic tracking-tighter">{exam.passing_score}%</span>
                                </div>
                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3 text-sm font-black text-foreground uppercase tracking-tight group-hover:text-amber-600 transition-colors">
                                        <div className="p-2 rounded-xl bg-[radial-gradient(at_center,_oklch(0.7_0.15_80)_/_0.2,_transparent)] text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all border border-amber-500/10">
                                            <ClockIcon className="size-4" />
                                        </div>
                                        {t('exams.show.duration')}
                                    </div>
                                    <span className="font-black text-2xl text-foreground tabular-nums italic tracking-tighter">{exam.duration_minutes}m</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border border-border shadow-xl bg-card/40 backdrop-blur-md overflow-hidden pt-0 border-t-white/10 dark:border-t-white/5">
                            <CardHeader className="pb-4 pt-8 px-6 bg-primary/5 dark:bg-primary/10 border-b border-primary/10">
                                <CardTitle className="text-[10px] uppercase tracking-[0.2em] text-primary font-black italic">{t('exams.show.availability')}</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 px-6 pb-8 space-y-5">
                                <div className="group">
                                    <div className="text-[10px] font-black text-muted-foreground uppercase mb-2 group-hover:text-primary transition-colors tracking-widest">{t('exams.show.starts')}</div>
                                    <div className="text-sm font-bold bg-muted/50 p-4 rounded-2xl border border-border/50 shadow-inner transition-all duration-300 text-foreground tabular-nums italic group-hover:border-primary/30 group-hover:bg-primary/5">
                                        {formatDate(exam.start_time)}
                                    </div>
                                </div>
                                <div className="group">
                                    <div className="text-[10px] font-black text-muted-foreground uppercase mb-2 group-hover:text-rose-600 transition-colors tracking-widest">{t('exams.show.ends')}</div>
                                    <div className="text-sm font-bold bg-muted/50 p-4 rounded-2xl border border-border/50 shadow-inner transition-all duration-300 text-foreground tabular-nums italic group-hover:border-rose-300 group-hover:bg-rose-500/5">
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
