import { Head, Link } from '@inertiajs/react';
import {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    AlertTriangleIcon,
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
import type {
    BreadcrumbItem,
    Exam,
    ExamAttempt,
    Question,
    ExamAnswer,
} from '@/types';

interface Props {
    exam: Exam & {
        questions: (Question & { pivot_answer?: ExamAnswer })[];
        passing_score: number;
    };
    attempt: ExamAttempt & {
        answers: ExamAnswer[];
    };
}

export default function StudentExamResults({ exam, attempt }: Props) {
    const { t } = useLanguageStandalone();
    const passed = exam.passing_score
        ? (attempt.score || 0) >= exam.passing_score
        : null;

    const getAnswerForQuestion = (questionId: number) =>
        attempt.answers?.find((a) => a.question_id === questionId);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('common.dashboard'), href: '/dashboard' },
        { title: t('student.exams.title'), href: '/student/exams' },
        { title: exam.title, href: `/student/exams/${exam.id}` },
        { title: t('dashboard.results'), href: `/student/exams/${exam.id}/results` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('dashboard.results')}: ${exam.title}`} />
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 sm:p-6">
                {/* Header */}
                <div className="rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 p-5 sm:p-6 text-center text-white">
                    <h1 className="text-xl sm:text-2xl font-bold break-words">{exam.title}</h1>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
                        <div className="text-center">
                            <p className="text-4xl font-bold">
                                {attempt.score != null
                                    ? Number(attempt.score).toFixed(1)
                                    : '—'}
                                %
                            </p>
                            <p className="text-sm opacity-90">{t('student.results.yourScore')}</p>
                        </div>
                        {passed !== null && (
                            <Badge
                                variant="secondary"
                                className={
                                    passed
                                        ? 'bg-emerald-500/20 text-emerald-100'
                                        : 'bg-red-500/20 text-red-100'
                                }
                            >
                                {passed ? (
                                    <>
                                        <CheckCircleIcon className="size-4" />
                                        {t('student.results.passed')}
                                    </>
                                ) : (
                                    <>
                                        <XCircleIcon className="size-4" />
                                        {t('student.results.failed')}
                                    </>
                                )}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Summary */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('student.results.attemptSummary')}</CardTitle>
                        {attempt.penalty_points && (
                            <Badge variant="destructive" className="animate-pulse bg-rose-600 font-bold">
                                {t('student.grade.penaltyApplied')}: -{attempt.penalty_points} PTS
                            </Badge>
                        )}
                    </CardHeader>
                    <CardContent>
                        {attempt.penalty_points && (
                            <div className="mb-6 rounded-lg border border-red-100 bg-red-50 p-4 dark:bg-red-950/20 dark:border-red-900/30">
                                <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
                                    <AlertTriangleIcon className="size-4" />
                                    <p className="text-sm font-bold uppercase tracking-wide">{t('student.results.disciplinaryDeduction')}</p>
                                </div>
                                <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                                    {t('student.results.penaltyInfo', [attempt.penalty_points])}
                                </p>
                                <div className="mt-3 rounded border border-red-200 bg-white/50 p-3 italic text-red-900 dark:bg-black/20 dark:text-red-200 dark:border-red-800">
                                    "{attempt.penalty_reason}"
                                </div>
                            </div>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg bg-muted/50 p-3 text-center">
                            <p className="text-2xl font-bold">
                                {attempt.points_earned != null
                                    ? Number(attempt.points_earned).toFixed(1)
                                    : 0}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {t('student.results.ofPoints', [attempt.total_points])}
                            </p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3 text-center">
                            <p className="text-2xl font-bold">
                                {exam.passing_score}%
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {t('student.results.passingScoreLabel')}
                            </p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                                <ClockIcon className="size-4 text-muted-foreground" />
                                <p className="text-lg font-bold">
                                    {attempt.submitted_at
                                        ? Math.round(
                                              (new Date(
                                                  attempt.submitted_at,
                                              ).getTime() -
                                                  new Date(
                                                      attempt.started_at,
                                                  ).getTime()) /
                                                  60000,
                                          )
                                        : '—'}
                                </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {t('student.results.minutesTaken')}
                            </p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                                {attempt.violation_count > 0 && (
                                    <AlertTriangleIcon className="size-4 text-yellow-500" />
                                )}
                                <p className="text-2xl font-bold">
                                    {attempt.violation_count}
                                </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {t('monitor.table.security')}
                            </p>
                        </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Question Results */}
                {exam.show_results && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('student.results.questionReview')}</CardTitle>
                            <CardDescription>
                                {t('student.results.questionReviewDesc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {exam.questions?.map((question, index) => {
                                const answer = getAnswerForQuestion(
                                    question.id,
                                );
                                const isCorrect = answer?.is_correct;
                                const isGraded = answer?.is_correct !== null;

                                return (
                                    <div
                                        key={question.id}
                                        className={`rounded-lg border p-4 ${
                                            isCorrect === true
                                                ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20'
                                                : isCorrect === false
                                                  ? 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20'
                                                  : ''
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span
                                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs text-white ${
                                                    isCorrect === true
                                                        ? 'bg-emerald-500'
                                                        : isCorrect === false
                                                          ? 'bg-red-500'
                                                          : 'bg-muted-foreground'
                                                }`}
                                            >
                                                {index + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-start justify-between gap-2">
                                                    <p className="font-medium min-w-0 break-words whitespace-pre-wrap">
                                                        {question.content}
                                                    </p>
                                                    <div className="flex shrink-0 flex-wrap items-center gap-2 ml-auto">
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {answer?.points_earned !=
                                                            null
                                                                ? Number(
                                                                      answer.points_earned,
                                                                  ).toFixed(1)
                                                                : 0}
                                                            /{question.points}{' '}
                                                            pts
                                                        </Badge>
                                                        {!isGraded && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-xs"
                                                            >
                                                                {t('exam.status.draft')}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Show answer based on question type */}
                                                {question.type ===
                                                    'multiple_choice_single' ||
                                                question.type ===
                                                    'multiple_choice_multiple' ? (
                                                    <div className="mt-3 space-y-2">
                                                        {question.options?.map(
                                                            (option) => {
                                                                const wasSelected =
                                                                    answer?.selected_options?.includes(
                                                                        option.id,
                                                                    );
                                                                const isCorrectOption =
                                                                    option.is_correct;

                                                                return (
                                                                    <div
                                                                        key={
                                                                            option.id
                                                                        }
                                                                        className={`rounded p-2 text-sm ${
                                                                            isCorrectOption
                                                                                ? 'bg-emerald-100 dark:bg-emerald-900/30'
                                                                                : wasSelected
                                                                                  ? 'bg-red-100 dark:bg-red-900/30'
                                                                                  : ''
                                                                        }`}
                                                                    >
                                                                        <span className="flex items-center gap-2">
                                                                            {wasSelected && (
                                                                                <span className="text-xs font-medium">
                                                                                    {t('student.grade.yourAnswer')} →
                                                                                </span>
                                                                            )}
                                                                            {
                                                                                option.content
                                                                            }
                                                                            {isCorrectOption && (
                                                                                <CheckCircleIcon className="size-4 text-emerald-500" />
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                ) : question.type ===
                                                  'true_false' ? (
                                                    <div className="mt-3 text-sm">
                                                        <p>
                                                            <strong>
                                                                {t('student.grade.yourAnswer')}:
                                                            </strong>{' '}
                                                            {answer?.text_answer ||
                                                                t('student.results.notAnswered')}
                                                        </p>
                                                        <p className="text-emerald-600">
                                                            <strong>
                                                                {t('student.grade.correctAnswer')}:
                                                            </strong>{' '}
                                                            {
                                                                question.correct_answer
                                                            }
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="mt-3 space-y-2 text-sm">
                                                        <div>
                                                            <strong>
                                                                {t('student.grade.yourAnswer')}:
                                                            </strong>
                                                            <p className="mt-1 rounded bg-muted p-2">
                                                                {answer?.text_answer ||
                                                                    t('student.results.notAnswered')}
                                                            </p>
                                                        </div>
                                                        {answer?.instructor_feedback && (
                                                            <div>
                                                                <strong>
                                                                    {t('student.grade.feedback')}:
                                                                </strong>
                                                                <p className="mt-1 rounded bg-blue-50 p-2 dark:bg-blue-950/30">
                                                                    {
                                                                        answer.instructor_feedback
                                                                    }
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-center">
                    <Button variant="outline" asChild>
                        <Link href="/student/exams">{t('student.results.backToExams')}</Link>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
