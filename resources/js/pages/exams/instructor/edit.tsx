import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { PlusIcon, TrashIcon, GripVerticalIcon, ImageIcon } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import type { BreadcrumbItem, Exam, Question, QuestionType } from '@/types';

interface Props {
    exam: Exam & { questions: Question[] };
}

const questionTypes: { value: QuestionType; label: string }[] = [
    {
        value: 'multiple_choice_single',
        label: 'Multiple Choice (Single Answer)',
    },
    {
        value: 'multiple_choice_multiple',
        label: 'Multiple Choice (Multiple Answers)',
    },
    { value: 'true_false', label: 'True/False' },
    { value: 'short_text', label: 'Short Text Answer' },
    { value: 'essay', label: 'Essay' },
];

export default function EditExam({ exam }: Props) {
    const [showQuestionForm, setShowQuestionForm] = useState(false);

    const examForm = useForm({
        title: exam.title,
        description: exam.description || '',
        duration_minutes: exam.duration_minutes,
        start_time: exam.start_time.slice(0, 16),
        end_time: exam.end_time.slice(0, 16),
        allowed_attempts: exam.allowed_attempts,
        shuffle_questions: exam.shuffle_questions,
        shuffle_options: exam.shuffle_options,
        show_results: exam.show_results,
        passing_score: exam.passing_score,
        is_published: exam.is_published,
    });

    const questionForm = useForm<{
        type: QuestionType;
        content: string;
        points: number;
        correct_answer: string;
        grading_notes: string;
        options: { content: string; is_correct: boolean }[];
    }>({
        type: 'multiple_choice_single',
        content: '',
        points: 1,
        correct_answer: '',
        grading_notes: '',
        options: [
            { content: '', is_correct: false },
            { content: '', is_correct: false },
        ],
    });

    const handleExamSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        examForm.put(`/exams/${exam.id}`);
    };

    const handleQuestionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        questionForm.post(`/exams/${exam.id}/questions`, {
            onSuccess: () => {
                setShowQuestionForm(false);
                questionForm.reset();
            },
            onError: (errors) => {
                console.error('Question form errors:', errors);
            },
        });
    };

    const handleDeleteQuestion = (questionId: number) => {
        if (confirm('Delete this question?')) {
            router.delete(`/exams/${exam.id}/questions/${questionId}`);
        }
    };

    const handleTogglePublish = () => {
        router.post(`/exams/${exam.id}/toggle-publish`);
    };

    const addOption = () => {
        questionForm.setData('options', [
            ...questionForm.data.options,
            { content: '', is_correct: false },
        ]);
    };

    const removeOption = (index: number) => {
        const newOptions = questionForm.data.options.filter(
            (_, i) => i !== index,
        );
        questionForm.setData('options', newOptions);
    };

    const updateOption = (
        index: number,
        field: 'content' | 'is_correct',
        value: string | boolean,
    ) => {
        const newOptions = [...questionForm.data.options];

        if (
            field === 'is_correct' &&
            questionForm.data.type === 'multiple_choice_single'
        ) {
            // For single choice, uncheck others
            newOptions.forEach((opt, i) => {
                opt.is_correct = i === index ? (value as boolean) : false;
            });
        } else {
            (newOptions[index] as Record<string, unknown>)[field] = value;
        }

        questionForm.setData('options', newOptions);
    };

    const needsOptions = [
        'multiple_choice_single',
        'multiple_choice_multiple',
    ].includes(questionForm.data.type);
    const isTrueFalse = questionForm.data.type === 'true_false';
    const isTextBased = ['short_text', 'essay'].includes(
        questionForm.data.type,
    );

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Exams', href: '/exams' },
        { title: exam.title, href: `/exams/${exam.id}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit: ${exam.title}`} />
            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                    <div>
                        <h1 className="text-2xl font-bold">Edit Exam</h1>
                        <p className="mt-1 opacity-90">{exam.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="secondary"
                            className={
                                exam.is_published
                                    ? 'bg-green-500/20 text-green-100'
                                    : 'bg-white/20 text-white'
                            }
                        >
                            {exam.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        <Button
                            variant="secondary"
                            className="bg-white/20 text-white hover:bg-white/30"
                            onClick={handleTogglePublish}
                        >
                            {exam.is_published ? 'Unpublish' : 'Publish'}
                        </Button>
                    </div>
                </div>

                {/* Exam Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Exam Settings</CardTitle>
                        <CardDescription>
                            Update exam configuration
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleExamSubmit} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        value={examForm.data.title}
                                        onChange={(e) =>
                                            examForm.setData(
                                                'title',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={examForm.errors.title}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="duration">
                                        Duration (minutes)
                                    </Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        value={examForm.data.duration_minutes}
                                        onChange={(e) =>
                                            examForm.setData(
                                                'duration_minutes',
                                                parseInt(e.target.value) || 60,
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="start_time">
                                        Start Time
                                    </Label>
                                    <Input
                                        id="start_time"
                                        type="datetime-local"
                                        value={examForm.data.start_time}
                                        onChange={(e) =>
                                            examForm.setData(
                                                'start_time',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end_time">End Time</Label>
                                    <Input
                                        id="end_time"
                                        type="datetime-local"
                                        value={examForm.data.end_time}
                                        onChange={(e) =>
                                            examForm.setData(
                                                'end_time',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="allowed_attempts">
                                        Allowed Attempts
                                    </Label>
                                    <Input
                                        id="allowed_attempts"
                                        type="number"
                                        min="1"
                                        value={examForm.data.allowed_attempts}
                                        onChange={(e) =>
                                            examForm.setData(
                                                'allowed_attempts',
                                                parseInt(e.target.value) || 1,
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="passing_score">
                                        Passing Score (%)
                                    </Label>
                                    <Input
                                        id="passing_score"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={examForm.data.passing_score}
                                        onChange={(e) =>
                                            examForm.setData(
                                                'passing_score',
                                                parseInt(e.target.value) || 0,
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="shuffle_questions"
                                        checked={
                                            examForm.data.shuffle_questions
                                        }
                                        onCheckedChange={(checked) =>
                                            examForm.setData(
                                                'shuffle_questions',
                                                checked as boolean,
                                            )
                                        }
                                    />
                                    <Label htmlFor="shuffle_questions">
                                        Shuffle questions
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="shuffle_options"
                                        checked={examForm.data.shuffle_options}
                                        onCheckedChange={(checked) =>
                                            examForm.setData(
                                                'shuffle_options',
                                                checked as boolean,
                                            )
                                        }
                                    />
                                    <Label htmlFor="shuffle_options">
                                        Shuffle options
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="show_results"
                                        checked={examForm.data.show_results}
                                        onCheckedChange={(checked) =>
                                            examForm.setData(
                                                'show_results',
                                                checked as boolean,
                                            )
                                        }
                                    />
                                    <Label htmlFor="show_results">
                                        Show results
                                    </Label>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={examForm.processing}
                            >
                                Save Changes
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Questions */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>
                                    Questions ({exam.questions?.length || 0})
                                </CardTitle>
                                <CardDescription>
                                    Total points:{' '}
                                    {exam.questions?.reduce(
                                        (sum, q) => sum + Number(q.points),
                                        0,
                                    ) || 0}
                                </CardDescription>
                            </div>
                            <Button onClick={() => setShowQuestionForm(true)}>
                                <PlusIcon className="size-4" />
                                Add Question
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Question Form */}
                        {showQuestionForm && (
                            <Card className="mb-6 border-primary">
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        New Question
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form
                                        onSubmit={handleQuestionSubmit}
                                        className="space-y-4"
                                    >
                                        {/* Show all errors */}
                                        {Object.keys(questionForm.errors)
                                            .length > 0 && (
                                            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                                                <p className="font-medium">
                                                    Please fix the following
                                                    errors:
                                                </p>
                                                <ul className="mt-2 list-disc pl-4">
                                                    {Object.entries(
                                                        questionForm.errors,
                                                    ).map(([key, msg]) => (
                                                        <li key={key}>{msg}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Question Type</Label>
                                                <select
                                                    value={
                                                        questionForm.data.type
                                                    }
                                                    onChange={(e) => {
                                                        questionForm.setData(
                                                            'type',
                                                            e.target
                                                                .value as QuestionType,
                                                        );
                                                        if (
                                                            [
                                                                'short_text',
                                                                'essay',
                                                                'true_false',
                                                            ].includes(
                                                                e.target.value,
                                                            )
                                                        ) {
                                                            questionForm.setData(
                                                                'options',
                                                                [],
                                                            );
                                                        } else {
                                                            questionForm.setData(
                                                                'options',
                                                                [
                                                                    {
                                                                        content:
                                                                            '',
                                                                        is_correct: false,
                                                                    },
                                                                    {
                                                                        content:
                                                                            '',
                                                                        is_correct: false,
                                                                    },
                                                                ],
                                                            );
                                                        }
                                                    }}
                                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                >
                                                    {questionTypes.map(
                                                        (type) => (
                                                            <option
                                                                key={type.value}
                                                                value={
                                                                    type.value
                                                                }
                                                            >
                                                                {type.label}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="points">
                                                    Points
                                                </Label>
                                                <Input
                                                    id="points"
                                                    type="number"
                                                    min={0.01}
                                                    step={0.01}
                                                    value={
                                                        questionForm.data.points
                                                    }
                                                    onChange={(e) =>
                                                        questionForm.setData(
                                                            'points',
                                                            parseFloat(
                                                                e.target.value,
                                                            ) || 1,
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="content">
                                                Question Text
                                            </Label>
                                            <textarea
                                                id="content"
                                                value={
                                                    questionForm.data.content
                                                }
                                                onChange={(e) =>
                                                    questionForm.setData(
                                                        'content',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Enter your question..."
                                                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                            />
                                            <InputError
                                                message={
                                                    questionForm.errors.content
                                                }
                                            />
                                        </div>

                                        {/* Options for multiple choice */}
                                        {needsOptions && (
                                            <div className="space-y-3">
                                                <Label>Answer Options</Label>
                                                {questionForm.data.options.map(
                                                    (option, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <Checkbox
                                                                checked={
                                                                    option.is_correct
                                                                }
                                                                onCheckedChange={(
                                                                    checked,
                                                                ) =>
                                                                    updateOption(
                                                                        index,
                                                                        'is_correct',
                                                                        checked as boolean,
                                                                    )
                                                                }
                                                            />
                                                            <Input
                                                                value={
                                                                    option.content
                                                                }
                                                                onChange={(e) =>
                                                                    updateOption(
                                                                        index,
                                                                        'content',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder={`Option ${index + 1}`}
                                                                className="flex-1"
                                                            />
                                                            {questionForm.data
                                                                .options
                                                                .length > 2 && (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        removeOption(
                                                                            index,
                                                                        )
                                                                    }
                                                                >
                                                                    <TrashIcon className="size-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ),
                                                )}
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={addOption}
                                                >
                                                    <PlusIcon className="size-4" />
                                                    Add Option
                                                </Button>
                                            </div>
                                        )}

                                        {/* True/False */}
                                        {isTrueFalse && (
                                            <div className="space-y-2">
                                                <Label>Correct Answer</Label>
                                                <div className="flex gap-4">
                                                    <label className="flex cursor-pointer items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="correct_answer"
                                                            value="true"
                                                            checked={
                                                                questionForm
                                                                    .data
                                                                    .correct_answer ===
                                                                'true'
                                                            }
                                                            onChange={(e) =>
                                                                questionForm.setData(
                                                                    'correct_answer',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="size-4"
                                                        />
                                                        True
                                                    </label>
                                                    <label className="flex cursor-pointer items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="correct_answer"
                                                            value="false"
                                                            checked={
                                                                questionForm
                                                                    .data
                                                                    .correct_answer ===
                                                                'false'
                                                            }
                                                            onChange={(e) =>
                                                                questionForm.setData(
                                                                    'correct_answer',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="size-4"
                                                        />
                                                        False
                                                    </label>
                                                </div>
                                            </div>
                                        )}

                                        {/* Short text answer */}
                                        {questionForm.data.type ===
                                            'short_text' && (
                                            <div className="space-y-2">
                                                <Label htmlFor="correct_answer">
                                                    Correct Answer(s)
                                                </Label>
                                                <Input
                                                    id="correct_answer"
                                                    value={
                                                        questionForm.data
                                                            .correct_answer
                                                    }
                                                    onChange={(e) =>
                                                        questionForm.setData(
                                                            'correct_answer',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Use | to separate multiple accepted answers"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Example: "Paris | paris"
                                                    accepts both
                                                </p>
                                            </div>
                                        )}

                                        {/* Essay grading notes */}
                                        {questionForm.data.type === 'essay' && (
                                            <div className="space-y-2">
                                                <Label htmlFor="grading_notes">
                                                    Grading Notes (for
                                                    instructor)
                                                </Label>
                                                <textarea
                                                    id="grading_notes"
                                                    value={
                                                        questionForm.data
                                                            .grading_notes
                                                    }
                                                    onChange={(e) =>
                                                        questionForm.setData(
                                                            'grading_notes',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Key points to look for when grading..."
                                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                />
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <Button
                                                type="submit"
                                                disabled={
                                                    questionForm.processing
                                                }
                                            >
                                                Add Question
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setShowQuestionForm(false);
                                                    questionForm.reset();
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        {/* Questions List */}
                        <div className="space-y-3">
                            {exam.questions?.map((question, index) => (
                                <div
                                    key={question.id}
                                    className="flex items-start gap-3 rounded-lg border p-4"
                                >
                                    <GripVerticalIcon className="mt-1 size-5 cursor-grab text-muted-foreground" />
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-1 flex items-center gap-2">
                                            <span className="font-medium">
                                                Q{index + 1}.
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                            >
                                                {
                                                    questionTypes.find(
                                                        (t) =>
                                                            t.value ===
                                                            question.type,
                                                    )?.label
                                                }
                                            </Badge>
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                {question.points} pts
                                            </Badge>
                                        </div>
                                        <p className="text-sm">
                                            {question.content}
                                        </p>
                                        {question.options?.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {question.options.map(
                                                    (opt, optIndex) => (
                                                        <div
                                                            key={opt.id}
                                                            className={`pl-4 text-sm ${opt.is_correct ? 'font-medium text-green-600' : 'text-muted-foreground'}`}
                                                        >
                                                            {String.fromCharCode(
                                                                65 + optIndex,
                                                            )}
                                                            . {opt.content}
                                                            {opt.is_correct &&
                                                                ' ✓'}
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            handleDeleteQuestion(question.id)
                                        }
                                    >
                                        <TrashIcon className="size-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}

                            {(!exam.questions || exam.questions.length === 0) &&
                                !showQuestionForm && (
                                    <p className="py-8 text-center text-muted-foreground">
                                        No questions added yet. Click "Add
                                        Question" to get started.
                                    </p>
                                )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
