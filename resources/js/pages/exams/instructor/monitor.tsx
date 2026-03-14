import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    AlertTriangleIcon,
    CheckCircleIcon,
    ClockIcon,
    RefreshCwIcon,
    UsersIcon,
    EyeIcon,
    XCircleIcon,
    RotateCcwIcon,
    TrashIcon,
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
    ExamAttempt,
    User,
    ViolationLog,
} from '@/types';

interface ActiveStudent {
    user: User;
    attempt: ExamAttempt & {
        violation_logs: ViolationLog[];
        answers_count: number;
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
    })[];
    inProgressCount: number;
    completedCount: number;
    notStartedCount: number;
    totalAssigned: number;
    recentViolations: ViolationWithStudent[];
}

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
    const [refreshing, setRefreshing] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);

    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            router.reload({
                only: [
                    'activeStudents',
                    'attempts',
                    'inProgressCount',
                    'completedCount',
                    'notStartedCount',
                    'recentViolations',
                ],
            });
        }, 10000); // Refresh every 10 seconds

        return () => clearInterval(interval);
    }, [autoRefresh]);

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

    const handleResetAttempt = (attemptId: number) => {
        if (
            confirm(
                'Reset this attempt? The student will be able to retake the exam.',
            )
        ) {
            router.post(`/exams/${exam.id}/attempts/${attemptId}/reset`);
        }
    };

    const handleDeleteAttempt = (attemptId: number) => {
        if (
            confirm('Delete this attempt permanently? This cannot be undone.')
        ) {
            router.delete(`/exams/${exam.id}/attempts/${attemptId}`);
        }
    };

    const handleResetViolations = (attemptId: number) => {
        if (confirm('Clear all violations for this attempt?')) {
            router.post(
                `/exams/${exam.id}/attempts/${attemptId}/reset-violations`,
            );
        }
    };

    const formatDateTime = (date: string) => new Date(date).toLocaleString();

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

    const formatTime = (date: string) => {
        const d = new Date(date);
        return d.toLocaleTimeString();
    };

    const getTimeAgo = (date: string) => {
        const seconds = Math.floor(
            (Date.now() - new Date(date).getTime()) / 1000,
        );
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return `${Math.floor(seconds / 3600)}h ago`;
    };

    const getViolationColor = (type: string) => {
        const colors: Record<string, string> = {
            tab_switch: 'bg-yellow-500',
            window_blur: 'bg-orange-500',
            fullscreen_exit: 'bg-red-500',
            copy: 'bg-purple-500',
            paste: 'bg-purple-500',
            right_click: 'bg-blue-500',
            multiple_tabs: 'bg-red-600',
            devtools: 'bg-red-700',
            view_source: 'bg-red-700',
        };
        return colors[type] || 'bg-gray-500';
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Exams', href: '/exams' },
        { title: exam.title, href: `/exams/${exam.id}` },
        { title: 'Monitor', href: `/exams/${exam.id}/monitor` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Monitor: ${exam.title}`} />
            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{exam.title}</h1>
                        <p className="mt-1 opacity-90">
                            Real-time exam monitoring
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="flex cursor-pointer items-center gap-2 text-white">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) =>
                                    setAutoRefresh(e.target.checked)
                                }
                                className="size-4"
                            />
                            <span className="text-sm">Auto-refresh</span>
                        </label>
                        <Button
                            variant="secondary"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="bg-white/20 text-white hover:bg-white/30"
                        >
                            <RefreshCwIcon
                                className={`size-4 ${refreshing ? 'animate-spin' : ''}`}
                            />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <UsersIcon className="size-8 text-muted-foreground" />
                                <div>
                                    <p className="text-2xl font-bold">
                                        {totalAssigned}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Total Assigned
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <ClockIcon className="size-8 text-blue-500" />
                                <div>
                                    <p className="text-2xl font-bold">
                                        {inProgressCount}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        In Progress
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <CheckCircleIcon className="size-8 text-green-500" />
                                <div>
                                    <p className="text-2xl font-bold">
                                        {completedCount}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Completed
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <XCircleIcon className="size-8 text-gray-400" />
                                <div>
                                    <p className="text-2xl font-bold">
                                        {notStartedCount}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Not Started
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Active Students */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>
                                Active Students ({inProgressCount})
                            </CardTitle>
                            <CardDescription>
                                Students currently taking the exam
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {activeStudents.length > 0 ? (
                                <div className="space-y-3">
                                    {activeStudents.map(
                                        ({ user, attempt, last_activity }) => {
                                            const progress = Math.round(
                                                (attempt.answers_count /
                                                    exam.questions_count) *
                                                    100,
                                            );
                                            const violations =
                                                attempt.violation_logs
                                                    ?.length || 0;

                                            return (
                                                <div
                                                    key={attempt.id}
                                                    className="flex items-center gap-4 rounded-lg border p-4"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium">
                                                                {user.name}
                                                            </p>
                                                            {violations > 0 && (
                                                                <Badge
                                                                    variant="destructive"
                                                                    className="text-xs"
                                                                >
                                                                    <AlertTriangleIcon className="mr-1 size-3" />
                                                                    {violations}{' '}
                                                                    violations
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {user.email} • Last
                                                            activity:{' '}
                                                            {getTimeAgo(
                                                                last_activity,
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <p className="text-sm font-medium">
                                                                {progress}%
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {
                                                                    attempt.answers_count
                                                                }
                                                                /
                                                                {
                                                                    exam.questions_count
                                                                }{' '}
                                                                answered
                                                            </p>
                                                        </div>
                                                        <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                                                            <div
                                                                className="h-full bg-primary transition-all"
                                                                style={{
                                                                    width: `${progress}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            ) : (
                                <p className="py-8 text-center text-muted-foreground">
                                    No students currently taking the exam
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Violations */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangleIcon className="size-5 text-yellow-500" />
                                Recent Violations
                            </CardTitle>
                            <CardDescription>
                                Last 20 security violations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentViolations.length > 0 ? (
                                <div className="max-h-[400px] space-y-2 overflow-y-auto">
                                    {recentViolations.map((violation) => (
                                        <div
                                            key={violation.id}
                                            className={`flex items-start gap-2 rounded-lg p-2 text-sm ${
                                                violation.severity ===
                                                'critical'
                                                    ? 'bg-red-100 dark:bg-red-900/30'
                                                    : violation.severity ===
                                                        'high'
                                                      ? 'bg-orange-100 dark:bg-orange-900/30'
                                                      : violation.severity ===
                                                          'medium'
                                                        ? 'bg-yellow-100 dark:bg-yellow-900/30'
                                                        : 'bg-muted/50'
                                            }`}
                                        >
                                            <span
                                                className={`mt-1.5 size-2 shrink-0 rounded-full ${
                                                    violation.severity ===
                                                    'critical'
                                                        ? 'bg-red-600'
                                                        : violation.severity ===
                                                            'high'
                                                          ? 'bg-orange-500'
                                                          : violation.severity ===
                                                              'medium'
                                                            ? 'bg-yellow-500'
                                                            : 'bg-gray-400'
                                                }`}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-medium">
                                                        {violation.violation_type.replace(
                                                            /_/g,
                                                            ' ',
                                                        )}
                                                    </p>
                                                    <Badge
                                                        variant={
                                                            violation.severity ===
                                                            'critical'
                                                                ? 'destructive'
                                                                : violation.severity ===
                                                                    'high'
                                                                  ? 'destructive'
                                                                  : violation.severity ===
                                                                      'medium'
                                                                    ? 'secondary'
                                                                    : 'outline'
                                                        }
                                                        className="text-xs"
                                                    >
                                                        {violation.severity}
                                                    </Badge>
                                                    {violation.duration_seconds !==
                                                        null &&
                                                        violation.duration_seconds >
                                                            0 && (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs"
                                                            >
                                                                {
                                                                    violation.duration_seconds
                                                                }
                                                                s away
                                                            </Badge>
                                                        )}
                                                    {violation.attempt?.student
                                                        ?.name && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {
                                                                violation
                                                                    .attempt
                                                                    .student
                                                                    .name
                                                            }
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {violation.details}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatTime(
                                                        violation.occurred_at,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="py-8 text-center text-muted-foreground">
                                    No violations recorded yet
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Student Attempts Management */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Student Attempts</CardTitle>
                        <CardDescription>
                            Manage student exam attempts - reset, delete, or
                            clear violations
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
                                                    {formatDateTime(
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
                                        <div className="flex items-center gap-2">
                                            {attempt.violation_count > 0 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleResetViolations(
                                                            attempt.id,
                                                        )
                                                    }
                                                    title="Clear violations"
                                                >
                                                    <AlertTriangleIcon className="size-4" />
                                                    Clear
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleResetAttempt(
                                                        attempt.id,
                                                    )
                                                }
                                                title="Reset attempt (allow retake)"
                                            >
                                                <RotateCcwIcon className="size-4" />
                                                Reset
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    handleDeleteAttempt(
                                                        attempt.id,
                                                    )
                                                }
                                                title="Delete attempt"
                                            >
                                                <TrashIcon className="size-4 text-destructive" />
                                            </Button>
                                        </div>
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
