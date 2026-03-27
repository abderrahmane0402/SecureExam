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
    const passed = exam.passing_score
        ? (attempt.score || 0) >= exam.passing_score
        : null;

    const getAnswerForQuestion = (questionId: number) =>
        attempt.answers?.find((a) => a.question_id === questionId);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'My Exams', href: '/student/exams' },
        { title: exam.title, href: `/student/exams/${exam.id}` },
        { title: 'Results', href: `/student/exams/${exam.id}/results` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Results: ${exam.title}`} />
            <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
                {/* Header */}
                <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center text-white">
                    <h1 className="text-2xl font-bold">{exam.title}</h1>
                    <div className="mt-4 flex items-center justify-center gap-4">
                        <div className="text-center">
                            <p className="text-4xl font-bold">
                                {attempt.score != null
                                    ? Number(attempt.score).toFixed(1)
                                    : '—'}
                                %
                            </p>
                            <p className="text-sm opacity-90">Your Score</p>
                        </div>
                        {passed !== null && (
                            <Badge
                                variant="secondary"
                                className={
                                    passed
                                        ? 'bg-green-500/20 text-green-100'
                                        : 'bg-red-500/20 text-red-100'
                                }
                            >
                                {passed ? (
                                    <>
                                        <CheckCircleIcon className="size-4" />
                                        Passed
                                    </>
                                ) : (
                                    <>
                                        <XCircleIcon className="size-4" />
                                        Failed
                                    </>
                                )}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Summary */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Attempt Summary</CardTitle>
                        {attempt.penalty_points && (
                            <Badge variant="destructive" className="animate-pulse bg-rose-600 font-bold">
                                Penalty Applied: -{attempt.penalty_points} PTS
                            </Badge>
                        )}
                    </CardHeader>
                    <CardContent>
                        {attempt.penalty_points && (
                            <div className="mb-6 rounded-lg border border-red-100 bg-red-50 p-4 dark:bg-red-950/20 dark:border-red-900/30">
                                <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
                                    <AlertTriangleIcon className="size-4" />
                                    <p className="text-sm font-bold uppercase tracking-wide">Disciplinary Deduction</p>
                                </div>
                                <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                                    A penalty of <strong>{attempt.penalty_points} points</strong> was applied to this attempt.
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
                                of {attempt.total_points} points
                            </p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3 text-center">
                            <p className="text-2xl font-bold">
                                {exam.passing_score}%
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Passing Score
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
                                Minutes Taken
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
                                Violations
                            </p>
                        </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Question Results */}
                {exam.show_results && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Question Review</CardTitle>
                            <CardDescription>
                                Review your answers and see the correct
                                solutions
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
                                                ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20'
                                                : isCorrect === false
                                                  ? 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20'
                                                  : ''
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span
                                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs text-white ${
                                                    isCorrect === true
                                                        ? 'bg-green-500'
                                                        : isCorrect === false
                                                          ? 'bg-red-500'
                                                          : 'bg-muted-foreground'
                                                }`}
                                            >
                                                {index + 1}
                                            </span>
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="font-medium">
                                                        {question.content}
                                                    </p>
                                                    <div className="flex shrink-0 items-center gap-2">
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
                                                                Pending
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
                                                                                ? 'bg-green-100 dark:bg-green-900/30'
                                                                                : wasSelected
                                                                                  ? 'bg-red-100 dark:bg-red-900/30'
                                                                                  : ''
                                                                        }`}
                                                                    >
                                                                        <span className="flex items-center gap-2">
                                                                            {wasSelected && (
                                                                                <span className="text-xs font-medium">
                                                                                    Your
                                                                                    answer
                                                                                    →
                                                                                </span>
                                                                            )}
                                                                            {
                                                                                option.content
                                                                            }
                                                                            {isCorrectOption && (
                                                                                <CheckCircleIcon className="size-4 text-green-500" />
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
                                                                Your answer:
                                                            </strong>{' '}
                                                            {answer?.text_answer ||
                                                                'Not answered'}
                                                        </p>
                                                        <p className="text-green-600">
                                                            <strong>
                                                                Correct answer:
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
                                                                Your answer:
                                                            </strong>
                                                            <p className="mt-1 rounded bg-muted p-2">
                                                                {answer?.text_answer ||
                                                                    'Not answered'}
                                                            </p>
                                                        </div>
                                                        {answer?.instructor_feedback && (
                                                            <div>
                                                                <strong>
                                                                    Instructor
                                                                    feedback:
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
                        <Link href="/student/exams">Back to My Exams</Link>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
