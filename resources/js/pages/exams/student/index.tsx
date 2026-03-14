import { Head, Link } from '@inertiajs/react';
import { ClockIcon, FileTextIcon, CalendarIcon, PlayIcon } from 'lucide-react';
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
import type { BreadcrumbItem } from '@/types';

interface ExamData {
    id: number;
    title: string;
    description: string | null;
    duration_minutes: number;
    start_time: string;
    end_time: string;
    allowed_attempts: number;
    questions_count: number;
    instructor: { id: number; name: string } | null;
    is_available: boolean;
    completed_attempts: number;
    can_take: boolean;
    latest_attempt: {
        id: number;
        status: string;
        score: number | null;
        percentage: number | null;
    } | null;
}

interface Props {
    exams: ExamData[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'My Exams', href: '/student/exams' },
];

export default function StudentExamsIndex({ exams = [] }: Props) {
    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    const now = new Date();

    const getExamStatus = (exam: ExamData) => {
        const start = new Date(exam.start_time);
        const end = new Date(exam.end_time);

        if (now < start)
            return { label: 'Upcoming', variant: 'secondary' as const };
        if (now > end) return { label: 'Ended', variant: 'outline' as const };
        return { label: 'Available', variant: 'default' as const };
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
            <Head title="My Exams" />
            <div className="flex flex-col gap-6 p-6">
                <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                    <h1 className="text-2xl font-bold">My Exams</h1>
                    <p className="mt-1 opacity-90">
                        View and take your assigned exams
                    </p>
                </div>

                {/* Available Exams */}
                <section>
                    <h2 className="mb-4 text-lg font-semibold">
                        Available Exams ({availableExams.length})
                    </h2>
                    {availableExams.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {availableExams.map((exam) => {
                                const status = getExamStatus(exam);
                                const attemptsLeft =
                                    exam.allowed_attempts -
                                    exam.completed_attempts;
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
                                                        ? 'In Progress'
                                                        : status.label}
                                                </Badge>
                                            </div>
                                            <CardDescription className="line-clamp-2 h-10">
                                                {exam.description ||
                                                    'No description'}
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
                                                            min
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <FileTextIcon className="size-4 text-muted-foreground" />
                                                        <span>
                                                            {
                                                                exam.questions_count
                                                            }{' '}
                                                            questions
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <CalendarIcon className="size-4 shrink-0" />
                                                    <span className="truncate">
                                                        Until{' '}
                                                        {formatDate(
                                                            exam.end_time,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between border-t pt-4">
                                                <span className="text-sm text-muted-foreground">
                                                    Attempts:{' '}
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
                                                            Continue
                                                        </Link>
                                                    </Button>
                                                ) : exam.can_take ? (
                                                    <Button asChild>
                                                        <Link
                                                            href={`/student/exams/${exam.id}`}
                                                        >
                                                            <PlayIcon className="size-4" />
                                                            Start
                                                        </Link>
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        disabled
                                                        variant="outline"
                                                    >
                                                        {attemptsLeft <= 0
                                                            ? 'No attempts left'
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
                                No exams available at this time.
                            </CardContent>
                        </Card>
                    )}
                </section>

                {/* Completed Exams */}
                {completedExams.length > 0 && (
                    <section>
                        <h2 className="mb-4 text-lg font-semibold">
                            Completed Exams ({completedExams.length})
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
                                                        attempt?.status ===
                                                        'graded'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                    className="shrink-0"
                                                >
                                                    {attempt?.status ===
                                                    'graded'
                                                        ? 'Graded'
                                                        : 'Submitted'}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex flex-1 flex-col">
                                            <div className="flex flex-1 items-center justify-between border-t pt-4">
                                                <div>
                                                    {attempt?.percentage !=
                                                    null ? (
                                                        <>
                                                            <p className="text-3xl font-bold">
                                                                {Number(
                                                                    attempt.percentage,
                                                                ).toFixed(0)}
                                                                %
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Score:{' '}
                                                                {attempt?.score}
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">
                                                            Awaiting grade
                                                        </p>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    asChild
                                                >
                                                    <Link
                                                        href={`/student/exams/${exam.id}/results`}
                                                    >
                                                        View Results
                                                    </Link>
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
                                You don't have any assigned exams yet.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
