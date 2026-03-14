import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    AlertTriangleIcon,
    CalendarIcon,
    ClockIcon,
    FileTextIcon,
    PlayIcon,
    ShieldIcon,
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem, Exam, ExamAttempt } from '@/types';

interface Props {
    exam: Exam & {
        questions_count: number;
        total_points: number;
        is_available: boolean;
    };
    attempts: ExamAttempt[];
    can_take: boolean;
    remaining_attempts: number;
}

export default function StudentExamShow({
    exam,
    attempts,
    can_take,
    remaining_attempts,
}: Props) {
    const [acknowledged, setAcknowledged] = useState(false);
    const [starting, setStarting] = useState(false);

    const formatDate = (date: string) => new Date(date).toLocaleString();
    const attemptsUsed = attempts.length;
    const attemptsLeft = remaining_attempts;
    const inProgressAttempt = attempts.find((a) => a.status === 'in_progress');

    const isAvailable = exam.is_available;

    const handleStart = () => {
        setStarting(true);
        router.post(`/student/exams/${exam.id}/start`);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'My Exams', href: '/student/exams' },
        { title: exam.title, href: `/student/exams/${exam.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={exam.title} />
            <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
                <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center text-white">
                    <h1 className="text-2xl font-bold">{exam.title}</h1>
                    {exam.description && (
                        <p className="mt-2 opacity-90">{exam.description}</p>
                    )}
                </div>

                {/* Exam Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Exam Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="flex items-center gap-3">
                            <ClockIcon className="size-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Duration</p>
                                <p className="text-sm text-muted-foreground">
                                    {exam.duration_minutes} minutes
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <FileTextIcon className="size-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Questions</p>
                                <p className="text-sm text-muted-foreground">
                                    {exam.questions_count} questions (
                                    {exam.total_points} points)
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <CalendarIcon className="size-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Available Until</p>
                                <p className="text-sm text-muted-foreground">
                                    {formatDate(exam.end_time)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <PlayIcon className="size-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Attempts</p>
                                <p className="text-sm text-muted-foreground">
                                    {attemptsUsed} of {exam.allowed_attempts}{' '}
                                    used
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Security Notice */}
                <Card className="border-yellow-500/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-600">
                            <ShieldIcon className="size-5" />
                            Important Rules
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <p className="flex items-start gap-2">
                            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-yellow-500" />
                            The exam will run in{' '}
                            <strong>fullscreen mode</strong>. Exiting fullscreen
                            will be logged as a violation.
                        </p>
                        <p className="flex items-start gap-2">
                            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-yellow-500" />
                            <strong>Tab switching</strong> and{' '}
                            <strong>window focus loss</strong> will be detected
                            and logged.
                        </p>
                        <p className="flex items-start gap-2">
                            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-yellow-500" />
                            <strong>Copy, paste, and right-click</strong> are
                            disabled during the exam.
                        </p>
                        <p className="flex items-start gap-2">
                            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-yellow-500" />
                            Multiple violations may result in{' '}
                            <strong>automatic submission</strong> of your exam.
                        </p>
                        <p className="flex items-start gap-2">
                            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-yellow-500" />
                            Your answers are <strong>auto-saved</strong>, but
                            make sure to submit before time runs out.
                        </p>
                    </CardContent>
                </Card>

                {/* Previous Attempts */}
                {attempts.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Attempts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {attempts.map((attempt) => (
                                    <div
                                        key={attempt.id}
                                        className="flex items-center justify-between rounded-lg border p-3"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                Attempt {attempt.attempt_number}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(attempt.started_at)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {attempt.violation_count > 0 && (
                                                <Badge
                                                    variant="destructive"
                                                    className="text-xs"
                                                >
                                                    {attempt.violation_count}{' '}
                                                    violations
                                                </Badge>
                                            )}
                                            <Badge
                                                variant={
                                                    attempt.status === 'graded'
                                                        ? 'default'
                                                        : attempt.status ===
                                                            'in_progress'
                                                          ? 'secondary'
                                                          : 'outline'
                                                }
                                            >
                                                {attempt.status === 'graded' &&
                                                attempt.score !== null
                                                    ? `${Number(attempt.score).toFixed(0)}%`
                                                    : attempt.status.replace(
                                                          '_',
                                                          ' ',
                                                      )}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Action */}
                <Card>
                    <CardContent className="pt-6">
                        {inProgressAttempt ? (
                            <div className="space-y-4 text-center">
                                <p className="text-muted-foreground">
                                    You have an exam in progress.
                                </p>
                                <Button size="lg" asChild>
                                    <a href={`/student/exams/${exam.id}/take`}>
                                        <PlayIcon className="size-4" />
                                        Continue Exam
                                    </a>
                                </Button>
                            </div>
                        ) : attemptsLeft > 0 && isAvailable ? (
                            <div className="space-y-4">
                                <div className="flex items-start gap-2">
                                    <Checkbox
                                        id="acknowledge"
                                        checked={acknowledged}
                                        onCheckedChange={(checked) =>
                                            setAcknowledged(checked as boolean)
                                        }
                                    />
                                    <Label
                                        htmlFor="acknowledge"
                                        className="cursor-pointer text-sm"
                                    >
                                        I understand the exam rules and that my
                                        activity will be monitored. I am ready
                                        to start the exam.
                                    </Label>
                                </div>
                                <Button
                                    size="lg"
                                    className="w-full"
                                    disabled={!acknowledged || starting}
                                    onClick={handleStart}
                                >
                                    <PlayIcon className="size-4" />
                                    {starting
                                        ? 'Starting...'
                                        : `Start Exam (Attempt ${attemptsUsed + 1} of ${exam.allowed_attempts})`}
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground">
                                {!isAvailable ? (
                                    <p>This exam is not currently available.</p>
                                ) : (
                                    <p>
                                        You have used all your attempts for this
                                        exam.
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
