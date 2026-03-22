import { Head, router } from '@inertiajs/react';
import {
    AlertTriangleIcon,
    CalendarIcon,
    ClockIcon,
    FileTextIcon,
    PlayIcon,
    ShieldIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/hooks/use-language';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Exam, ExamAttempt } from '@/types';

interface Props {
    exam: Exam & {
        questions_count: number;
        total_points: number;
        is_available: boolean;
    };
    attempts: ExamAttempt[];
    remaining_attempts: number;
}

export default function StudentExamShow({
    exam,
    attempts,
    remaining_attempts,
}: Props) {
    const { t } = useLanguage();
    const [acknowledged, setAcknowledged] = useState(false);
    const [starting, setStarting] = useState(false);

    const formatDate = (date: string) => new Date(date).toLocaleString();
    const attemptsUsed = attempts.length;
    const attemptsLeft = remaining_attempts;
    const inProgressAttempt = attempts.find((a) => a.status === 'in_progress');

    const isAvailable = exam.is_available;

    const handleStart = () => {
        setStarting(true);
        const params = new URLSearchParams(window.location.search);
        const query = params.has('no_security') ? '?no_security=1' : '';
        router.post(`/student/exams/${exam.id}/start${query}`);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('common.dashboard'), href: '/dashboard' },
        { title: t('student.exams.title'), href: '/student/exams' },
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
                        <CardTitle>{t('student.exam.info')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="flex items-center gap-3">
                            <ClockIcon className="size-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">{t('exam.duration')}</p>
                                <p className="text-sm text-muted-foreground">
                                    {exam.duration_minutes} {t('exam.minutes')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <FileTextIcon className="size-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">{t('exam.questions')}</p>
                                <p className="text-sm text-muted-foreground">
                                    {exam.questions_count} {t('exam.questions')} (
                                    {exam.total_points} {t('exam.points')})
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <CalendarIcon className="size-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">{t('exam.availableUntil')}</p>
                                <p className="text-sm text-muted-foreground">
                                    {formatDate(exam.end_time)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <PlayIcon className="size-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">{t('exam.attempts')}</p>
                                <p className="text-sm text-muted-foreground">
                                    {attemptsUsed} {t('exam.of')} {exam.allowed_attempts}{' '}
                                    {t('exam.used')}
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
                            {t('student.exam.rules')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <p className="flex items-start gap-2">
                            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-yellow-500" />
                            {t('student.exam.rule.fullscreen')}
                        </p>
                        <p className="flex items-start gap-2">
                            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-yellow-500" />
                            {t('student.exam.rule.tabs')}
                        </p>
                        <p className="flex items-start gap-2">
                            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-yellow-500" />
                            {t('student.exam.rule.copyPaste')}
                        </p>
                        <p className="flex items-start gap-2">
                            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-yellow-500" />
                            {t('student.exam.rule.autoSubmit')}
                        </p>
                        <p className="flex items-start gap-2">
                            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-yellow-500" />
                            {t('student.exam.rule.autoSave')}
                        </p>
                    </CardContent>
                </Card>

                {/* Previous Attempts */}
                {attempts.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('student.exam.attempts')}</CardTitle>
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
                                                {t('student.exam.attemptNumber')} {attempt.attempt_number}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(attempt.started_at)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {attempt.violation_count !== undefined && attempt.violation_count > 0 && (
                                                <Badge
                                                    variant="destructive"
                                                    className="text-xs"
                                                >
                                                    {attempt.violation_count}{' '}
                                                    {t('exam.violations')}
                                                </Badge>
                                            )}
                                            <Badge
                                                variant={
                                                    attempt.status === 'graded'
                                                        ? 'default'
                                                        : attempt.status === 'auto_submitted'
                                                          ? 'destructive'
                                                          : attempt.status === 'in_progress'
                                                            ? 'secondary'
                                                            : 'outline'
                                                }
                                            >
                                                {attempt.status === 'graded' &&
                                                attempt.score !== null
                                                    ? `${Number(attempt.score).toFixed(0)}%`
                                                    : attempt.status === 'auto_submitted'
                                                      ? t('exam.status.autoSubmitted')
                                                      : attempt.status === 'in_progress'
                                                        ? t('exam.status.inProgress')
                                                        : t('exam.status.submitted')}
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
                                    {t('student.exam.inProgressDesc')}
                                </p>
                                <Button size="lg" asChild>
                                    <a href={`/exam/take/${inProgressAttempt.id}`}>
                                        <PlayIcon className="size-4" />
                                        {t('student.exams.continue')}
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
                                        {t('student.exam.acknowledge')}
                                    </Label>
                                </div>
                                <Button
                                    size="lg"
                                    data-test="start-exam-button"
                                    className="w-full"
                                    disabled={!acknowledged || starting}
                                    onClick={handleStart}
                                >

                                    <PlayIcon className="size-4" />
                                    {starting
                                        ? t('student.exam.starting')
                                        : `${t('student.exams.start')} (${t('student.exam.attemptNumber')} ${attemptsUsed + 1} ${t('exam.of')} ${exam.allowed_attempts})`}
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground">
                                {!isAvailable ? (
                                    <p>{t('student.exam.notAvailable')}</p>
                                ) : (
                                    <p>
                                        {t('student.exam.allAttemptsUsed')}
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
