import { Head, useForm, router } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Exams', href: '/exams' },
    { title: 'Create Exam', href: '/exams/create' },
];

export default function CreateExam() {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        type: 'auto',
        description: '',
        duration_minutes: 60,
        start_time: '',
        end_time: '',
        allowed_attempts: 1,
        shuffle_questions: false,
        shuffle_options: false,
        show_results: false,
        passing_score: null as number | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/exams');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Exam" />
            <div className="mx-auto max-w-3xl space-y-6 p-6">
                {/* Header */}
                <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                    <h1 className="text-2xl font-bold">Create New Exam</h1>
                    <p className="mt-1 opacity-90">
                        Set up your exam details. You can add questions after
                        creating the exam.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Exam Details</CardTitle>
                        <CardDescription>
                            Configure the basic settings for your exam.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(e) =>
                                            setData('title', e.target.value)
                                        }
                                        placeholder="e.g., Midterm Exam"
                                    />
                                    <InputError message={errors.title} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">Correction Type *</Label>
                                    <Select
                                        value={data.type}
                                        onValueChange={(value) =>
                                            setData('type', value)
                                        }
                                    >
                                        <SelectTrigger id="type">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="auto">
                                                Auto-Correction (MCQ only)
                                            </SelectItem>
                                            <SelectItem value="hybrid">
                                                Hybrid (Includes Free Text)
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.type} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    placeholder="Instructions or notes for students..."
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="duration">
                                        Duration (minutes) *
                                    </Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        min={1}
                                        max={480}
                                        value={data.duration_minutes}
                                        onChange={(e) =>
                                            setData(
                                                'duration_minutes',
                                                parseInt(e.target.value) || 60,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.duration_minutes}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="attempts">
                                        Allowed Attempts *
                                    </Label>
                                    <Input
                                        id="attempts"
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={data.allowed_attempts}
                                        onChange={(e) =>
                                            setData(
                                                'allowed_attempts',
                                                parseInt(e.target.value) || 1,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.allowed_attempts}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="start_time">
                                        Start Time *
                                    </Label>
                                    <Input
                                        id="start_time"
                                        type="datetime-local"
                                        value={data.start_time}
                                        onChange={(e) =>
                                            setData(
                                                'start_time',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError message={errors.start_time} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="end_time">End Time *</Label>
                                    <Input
                                        id="end_time"
                                        type="datetime-local"
                                        value={data.end_time}
                                        onChange={(e) =>
                                            setData('end_time', e.target.value)
                                        }
                                    />
                                    <InputError message={errors.end_time} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="passing_score">
                                    Passing Score (%){' '}
                                    <span className="text-muted-foreground">
                                        (optional)
                                    </span>
                                </Label>
                                <Input
                                    id="passing_score"
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={data.passing_score ?? ''}
                                    onChange={(e) =>
                                        setData(
                                            'passing_score',
                                            e.target.value
                                                ? parseFloat(e.target.value)
                                                : null,
                                        )
                                    }
                                    placeholder="e.g., 60"
                                />
                                <InputError message={errors.passing_score} />
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-medium">Options</h3>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="shuffle_questions"
                                        checked={data.shuffle_questions}
                                        onCheckedChange={(checked) =>
                                            setData(
                                                'shuffle_questions',
                                                checked as boolean,
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor="shuffle_questions"
                                        className="cursor-pointer"
                                    >
                                        Shuffle questions for each student
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="shuffle_options"
                                        checked={data.shuffle_options}
                                        onCheckedChange={(checked) =>
                                            setData(
                                                'shuffle_options',
                                                checked as boolean,
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor="shuffle_options"
                                        className="cursor-pointer"
                                    >
                                        Shuffle answer options
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="show_results"
                                        checked={data.show_results}
                                        onCheckedChange={(checked) =>
                                            setData(
                                                'show_results',
                                                checked as boolean,
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor="show_results"
                                        className="cursor-pointer"
                                    >
                                        Show results to students after
                                        submission
                                    </Label>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button type="submit" disabled={processing}>
                                    Create Exam
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.visit('/exams')}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
