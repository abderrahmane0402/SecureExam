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
                <div className="rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 dark:from-blue-900 dark:via-blue-950 dark:to-background p-8 text-white shadow-xl shadow-blue-500/10 border border-white/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <h1 className="text-3xl font-black tracking-tight">{t('exams.create.title')}</h1>
                        <p className="mt-2 text-blue-100/90 font-medium italic">{t('exams.create.subtitle')}</p>
                    </div>
                    <div className="absolute top-0 right-0 size-64 bg-white/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                </div>

                <Card className="rounded-3xl border border-border bg-white dark:bg-card shadow-sm overflow-hidden">
                    <CardHeader className="p-8 pb-6 bg-muted/50 border-b border-border">
                        <CardTitle className="text-2xl font-black tracking-tight text-foreground uppercase">{t('exams.details')}</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium mt-1 italic">
                            {t('exams.details.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 sm:p-10">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('exams.fields.title')} *</Label>
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(e) =>
                                            setData('title', e.target.value)
                                        }
                                        placeholder={t('exams.fields.title.placeholder')}
                                        className="h-12 rounded-xl bg-background border-border focus:ring-primary font-bold text-foreground placeholder:text-muted-foreground/40"
                                    />
                                    <InputError message={errors.title} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="type" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('exams.fields.type')} *</Label>
                                    <Select
                                        value={data.type}
                                        onValueChange={(value) =>
                                            setData('type', value)
                                        }
                                    >
                                        <SelectTrigger id="type" className="h-12 rounded-xl bg-background border-border focus:ring-primary font-bold text-foreground">
                                            <SelectValue placeholder={t('exams.fields.type.placeholder')} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
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

                            <div className="space-y-1.5">
                                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('exams.fields.description')}</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    placeholder={t('exams.fields.description.placeholder')}
                                    className="min-h-[120px] rounded-xl bg-background border-border focus:ring-primary font-medium text-foreground placeholder:text-muted-foreground/40"
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="duration" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
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
                                        className="h-12 rounded-xl bg-background border-border focus:ring-primary font-bold text-foreground"
                                    />
                                    <InputError
                                        message={errors.duration_minutes}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="attempts" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
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
                                        className="h-12 rounded-xl bg-background border-border focus:ring-primary font-bold text-foreground"
                                    />
                                    <InputError
                                        message={errors.allowed_attempts}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="start_time" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
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
                                        className="h-12 rounded-xl bg-background border-border focus:ring-primary font-bold text-foreground"
                                    />
                                    <InputError message={errors.start_time} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="end_time" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('exams.fields.end_time')} *</Label>
                                    <Input
                                        id="end_time"
                                        type="datetime-local"
                                        value={data.end_time}
                                        onChange={(e) =>
                                            setData('end_time', e.target.value)
                                        }
                                        className="h-12 rounded-xl bg-background border-border focus:ring-primary font-bold text-foreground"
                                    />
                                    <InputError message={errors.end_time} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="passing_score" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                    {t('exams.fields.passing_score')} {' '}
                                    <span className="text-muted-foreground italic">
                                        ({t('exams.fields.passing_score.optional')})
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
                                    className="h-12 rounded-xl bg-background border-border focus:ring-primary font-bold text-foreground placeholder:text-muted-foreground/40"
                                />
                                <InputError message={errors.passing_score} />
                            </div>

                            <div className="space-y-5 py-2">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-4">
                                    {t('exams.fields.options')}
                                    <div className="h-px flex-1 bg-border"></div>
                                </h3>
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
                                        className="cursor-pointer text-foreground font-medium"
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
                                        className="cursor-pointer text-foreground font-medium"
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
                                        className="cursor-pointer text-foreground font-medium"
                                    >
                                        {t('exams.fields.show_results')}
                                    </Label>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-border">
                                <Button type="submit" disabled={processing} className="rounded-2xl h-12 px-10 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20">
                                    {t('exams.create')}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => router.visit('/exams')}
                                    className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[11px] text-muted-foreground hover:text-foreground"
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
