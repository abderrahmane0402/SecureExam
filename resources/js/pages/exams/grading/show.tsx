import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    CheckCircleIcon,
    XCircleIcon,
    AlertTriangleIcon,
    UserIcon,
    SaveIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
    BreadcrumbItem,
    Exam,
    ExamAttempt,
    Question,
    ExamAnswer,
    User,
    ViolationLog,
} from '@/types';

interface QuestionWithAnswer extends Question {
    answer?: ExamAnswer;
}

interface Props {
    exam: Exam;
    attempt: ExamAttempt & {
        student: User;
        violation_logs: ViolationLog[];
    };
    questions: QuestionWithAnswer[];
    previousAttemptId?: number;
    nextAttemptId?: number;
}

export default function GradeAttempt({
    exam,
    attempt,
    questions,
    previousAttemptId,
    nextAttemptId,
}: Props) {
    const [savingQuestion, setSavingQuestion] = useState<number | null>(null);

    const formatDate = (date: string) => new Date(date).toLocaleString();

    const handleGradeAnswer = async (
        answerId: number,
        points: number,
        feedback: string,
    ) => {
        setSavingQuestion(answerId);
        try {
            await fetch(`/grading/attempt/${attempt.id}/answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'))?.[2] || ''),
                },
                body: JSON.stringify({
                    answer_id: answerId,
                    points_earned: points,
                    feedback: feedback,
                }),
            });
            router.reload({ only: ['questions', 'attempt'] });
        } finally {
            setSavingQuestion(null);
        }
    };

    const handleFinalize = () => {
        if (
            confirm(
                'Finalize grading? This will calculate the final score for this attempt.',
            )
        ) {
            router.post(`/grading/attempt/${attempt.id}/finalize`);
        }
    };

    const needsManualGrading = questions.some((q) => {
        const isManualType = q.type === 'essay' || q.type === 'short_text';
        const answer = q.answer;
        return isManualType && answer && answer.is_correct === null;
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Exams', href: '/exams' },
        { title: exam.title, href: `/exams/${exam.id}` },
        { title: 'Grading', href: `/grading/${exam.id}` },
        {
            title: attempt.student.name,
            href: `/grading/attempt/${attempt.id}`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Grade: ${attempt.student.name}`} />
            <div className="flex flex-col gap-6 p-6">
                {/* Header with navigation */}
                <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                            <UserIcon className="size-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">
                                {attempt.student.name}
                            </h1>
                            <p className="text-sm opacity-90">
                                {attempt.student.email}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {previousAttemptId && (
                            <Button
                                variant="secondary"
                                asChild
                                className="bg-white/20 text-white hover:bg-white/30"
                            >
                                <a
                                    href={`/grading/attempt/${previousAttemptId}`}
                                >
                                    <ChevronLeftIcon className="size-4" />
                                    Previous
                                </a>
                            </Button>
                        )}
                        {nextAttemptId && (
                            <Button
                                variant="secondary"
                                asChild
                                className="bg-white/20 text-white hover:bg-white/30"
                            >
                                <a href={`/grading/attempt/${nextAttemptId}`}>
                                    Next
                                    <ChevronRightIcon className="size-4" />
                                </a>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Summary */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-2xl font-bold">
                                {attempt.score !== null
                                    ? `${Number(attempt.score).toFixed(1)}%`
                                    : '—'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Score
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-2xl font-bold">
                                {Number(attempt.points_earned ?? 0).toFixed(1)}/
                                {attempt.total_points}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Points
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-2xl font-bold">
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
                            <p className="text-sm text-muted-foreground">
                                Minutes
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p
                                className={`text-2xl font-bold ${attempt.violation_count > 0 ? 'text-red-600' : ''}`}
                            >
                                {attempt.violation_count}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Violations
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Violations */}
                {attempt.violation_logs?.length > 0 && (
                    <Card className="border-yellow-500/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-yellow-600">
                                <AlertTriangleIcon className="size-5" />
                                Security Violations (
                                {attempt.violation_logs.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-40 space-y-2 overflow-y-auto">
                                {attempt.violation_logs.map((v) => (
                                    <div
                                        key={v.id}
                                        className="flex items-center justify-between rounded bg-muted/50 p-2 text-sm"
                                    >
                                        <span className="font-medium">
                                            {v.violation_type.replace(
                                                /_/g,
                                                ' ',
                                            )}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {formatDate(v.occurred_at)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Questions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Answers</CardTitle>
                        <CardDescription>
                            Review answers and assign points for manual grading
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {questions.map((question, index) => {
                            const answer = question.answer;
                            const isAutoGraded = [
                                'multiple_choice_single',
                                'multiple_choice_multiple',
                                'true_false',
                            ].includes(question.type);
                            const needsGrading =
                                !isAutoGraded &&
                                answer &&
                                answer.is_correct === null;

                            return (
                                <div
                                    key={question.id}
                                    className={`rounded-lg border p-4 ${
                                        answer?.is_correct === true
                                            ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20'
                                            : answer?.is_correct === false
                                              ? 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20'
                                              : needsGrading
                                                ? 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20'
                                                : ''
                                    }`}
                                >
                                    <div className="mb-3 flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <span
                                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs text-white ${
                                                    answer?.is_correct === true
                                                        ? 'bg-green-500'
                                                        : answer?.is_correct ===
                                                            false
                                                          ? 'bg-red-500'
                                                          : 'bg-muted-foreground'
                                                }`}
                                            >
                                                {index + 1}
                                            </span>
                                            <div>
                                                <p className="font-medium">
                                                    {question.content}
                                                </p>
                                                <Badge
                                                    variant="outline"
                                                    className="mt-1 text-xs"
                                                >
                                                    {question.type.replace(
                                                        /_/g,
                                                        ' ',
                                                    )}
                                                </Badge>
                                            </div>
                                        </div>
                                        <Badge
                                            variant={
                                                needsGrading
                                                    ? 'secondary'
                                                    : 'outline'
                                            }
                                        >
                                            {Number(
                                                answer?.points_earned ?? 0,
                                            ).toFixed(1)}
                                            /{question.points} pts
                                        </Badge>
                                    </div>

                                    {/* Answer display */}
                                    <div className="ml-9 space-y-3">
                                        {(question.type ===
                                            'multiple_choice_single' ||
                                            question.type ===
                                                'multiple_choice_multiple') && (
                                            <div className="space-y-1">
                                                {question.options?.map(
                                                    (opt) => {
                                                        const selected =
                                                            answer?.selected_options?.includes(
                                                                opt.id,
                                                            );
                                                        return (
                                                            <div
                                                                key={opt.id}
                                                                className={`rounded p-2 text-sm ${
                                                                    opt.is_correct
                                                                        ? 'bg-green-100 dark:bg-green-900/30'
                                                                        : selected
                                                                          ? 'bg-red-100 dark:bg-red-900/30'
                                                                          : 'bg-muted/50'
                                                                }`}
                                                            >
                                                                {selected && (
                                                                    <span className="font-medium">
                                                                        ✓{' '}
                                                                    </span>
                                                                )}
                                                                {opt.content}
                                                                {opt.is_correct && (
                                                                    <CheckCircleIcon className="ml-2 inline size-4 text-green-500" />
                                                                )}
                                                            </div>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        )}

                                        {question.type === 'true_false' && (
                                            <div className="space-y-1">
                                                <p className="text-sm">
                                                    <strong>
                                                        Student's answer:
                                                    </strong>{' '}
                                                    <span
                                                        className={
                                                            answer?.is_correct
                                                                ? 'text-green-600'
                                                                : 'text-red-600'
                                                        }
                                                    >
                                                        {answer?.text_answer ||
                                                            'Not answered'}
                                                    </span>
                                                </p>
                                                <p className="text-sm text-green-600">
                                                    <strong>Correct:</strong>{' '}
                                                    {question.correct_answer}
                                                </p>
                                            </div>
                                        )}

                                        {(question.type === 'short_text' ||
                                            question.type === 'essay') && (
                                            <div className="space-y-3">
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">
                                                        Student's Answer
                                                    </Label>
                                                    <div className="mt-1 rounded bg-muted p-3 text-sm whitespace-pre-wrap">
                                                        {answer?.text_answer ||
                                                            'Not answered'}
                                                    </div>
                                                </div>

                                                {question.type ===
                                                    'short_text' &&
                                                    question.correct_answer && (
                                                        <div>
                                                            <Label className="text-xs text-muted-foreground">
                                                                Accepted Answers
                                                            </Label>
                                                            <p className="text-sm text-green-600">
                                                                {
                                                                    question.correct_answer
                                                                }
                                                            </p>
                                                        </div>
                                                    )}

                                                {question.grading_notes && (
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground">
                                                            Grading Notes
                                                        </Label>
                                                        <p className="text-sm text-muted-foreground">
                                                            {
                                                                question.grading_notes
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Manual grading form */}
                                                {answer && (
                                                    <GradeForm
                                                        answer={answer}
                                                        maxPoints={
                                                            question.points
                                                        }
                                                        saving={
                                                            savingQuestion ===
                                                            answer.id
                                                        }
                                                        onSave={(
                                                            points,
                                                            feedback,
                                                        ) =>
                                                            handleGradeAnswer(
                                                                answer.id,
                                                                points,
                                                                feedback,
                                                            )
                                                        }
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Finalize */}
                <div className="flex justify-end gap-2">
                    <Button variant="outline" asChild>
                        <a href={`/grading/${exam.id}`}>Back to List</a>
                    </Button>
                    <Button
                        onClick={handleFinalize}
                        disabled={needsManualGrading}
                    >
                        {needsManualGrading
                            ? 'Grade all questions first'
                            : 'Finalize Grading'}
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}

interface GradeFormProps {
    answer: ExamAnswer;
    maxPoints: number;
    saving: boolean;
    onSave: (points: number, feedback: string) => void;
}

function GradeForm({ answer, maxPoints, saving, onSave }: GradeFormProps) {
    const [points, setPoints] = useState(
        answer.points_earned?.toString() || '0',
    );
    const [feedback, setFeedback] = useState(answer.instructor_feedback || '');

    return (
        <div className="mt-3 space-y-3 border-t pt-3">
            <div className="flex items-end gap-4">
                <div className="flex-1">
                    <Label htmlFor={`points-${answer.id}`}>
                        Points (max {maxPoints})
                    </Label>
                    <Input
                        id={`points-${answer.id}`}
                        type="number"
                        min={0}
                        max={maxPoints}
                        step={0.5}
                        value={points}
                        onChange={(e) => setPoints(e.target.value)}
                        className="w-32"
                    />
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPoints(maxPoints.toString())}
                >
                    Full
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPoints((maxPoints / 2).toString())}
                >
                    Half
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPoints('0')}
                >
                    Zero
                </Button>
            </div>
            <div>
                <Label htmlFor={`feedback-${answer.id}`}>
                    Feedback (optional)
                </Label>
                <textarea
                    id={`feedback-${answer.id}`}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Add feedback for the student..."
                    rows={2}
                    className="mt-1 w-full rounded border p-2 text-sm"
                />
            </div>
            <Button
                onClick={() => onSave(parseFloat(points) || 0, feedback)}
                disabled={saving}
            >
                {saving ? (
                    <>
                        <SaveIcon className="size-4 animate-spin" />
                        Saving...
                    </>
                ) : (
                    <>
                        <SaveIcon className="size-4" />
                        Save Grade
                    </>
                )}
            </Button>
        </div>
    );
}
