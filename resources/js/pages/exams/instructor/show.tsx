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
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Exams', href: '/exams' },
        { title: exam.title, href: `/exams/${exam.id}` },
    ];

    const pendingReviews = attempts.filter(a => a.status === 'submitted' || a.status === 'auto_submitted').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={exam.title} />
            <div className="flex flex-col gap-8 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-8 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl font-black tracking-tight">{exam.title}</h1>
                            <Badge className="bg-white/20 font-bold text-white backdrop-blur-md border-white/10 uppercase tracking-widest text-[10px]">
                                {exam.type === 'auto' ? 'Auto-Correct' : 'Hybrid'}
                            </Badge>
                            <Badge
                                variant="secondary"
                                className={
                                    exam.is_published
                                        ? isActive
                                            ? 'bg-emerald-400 text-emerald-950 font-bold'
                                            : 'bg-white text-blue-600 font-bold'
                                        : 'bg-amber-400 text-amber-950 font-bold'
                                }
                            >
                                {exam.is_published
                                    ? isActive
                                        ? 'LIVE NOW'
                                        : 'PUBLISHED'
                                    : 'DRAFT'}
                            </Badge>
                        </div>
                        {exam.description && (
                            <p className="max-w-2xl text-lg font-medium opacity-90 leading-relaxed">
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
                                Manage Settings
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Command Center Action Cards */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Action Card: Configure */}
                    <Link href={`/exams/${exam.id}/edit`} className="group">
                        <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-blue-500 group-hover:-translate-y-1">
                            <CardHeader className="pb-2">
                                <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <FileTextIcon className="size-6" />
                                </div>
                                <CardTitle className="text-lg">Configure Content</CardTitle>
                                <CardDescription>Add questions and set rules</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center text-sm font-bold text-blue-600">
                                    {exam.questions?.length || 0} Questions
                                    <ChevronRightIcon className="ml-1 size-4" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Action Card: Access */}
                    <Link href={`/exams/${exam.id}/assign`} className="group">
                        <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-indigo-500 group-hover:-translate-y-1">
                            <CardHeader className="pb-2">
                                <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <UsersIcon className="size-6" />
                                </div>
                                <CardTitle className="text-lg">Manage Access</CardTitle>
                                <CardDescription>Invite students or groups</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center text-sm font-bold text-indigo-600">
                                    {exam.assigned_students?.length || 0} Assigned
                                    <ChevronRightIcon className="ml-1 size-4" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Action Card: Proctor */}
                    <Link href={`/exams/${exam.id}/monitor`} className="group">
                        <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-rose-500 group-hover:-translate-y-1">
                            <CardHeader className="pb-2">
                                <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                                    <MonitorIcon className="size-6" />
                                </div>
                                <CardTitle className="text-lg">Live Proctoring</CardTitle>
                                <CardDescription>Monitor active students</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center text-sm font-bold text-rose-600">
                                    View Dashboard
                                    <ChevronRightIcon className="ml-1 size-4" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Action Card: Grading */}
                    <Link href={`/grading/${exam.id}`} className="group">
                        <Card className={cn(
                            "h-full transition-all duration-200 hover:shadow-md group-hover:-translate-y-1",
                            pendingReviews > 0 ? "border-amber-500 bg-amber-50/30" : "hover:border-emerald-500"
                        )}>
                            <CardHeader className="pb-2">
                                <div className={cn(
                                    "mb-2 flex size-12 items-center justify-center rounded-xl transition-colors",
                                    pendingReviews > 0 
                                        ? "bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white" 
                                        : "bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
                                )}>
                                    <ClipboardCheckIcon className="size-6" />
                                </div>
                                <CardTitle className="text-lg">Grading & Results</CardTitle>
                                <CardDescription>Review and export scores</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className={cn(
                                    "flex items-center text-sm font-bold",
                                    pendingReviews > 0 ? "text-amber-600" : "text-emerald-600"
                                )}>
                                    {pendingReviews > 0 ? `${pendingReviews} Needs Review` : 'All Graded'}
                                    <ChevronRightIcon className="ml-1 size-4" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Main Content: Attempts List */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                                <div>
                                    <CardTitle>Recent Submissions</CardTitle>
                                    <CardDescription>Overview of student activity</CardDescription>
                                </div>
                                <a 
                                    href={`/grading/${exam.id}/export`}
                                    className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-bold shadow-xs hover:bg-accent hover:text-accent-foreground transition-colors"
                                >
                                    <DownloadIcon className="mr-2 size-4" />
                                    Export CSV
                                </a>
                            </CardHeader>
                            <CardContent className="p-0">
                                {attempts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                                            <UserIcon className="size-8 text-muted-foreground/40" />
                                        </div>
                                        <p className="text-lg font-medium text-muted-foreground">No attempts recorded yet</p>
                                        <p className="text-sm text-muted-foreground/60">Students will appear here once they start the exam</p>
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {attempts.map((attempt) => (
                                            <div
                                                key={attempt.id}
                                                className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold border">
                                                        {attempt.student?.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-900">
                                                                {attempt.student?.name}
                                                            </span>
                                                            <Badge
                                                                variant={getStatusBadge(
                                                                    attempt.status,
                                                                )}
                                                                className="text-[10px] font-black uppercase h-5"
                                                            >
                                                                {attempt.status.replace(
                                                                    /_/g,
                                                                    ' ',
                                                                )}
                                                            </Badge>
                                                            {attempt.violation_count > 0 && (
                                                                <Badge
                                                                    variant="destructive"
                                                                    className="gap-1 text-[10px] font-black h-5"
                                                                >
                                                                    <AlertTriangleIcon className="size-3" />
                                                                    {attempt.violation_count}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-0.5">
                                                            Attempt #{attempt.attempt_number} • Started {formatDate(attempt.started_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {attempt.score !== null && (
                                                        <div className="text-right hidden sm:block">
                                                            <div className="text-sm font-black">{attempt.score}/{attempt.total_points}</div>
                                                            <div className="text-[10px] text-muted-foreground uppercase font-bold">{attempt.percentage}%</div>
                                                        </div>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                        className="font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    >
                                                        <Link
                                                            href={`/grading/attempt/${attempt.id}`}
                                                        >
                                                            Review
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
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground font-black">Quick Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <FileTextIcon className="size-4 text-blue-500" />
                                        Points Total
                                    </div>
                                    <span className="font-black">{totalPoints}</span>
                                </div>
                                <div className="flex items-center justify-between border-b pb-2">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <UsersIcon className="size-4 text-indigo-500" />
                                        Assigned
                                    </div>
                                    <span className="font-black">{exam.assigned_students?.length || 0}</span>
                                </div>
                                <div className="flex items-center justify-between border-b pb-2">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <ClipboardCheckIcon className="size-4 text-emerald-500" />
                                        Success Score
                                    </div>
                                    <span className="font-black">{exam.passing_score}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <ClockIcon className="size-4 text-amber-500" />
                                        Duration
                                    </div>
                                    <span className="font-black">{exam.duration_minutes}m</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground font-black">Availability</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                                <div>
                                    <div className="text-[10px] font-black text-muted-foreground uppercase mb-1">Starts</div>
                                    <div className="text-sm font-bold bg-slate-50 p-2 rounded-md border">{formatDate(exam.start_time)}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-muted-foreground uppercase mb-1">Ends</div>
                                    <div className="text-sm font-bold bg-slate-50 p-2 rounded-md border">{formatDate(exam.end_time)}</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
