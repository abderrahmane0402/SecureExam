import { Head, useForm, router } from '@inertiajs/react';
import { PlusIcon, FileTextIcon } from 'lucide-react';
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
            <div className="mx-auto max-w-3xl space-y-8 p-6 pb-24">
                {/* Header — Mesh Gradient Arrival */}
                <div className="flex flex-col gap-4 rounded-[2.5rem] bg-gradient-to-br from-indigo-700 via-blue-600 to-cyan-500 dark:from-primary/30 dark:via-primary/10 dark:to-background p-8 text-white shadow-2xl shadow-indigo-500/20 border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
                                <PlusIcon className="size-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight uppercase italic drop-shadow-md">{t('exams.create.title')}</h1>
                        </div>
                        <p className="text-blue-50 font-bold italic text-sm opacity-90 max-w-md">
                            {t('exams.create.subtitle')}
                        </p>
                    </div>
                    <FileTextIcon className="absolute -right-8 -bottom-8 size-48 text-white/10 rotate-12 pointer-events-none" />
                </div>

                <Card className="rounded-[2.5rem] border border-border/50 bg-card/40 backdrop-blur-md shadow-2xl overflow-hidden pt-0 border-t-white/10 dark:border-t-white/5">
                    <CardHeader className="bg-primary/5 dark:bg-primary/10 border-b border-primary/10 p-8">
                        <CardTitle className="text-xl font-black uppercase tracking-tighter italic text-foreground">{t('exams.details')}</CardTitle>
                        <CardDescription className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest mt-1">
                            {t('exams.details.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 sm:p-10">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2 group">
                                    <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2 group-focus-within:text-primary transition-colors">{t('exams.fields.title')} *</Label>
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(e) =>
                                            setData('title', e.target.value)
                                        }
                                        placeholder={t('exams.fields.title.placeholder')}
                                        className="h-12 rounded-2xl bg-background/50 border-border focus:ring-primary font-bold italic transition-all shadow-inner"
                                    />
                                    <InputError message={errors.title} />
                                </div>

                                <div className="space-y-2 group">
                                    <Label htmlFor="type" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2 group-focus-within:text-primary transition-colors">{t('exams.fields.type')} *</Label>
                                    <Select
                                        value={data.type}
                                        onValueChange={(value) =>
                                            setData('type', value)
                                        }
                                    >
                                        <SelectTrigger id="type" className="h-12 rounded-2xl bg-background/50 border-border focus:ring-primary font-bold italic transition-all shadow-inner">
                                            <SelectValue placeholder={t('exams.fields.type.placeholder')} />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-border bg-popover">
                                            <SelectItem value="auto" className="rounded-xl font-bold py-3">
                                                {t('exams.fields.type.auto')}
                                            </SelectItem>
                                            <SelectItem value="hybrid" className="rounded-xl font-bold py-3">
                                                {t('exams.fields.type.hybrid')}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.type} />
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2 group-focus-within:text-primary transition-colors">{t('exams.fields.description')}</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    placeholder={t('exams.fields.description.placeholder')}
                                    className="min-h-[140px] rounded-[2rem] bg-background/50 border-border focus:ring-primary font-bold italic transition-all shadow-inner p-6"
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2 group">
                                    <Label htmlFor="duration" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">
                                        {t('exams.fields.duration')} *
                                    </Label>
                                    <div className="relative">
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
                                            className="h-12 rounded-2xl bg-background/50 border-border focus:ring-primary font-black tabular-nums pr-10 shadow-inner"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary italic">M</span>
                                    </div>
                                    <InputError
                                        message={errors.duration_minutes}
                                    />
                                </div>

                                <div className="space-y-2 group">
                                    <Label htmlFor="attempts" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">
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
                                        className="h-12 rounded-2xl bg-background/50 border-border focus:ring-primary font-black tabular-nums shadow-inner"
                                    />
                                    <InputError
                                        message={errors.allowed_attempts}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2 group">
                                    <Label htmlFor="start_time" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">
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
                                        className="h-12 rounded-2xl bg-background/50 border-border focus:ring-primary font-bold italic transition-all shadow-inner px-4"
                                    />
                                    <InputError message={errors.start_time} />
                                </div>

                                <div className="space-y-2 group">
                                    <Label htmlFor="end_time" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">{t('exams.fields.end_time')} *</Label>
                                    <Input
                                        id="end_time"
                                        type="datetime-local"
                                        value={data.end_time}
                                        onChange={(e) =>
                                            setData('end_time', e.target.value)
                                        }
                                        className="h-12 rounded-2xl bg-background/50 border-border focus:ring-primary font-bold italic transition-all shadow-inner px-4"
                                    />
                                    <InputError message={errors.end_time} />
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <Label htmlFor="passing_score" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">
                                    {t('exams.fields.passing_score')} {' '}
                                    <span className="text-muted-foreground italic">
                                        ({t('exams.fields.passing_score.optional')})
                                    </span>
                                </Label>
                                <div className="relative">
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
                                        className="h-12 rounded-2xl bg-background/50 border-border focus:ring-primary font-black tabular-nums pr-10 shadow-inner"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-500">%</span>
                                </div>
                                <InputError message={errors.passing_score} />
                            </div>

                            <div className="space-y-5 py-4 px-2">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-4">
                                    {t('exams.fields.options')}
                                    <div className="h-px flex-1 bg-primary/10"></div>
                                </h3>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {[
                                        { id: 'shuffle_questions', label: t('exams.fields.shuffle_questions'), value: data.shuffle_questions, setter: 'shuffle_questions' },
                                        { id: 'shuffle_options', label: t('exams.fields.shuffle_options'), value: data.shuffle_options, setter: 'shuffle_options' },
                                        { id: 'show_results', label: t('exams.fields.show_results'), value: data.show_results, setter: 'show_results' },
                                    ].map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-background/30 border border-border/50 hover:bg-background/50 transition-all cursor-pointer" onClick={() => setData(item.setter as any, !item.value)}>
                                            <Label htmlFor={item.id} className="text-xs font-bold cursor-pointer text-foreground/80 uppercase tracking-tight italic">{item.label}</Label>
                                            <Checkbox
                                                id={item.id}
                                                checked={item.value}
                                                onCheckedChange={(checked) =>
                                                    setData(
                                                        item.setter as any,
                                                        checked as boolean,
                                                    )
                                                }
                                                className="rounded-lg h-6 w-6 border-2 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all shadow-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-6 border-t border-border/50">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => router.visit('/exams')}
                                    className="w-full sm:w-auto h-14 rounded-2xl font-black uppercase tracking-widest text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-all px-8"
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={processing} 
                                    className="w-full sm:w-auto h-14 rounded-2xl font-black uppercase tracking-widest text-xs px-12 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 active:scale-95 transition-all"
                                >
                                    {processing ? t('common.loading') : t('exams.create.button')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
