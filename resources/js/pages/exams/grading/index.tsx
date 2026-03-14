import { Head, Link } from '@inertiajs/react';
import {
    ClockIcon,
    CheckCircleIcon,
    AlertTriangleIcon,
    UserIcon,
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
import type { BreadcrumbItem, Exam, ExamAttempt, User } from '@/types';

interface AttemptWithStudent extends ExamAttempt {
    student: User;
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

    const getStatusBadge = (attempt: ExamAttempt) => {
        if (attempt.status === 'graded') {
            return <Badge variant="default">Graded</Badge>;
        }
        if (
            attempt.status === 'submitted' ||
            attempt.status === 'auto_submitted'
        ) {
            return <Badge variant="outline">Pending</Badge>;
        }
        return <Badge variant="secondary">{attempt.status}</Badge>;
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
            <div className="flex flex-col gap-6 p-6">
                <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                    <h1 className="text-2xl font-bold">
                        Grading: {exam.title}
                    </h1>
                    <p className="mt-1 opacity-90">
                        Review and grade student submissions
                    </p>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-2xl font-bold">
                                    {stats.total}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Total Submissions
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-2xl font-bold">
                                    {stats.completed}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Completed
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-yellow-600">
                                    {stats.pending_grading}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Need Grading
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-2xl font-bold">
                                    {stats.average_score !== null
                                        ? `${Number(stats.average_score).toFixed(1)}%`
                                        : '—'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Average Score
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Attempts List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Student Submissions</CardTitle>
                        <CardDescription>
                            Click on a submission to grade it
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {attempts.length > 0 ? (
                            <div className="space-y-2">
                                {attempts.map((attempt) => (
                                    <Link
                                        key={attempt.id}
                                        href={`/grading/attempt/${attempt.id}`}
                                        className="flex items-center justify-between gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                                <UserIcon className="size-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {attempt.student.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {attempt.student.email}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {attempt.violation_count > 0 && (
                                                <Badge
                                                    variant="destructive"
                                                    className="text-xs"
                                                >
                                                    <AlertTriangleIcon className="mr-1 size-3" />
                                                    {attempt.violation_count}{' '}
                                                    violations
                                                </Badge>
                                            )}

                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">
                                                    Submitted{' '}
                                                    {formatDate(
                                                        attempt.submitted_at ||
                                                            attempt.started_at,
                                                    )}
                                                </p>
                                                {attempt.score !== null && (
                                                    <p className="font-medium">
                                                        {Number(
                                                            attempt.score,
                                                        ).toFixed(1)}
                                                        % (
                                                        {attempt.points_earned}/
                                                        {attempt.total_points}{' '}
                                                        pts)
                                                    </p>
                                                )}
                                            </div>

                                            {getStatusBadge(attempt)}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="py-8 text-center text-muted-foreground">
                                No submissions yet
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
