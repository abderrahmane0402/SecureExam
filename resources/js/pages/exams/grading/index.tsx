import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangleIcon,
    UserIcon,
    CheckCircleIcon,
    ArrowLeftIcon,
    DownloadIcon,
    ClipboardCheckIcon,
    ArrowRightIcon,
    TrophyIcon,
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
import type { BreadcrumbItem, Exam, ExamAttempt, User } from '@/types';

interface AttemptWithStudent extends ExamAttempt {
    student: User;
    answers_count: number;
}

interface Props {
    exam: Exam & { questions_count: number; total_points: number };
    attempts: AttemptWithStudent[];
    stats: {
        total: number;
        completed: number;
        pending_grading: number;
        graded: number;
        average_score: number | null;
    };
}

export default function GradingIndex({ exam, attempts, stats }: Props) {
    const formatDate = (date: string) => new Date(date).toLocaleString();

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            in_progress: 'default',
            submitted: 'secondary',
            graded: 'outline',
            auto_submitted: 'destructive',
        };
        
        const label = status === 'graded' ? 'Graded' : 
                     (status === 'submitted' || status === 'auto_submitted') ? 'Pending Review' : 
                     status.replace(/_/g, ' ');

        return (
            <Badge 
                variant={variants[status] || 'secondary'}
                className="uppercase text-[10px] font-black tracking-wider px-2 h-5"
            >
                {label}
            </Badge>
        );
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Exams', href: '/exams' },
        { title: exam.title, href: `/exams/${exam.id}` },
        { title: 'Grading', href: `/grading/${exam.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Grading: ${exam.title}`} />
            <div className="flex flex-col gap-8 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 rounded-2xl bg-slate-900 p-8 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild className="rounded-full text-white hover:bg-white/10 hover:text-white">
                            <Link href={`/exams/${exam.id}`}>
                                <ArrowLeftIcon className="size-5" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-black tracking-tight uppercase italic text-blue-400">
                                    Grading Queue
                                </h1>
                                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                                    {stats.pending_grading} Submissions Left
                                </Badge>
                            </div>
                            <p className="text-sm font-bold text-slate-400">
                                {exam.title} • {exam.questions_count} Questions
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        <a 
                            href={`/grading/${exam.id}/export`}
                            className="inline-flex items-center justify-center rounded-xl bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-white/20 transition-all border border-white/10"
                        >
                            <DownloadIcon className="mr-2 size-4" />
                            Export CSV
                        </a>
                    </div>
                </div>

                {/* Stats Dashboard */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border bg-background p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total</p>
                            <UsersIcon className="size-4 text-blue-500" />
                        </div>
                        <p className="text-3xl font-black">{stats.total}</p>
                        <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Student attempts</p>
                    </div>

                    <div className="rounded-2xl border bg-background p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Pending</p>
                            <ClipboardCheckIcon className="size-4 text-amber-500" />
                        </div>
                        <p className="text-3xl font-black text-amber-600">{stats.pending_grading}</p>
                        <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Need review</p>
                    </div>

                    <div className="rounded-2xl border bg-background p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Graded</p>
                            <CheckCircleIcon className="size-4 text-emerald-500" />
                        </div>
                        <p className="text-3xl font-black text-emerald-600">{stats.graded}</p>
                        <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Finalized</p>
                    </div>

                    <div className="rounded-2xl border bg-background p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Average</p>
                            <TrophyIcon className="size-4 text-rose-500" />
                        </div>
                        <p className="text-3xl font-black text-rose-600">
                            {stats.average_score !== null
                                ? `${Number(stats.average_score).toFixed(1)}%`
                                : '—'}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Class performance</p>
                    </div>
                </div>

                {/* Submissions List */}
                <Card className="rounded-2xl overflow-hidden border-none shadow-xl">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-black uppercase tracking-tighter">Student Submissions</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-widest">Select a student to begin evaluating</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {attempts.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {attempts.map((attempt) => (
                                    <Link
                                        key={attempt.id}
                                        href={`/grading/attempt/${attempt.id}`}
                                        className="group flex items-center justify-between gap-4 px-8 py-6 transition-all hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="relative">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-transparent group-hover:border-blue-500 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-all duration-300">
                                                    <UserIcon className="size-7 text-slate-400 dark:text-slate-500 group-hover:text-blue-600" />
                                                </div>
                                                {attempt.violation_count > 0 && (
                                                    <div className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-rose-600 text-white border-4 border-white dark:border-slate-900 shadow-lg">
                                                        <AlertTriangleIcon className="size-3" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-lg font-black tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                    {attempt.student.name}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        {attempt.student.email}
                                                    </p>
                                                    <span className="text-slate-300">•</span>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        Attempt #{attempt.attempt_number}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-12">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                                    Submitted
                                                </p>
                                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                                    {formatDate(attempt.submitted_at || attempt.started_at)}
                                                </p>
                                            </div>

                                            <div className="text-right min-w-[100px]">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                                    Grade Status
                                                </p>
                                                {getStatusBadge(attempt.status)}
                                            </div>

                                            <div className="text-right min-w-[80px]">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                                    Performance
                                                </p>
                                                {attempt.score !== null ? (
                                                    <div className="space-y-0.5">
                                                        <p className={cn(
                                                            "text-xl font-black italic tracking-tighter",
                                                            (attempt.percentage ?? 0) >= (exam.passing_score ?? 70) ? "text-emerald-600" : "text-rose-600"
                                                        )}>
                                                            {attempt.percentage}%
                                                        </p>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase">
                                                            {attempt.score} / {attempt.total_points} PTS
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-xl font-black italic text-slate-300 tracking-tighter">—</p>
                                                )}
                                            </div>

                                            <div className="flex size-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:translate-x-2">
                                                <ArrowRightIcon className="size-5" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
                                    <ClipboardCheckIcon className="size-10 text-slate-300" />
                                </div>
                                <p className="text-xl font-black text-slate-400 uppercase tracking-tighter">No submissions yet</p>
                                <p className="text-sm font-bold text-slate-400/60 mt-1 uppercase tracking-widest italic">Waiting for students to finish</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}
