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
import { useLanguageStandalone } from '@/hooks/use-language';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

export default function CreateExam() {
    const { t } = useLanguageStandalone();
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

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('common.dashboard'), href: '/dashboard' },
        { title: t('exams.title'), href: '/exams' },
        { title: t('exams.create.title'), href: '/exams/create' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/exams');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('exams.create.title')} />
            <div className="mx-auto max-w-3xl space-y-6 p-6">
                {/* Header */}
                <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                    <h1 className="text-2xl font-bold">{t('exams.create.title')}</h1>
                    <p className="mt-1 opacity-90">{t('exams.create.subtitle')}</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('exams.details')}</CardTitle>
                        <CardDescription>
                            {t('exams.details.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="title">{t('exams.fields.title')} *</Label>
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(e) =>
                                            setData('title', e.target.value)
                                        }
                                        placeholder={t('exams.fields.title.placeholder')}
                                    />
                                    <InputError message={errors.title} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">{t('exams.fields.type')} *</Label>
                                    <Select
                                        value={data.type}
                                        onValueChange={(value) =>
                                            setData('type', value)
                                        }
                                    >
                                        <SelectTrigger id="type">
                                            <SelectValue placeholder={t('exams.fields.type.placeholder')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="auto">
                                                {t('exams.fields.type.auto')}
                                            </SelectItem>
                                            <SelectItem value="hybrid">
                                                {t('exams.fields.type.hybrid')}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.type} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">{t('exams.fields.description')}</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    placeholder={t('exams.fields.description.placeholder')}
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="duration">
                                        {t('exams.fields.duration')} *
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
                                        {t('exams.fields.attempts')} *
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
                                        {t('exams.fields.start_time')} *
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
                                    <Label htmlFor="end_time">{t('exams.fields.end_time')} *</Label>
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
                                    {t('exams.fields.passing_score')} {' '}
                                    <span className="text-muted-foreground">
                                        {t('exams.fields.passing_score.optional')}
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
                                    placeholder={t('exams.fields.passing_score.placeholder')}
                                />
                                <InputError message={errors.passing_score} />
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-medium">{t('exams.fields.options')}</h3>
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
                                        {t('exams.fields.shuffle_questions')}
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
                                        {t('exams.fields.shuffle_options')}
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
                                        {t('exams.fields.show_results')}
                                    </Label>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button type="submit" disabled={processing}>
                                    {t('exams.create')}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.visit('/exams')}
                                >
                                    {t('common.cancel')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
