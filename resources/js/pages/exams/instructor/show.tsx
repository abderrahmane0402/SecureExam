import { Head, Link } from '@inertiajs/react';
import {
    CalendarIcon,
    ClockIcon,
    UsersIcon,
    FileTextIcon,
    EditIcon,
    PlayIcon,
    ClipboardCheckIcon,
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={exam.title} />
            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <h1 className="text-2xl font-bold">{exam.title}</h1>
                            <Badge
                                variant="secondary"
                                className={
                                    exam.is_published
                                        ? isActive
                                            ? 'bg-green-500/20 text-green-100'
                                            : 'bg-white/20 text-white'
                                        : 'bg-white/20 text-white/70'
                                }
                            >
                                {exam.is_published
                                    ? isActive
                                        ? 'Active'
                                        : 'Published'
                                    : 'Draft'}
                            </Badge>
                        </div>
                        {exam.description && (
                            <p className="opacity-90">{exam.description}</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            asChild
                            className="bg-white/20 text-white hover:bg-white/30"
                        >
                            <Link href={`/exams/${exam.id}/edit`}>
                                <EditIcon className="size-4" />
                                Edit
                            </Link>
                        </Button>
                        <Button
                            asChild
                            className="bg-white text-blue-600 hover:bg-white/90"
                        >
                            <Link href={`/exams/${exam.id}/monitor`}>
                                <PlayIcon className="size-4" />
                                Monitor
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Exam Details */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Exam Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="flex items-center gap-3">
                                <ClockIcon className="size-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">
                                        Duration
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {exam.duration_minutes} minutes
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <FileTextIcon className="size-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">
                                        Questions
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {exam.questions?.length || 0} questions
                                        ({totalPoints} points)
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <CalendarIcon className="size-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">
                                        Available
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDate(exam.start_time)} -{' '}
                                        {formatDate(exam.end_time)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <UsersIcon className="size-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">
                                        Attempts
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {exam.allowed_attempts} per student
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Statistics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Assigned Students
                                </span>
                                <span className="font-medium">
                                    {exam.assigned_students?.length || 0}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Total Attempts
                                </span>
                                <span className="font-medium">
                                    {exam.attempts_count || 0}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Passing Score
                                </span>
                                <span className="font-medium">
                                    {exam.passing_score}%
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full"
                                asChild
                            >
                                <Link href={`/exams/${exam.id}/assign`}>
                                    <UsersIcon className="size-4" />
                                    Assign Students
                                </Link>
                            </Button>
                            <Button
                                variant="default"
                                className="w-full"
                                asChild
                            >
                                <Link href={`/grading/${exam.id}`}>
                                    <ClipboardCheckIcon className="size-4" />
                                    Grade Submissions
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Questions Preview */}
                <Card>
                    <CardHeader>
                        <CardTitle>Questions Preview</CardTitle>
                        <CardDescription>
                            {exam.shuffle_questions &&
                                '⚡ Questions will be shuffled for each student'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {exam.questions?.length > 0 ? (
                            <div className="space-y-3">
                                {exam.questions.map((question, index) => (
                                    <div
                                        key={question.id}
                                        className="flex items-start gap-3 rounded-lg border p-3"
                                    >
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                            {index + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium">
                                                {question.content}
                                            </p>
                                            <div className="mt-1 flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {question.type.replace(
                                                        /_/g,
                                                        ' ',
                                                    )}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {question.points} pts
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="py-8 text-center text-muted-foreground">
                                No questions added yet.{' '}
                                <Link
                                    href={`/exams/${exam.id}/edit`}
                                    className="text-primary hover:underline"
                                >
                                    Add questions
                                </Link>
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Assigned Students */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>
                                Assigned Students (
                                {exam.assigned_students?.length || 0})
                            </CardTitle>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/exams/${exam.id}/assign`}>
                                    Manage
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {exam.assigned_students?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {exam.assigned_students
                                    .slice(0, 20)
                                    .map((student) => (
                                        <Badge
                                            key={student.id}
                                            variant="secondary"
                                        >
                                            {student.name}
                                        </Badge>
                                    ))}
                                {exam.assigned_students.length > 20 && (
                                    <Badge variant="outline">
                                        +{exam.assigned_students.length - 20}{' '}
                                        more
                                    </Badge>
                                )}
                            </div>
                        ) : (
                            <p className="py-4 text-center text-muted-foreground">
                                No students assigned yet.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Student Attempts */}
                <Card>
                    <CardHeader>
                        <CardTitle>Student Attempts</CardTitle>
                        <CardDescription>
                            Overview of all exam attempts
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {attempts.length === 0 ? (
                            <p className="py-8 text-center text-muted-foreground">
                                No attempts yet. Students will appear here once
                                they start the exam.
                            </p>
                        ) : (
                            <div className="divide-y">
                                {attempts.map((attempt) => (
                                    <div
                                        key={attempt.id}
                                        className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                                                <UserIcon className="size-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">
                                                        {attempt.student?.name}
                                                    </span>
                                                    <Badge
                                                        variant={getStatusBadge(
                                                            attempt.status,
                                                        )}
                                                    >
                                                        {attempt.status.replace(
                                                            /_/g,
                                                            ' ',
                                                        )}
                                                    </Badge>
                                                    {attempt.violation_count >
                                                        0 && (
                                                        <Badge
                                                            variant="destructive"
                                                            className="gap-1"
                                                        >
                                                            <AlertTriangleIcon className="size-3" />
                                                            {
                                                                attempt.violation_count
                                                            }{' '}
                                                            violations
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    Attempt #
                                                    {attempt.attempt_number} •{' '}
                                                    Started{' '}
                                                    {formatDate(
                                                        attempt.started_at,
                                                    )}
                                                    {attempt.score !== null && (
                                                        <>
                                                            {' '}
                                                            • Score:{' '}
                                                            {attempt.score}/
                                                            {
                                                                attempt.total_points
                                                            }{' '}
                                                            (
                                                            {attempt.percentage}
                                                            %)
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <Link
                                                href={`/grading/attempt/${attempt.id}`}
                                            >
                                                View Details
                                            </Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
