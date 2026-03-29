import { Head, Link } from '@inertiajs/react';
import { ClockIcon, FileTextIcon, CalendarIcon, PlayIcon, TrophyIcon, EyeIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import type { ExamForStudent } from '@/types/exam';

interface Props {
    exams: ExamForStudent[];
}

export default function StudentExamsIndex({ exams = [] }: Props) {
    const { t } = useLanguage();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('common.dashboard'), href: '/dashboard' },
        { title: t('student.exams.title'), href: '/student/exams' },
    ];

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    const now = new Date();

    const getExamStatus = (exam: ExamForStudent) => {
        const start = new Date(exam.start_time);
        const end = new Date(exam.end_time);

        if (now < start)
            return { label: t('exam.status.upcoming'), variant: 'secondary' as const };
        if (now > end) return { label: t('exam.status.ended'), variant: 'outline' as const };
        return { label: t('exam.status.available'), variant: 'default' as const };
    };

    // Split exams into available and completed
    const availableExams = exams.filter(
        (exam) =>
            exam.can_take || exam.latest_attempt?.status === 'in_progress',
    );
    const completedExams = exams.filter(
        (exam) =>
            !exam.can_take &&
            exam.latest_attempt &&
            exam.latest_attempt.status !== 'in_progress',
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('student.exams.title')} />
            <div className="flex flex-col gap-6 p-6">
                <div className="rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 p-6 text-white shadow-lg flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight">{t('student.exams.title')}</h1>
                        <p className="mt-1 opacity-90 font-medium">
                            {t('student.exams.subtitle')}
                        </p>
                    </div>
                    <Button asChild variant="secondary" className="font-black bg-white/20 hover:bg-white/30 border-white/20 text-white backdrop-blur-md">
                        <Link href="/student/results">
                            <TrophyIcon className="mr-2 size-4" />
                            {t('student.results.title')}
                        </Link>
                    </Button>
                </div>

                {/* Available Exams */}
                <section>
                    <h2 className="mb-4 text-lg font-semibold">
                        {t('student.exams.available')} ({availableExams.length})
                    </h2>
                    {availableExams.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {availableExams.map((exam) => {
                                const status = getExamStatus(exam);
                                const isInProgress =
                                    exam.latest_attempt?.status ===
                                    'in_progress';

                                return (
                                    <Card
                                        key={exam.id}
                                        className="flex h-full min-h-[280px] flex-col"
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <CardTitle className="truncate text-lg">
                                                    {exam.title}
                                                </CardTitle>
                                                <Badge
                                                    variant={status.variant}
                                                    className="shrink-0"
                                                >
                                                    {isInProgress
                                                        ? t('exam.status.inProgress')
                                                        : status.label}
                                                </Badge>
                                            </div>
                                            <CardDescription className="line-clamp-2 h-10">
                                                {exam.description ||
                                                    t('common.noResults')}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex flex-1 flex-col">
                                            <div className="flex-1 space-y-3">
                                                <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <ClockIcon className="size-4 text-muted-foreground" />
                                                        <span>
                                                            {
                                                                exam.duration_minutes
                                                            }{' '}
                                                            {t('exam.minutes')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <FileTextIcon className="size-4 text-muted-foreground" />
                                                        <span>
                                                            {
                                                                exam.questions_count
                                                            }{' '}
                                                            {t('exam.questions')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <CalendarIcon className="size-4 shrink-0" />
                                                    <span className="truncate">
                                                        {t('exam.availableUntil')}{' '}
                                                        {formatDate(
                                                            exam.end_time,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between border-t pt-4">
                                                <span className="text-sm text-muted-foreground">
                                                    {t('exam.attempts')}:{' '}
                                                    <span className="font-medium text-foreground">
                                                        {
                                                            exam.completed_attempts
                                                        }
                                                        /{exam.allowed_attempts}
                                                    </span>
                                                </span>
                                                {isInProgress ? (
                                                    <Button asChild>
                                                        <Link
                                                            href={`/exam/take/${exam.latest_attempt?.id}`}
                                                        >
                                                            <PlayIcon className="size-4" />
                                                            {t('student.exams.continue')}
                                                        </Link>
                                                    </Button>
                                                ) : exam.can_take ? (
                                                    <Button asChild>
                                                        <Link
                                                            href={`/student/exams/${exam.id}`}
                                                        >
                                                            <PlayIcon className="size-4" />
                                                            {t('student.exams.start')}
                                                        </Link>
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        disabled
                                                        variant="outline"
                                                    >
                                                        {exam.completed_attempts >= exam.allowed_attempts
                                                            ? t('student.exams.noAttempts')
                                                            : status.label}
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                                {t('student.exams.noAvailable')}
                            </CardContent>
                        </Card>
                    )}
                </section>

                {/* Completed Exams */}
                {completedExams.length > 0 && (
                    <section>
                        <h2 className="mb-4 text-lg font-semibold">
                            {t('student.exams.completed')} ({completedExams.length})
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {completedExams.map((exam) => {
                                const attempt = exam.latest_attempt;

                                return (
                                    <Card
                                        key={exam.id}
                                        className="flex h-full min-h-[200px] flex-col"
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <CardTitle className="truncate text-lg">
                                                    {exam.title}
                                                </CardTitle>
                                                <Badge
                                                    variant={
                                                        attempt?.is_published
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                    className={cn(
                                                        "shrink-0 uppercase text-[10px] font-black tracking-wider px-2 h-5",
                                                        attempt?.is_published ? "bg-emerald-500 hover:bg-emerald-600" : ""
                                                    )}
                                                >
                                                    {attempt?.is_published
                                                        ? t('exam.status.graded')
                                                        : (attempt?.status === 'graded' ? t('student.exams.pendingRelease') : t('student.exams.awaitingGrade'))}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex flex-1 flex-col">
                                            <div className="flex flex-1 items-center justify-between border-t pt-4">
                                                <div>
                                                    {attempt?.is_published ? (
                                                        <>
                                                            <div className="flex items-baseline gap-1">
                                                                <p className="text-3xl font-black tracking-tight text-emerald-600">
                                                                    {Number(
                                                                        attempt.percentage,
                                                                    ).toFixed(0)}
                                                                </p>
                                                                <span className="text-sm font-black text-emerald-600/50">%</span>
                                                            </div>
                                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                                                {t('grading.review.sidebar.score')}
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-bold text-muted-foreground italic">
                                                                {attempt?.status === 'graded' ? t('student.exams.pendingRelease') : t('student.exams.awaitingGrade')}
                                                            </p>
                                                            <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                                                                <div className="h-full bg-blue-500/30 animate-pulse w-1/2" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <Button
                                                    variant={attempt?.is_published ? "default" : "outline"}
                                                    disabled={!attempt?.is_published}
                                                    asChild={attempt?.is_published}
                                                    className={cn(
                                                        "font-black uppercase tracking-widest text-[10px]",
                                                        attempt?.is_published ? "bg-slate-900 hover:bg-slate-800" : "opacity-50"
                                                    )}
                                                >
                                                    {attempt?.is_published ? (
                                                        <Link
                                                            href={`/student/exams/${exam.id}/attempts/${attempt.id}`}
                                                        >
                                                            <EyeIcon className="mr-2 size-3.5" />
                                                            {t('student.exams.viewResults')}
                                                        </Link>
                                                    ) : (
                                                        <span>{t('student.exams.viewResults')}</span>
                                                    )}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </section>
                )}

                {exams.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground">
                                {t('student.exams.none')}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
