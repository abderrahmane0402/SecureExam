import { Head, useForm, router } from '@inertiajs/react';
import { PlusIcon, TrashIcon, UploadIcon, PencilIcon } from 'lucide-react';
import { useState, useMemo } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useLanguageStandalone } from '@/hooks/use-language';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Exam, Question, QuestionType } from '@/types';

interface Props {
    exam: Exam & { questions: Question[] };
}

export default function EditExam({ exam }: Props) {
    const { t } = useLanguageStandalone();
    const [isQuestionSheetOpen, setIsQuestionSheetOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

    // Exam Settings Form
    const examForm = useForm({
        title: exam.title,
        type: exam.type as 'auto' | 'hybrid',
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

    // Question Form
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

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('common.dashboard'), href: '/dashboard' },
        { title: t('exams.title'), href: '/exams' },
        { title: exam.title, href: `/exams/${exam.id}` },
        { title: t('exams.card.edit'), href: `/exams/${exam.id}/edit` },
    ];

    const handleExamSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        examForm.put(`/exams/${exam.id}`);
    };

    const handleQuestionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingQuestion 
            ? `/exams/${exam.id}/questions/${editingQuestion.id}` 
            : `/exams/${exam.id}/questions`;
        
        const method = editingQuestion ? 'put' : 'post';

        router[method](url, questionForm.data as any, {
            onSuccess: () => {
                setIsQuestionSheetOpen(false);
                setEditingQuestion(null);
                questionForm.reset();
            },
        });
    };

    const handleDeleteQuestion = (questionId: number) => {
        if (confirm(t('exams.questions.delete.confirm'))) {
            router.delete(`/exams/${exam.id}/questions/${questionId}`);
        }
    };

    const handleEditQuestion = (question: Question) => {
        setEditingQuestion(question);
        questionForm.setData({
            type: question.type as QuestionType,
            content: question.content,
            points: Number(question.points),
            correct_answer: question.correct_answer || '',
            grading_notes: question.grading_notes || '',
            options: (question.options || []).map(opt => ({
                content: opt.content,
                is_correct: !!opt.is_correct
            })),
        });
        setIsQuestionSheetOpen(true);
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
        const newOptions = questionForm.data.options.filter((_, i) => i !== index);
        questionForm.setData('options', newOptions);
    };

    const updateOption = (index: number, field: 'content' | 'is_correct', value: string | boolean) => {
        const newOptions = [...questionForm.data.options];
        if (field === 'is_correct' && questionForm.data.type === 'multiple_choice_single') {
            newOptions.forEach((opt, i) => {
                opt.is_correct = i === index ? (value as boolean) : false;
            });
        } else {
            (newOptions[index] as any)[field] = value;
        }
        questionForm.setData('options', newOptions);
    };

    const needsOptions = ['multiple_choice_single', 'multiple_choice_multiple'].includes(questionForm.data.type);
    const isTrueFalse = questionForm.data.type === 'true_false';

    const questionTypes = useMemo(() => [
        { value: 'multiple_choice_single', label: t('exams.questions.type.mcq_single') },
        { value: 'multiple_choice_multiple', label: t('exams.questions.type.mcq_multiple') },
        { value: 'true_false', label: t('exams.questions.type.true_false') },
        { value: 'short_text', label: t('exams.questions.type.short_text') },
        { value: 'essay', label: t('exams.questions.type.essay') },
    ], [t]);

    const availableQuestionTypes = useMemo(() => {
        if (examForm.data.type === 'auto') {
            return questionTypes.filter(type => !['short_text', 'essay'].includes(type.value));
        }
        return questionTypes;
    }, [examForm.data.type, questionTypes]);

    const totalPoints = useMemo(() => {
        return exam.questions?.reduce((sum, q) => sum + Number(q.points), 0) || 0;
    }, [exam.questions]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('exams.card.edit')}: ${exam.title}`} />
            <div className="mx-auto max-w-5xl space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                    <div>
                        <h1 className="text-2xl font-bold">{t('exams.edit.title')}</h1>
                        <p className="mt-1 opacity-90">{exam.title}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className={exam.is_published ? 'bg-green-500 text-white' : 'bg-white/20 text-white'}>
                            {exam.is_published ? t('exams.status.published') : t('exams.status.draft')}
                        </Badge>
                        <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-white/20" onClick={handleTogglePublish}>
                            {exam.is_published ? t('exams.card.unpublish') : t('exams.card.publish')}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column: Settings */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('exams.details')}</CardTitle>
                                <CardDescription>{t('exams.details.description')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleExamSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">{t('exams.fields.title')}</Label>
                                        <Input
                                            id="title"
                                            value={examForm.data.title}
                                            onChange={(e) => examForm.setData('title', e.target.value)}
                                        />
                                        <InputError message={examForm.errors.title} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="type">{t('exams.fields.type')}</Label>
                                        <Select
                                            value={examForm.data.type}
                                            onValueChange={(value: 'auto' | 'hybrid') => examForm.setData('type', value)}
                                        >
                                            <SelectTrigger id="type">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="auto">{t('exams.fields.type.auto')}</SelectItem>
                                                <SelectItem value="hybrid">{t('exams.fields.type.hybrid')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={examForm.errors.type} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="duration">{t('exams.fields.duration')}</Label>
                                        <Input
                                            id="duration"
                                            type="number"
                                            value={examForm.data.duration_minutes}
                                            onChange={(e) => examForm.setData('duration_minutes', parseInt(e.target.value) || 60)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="start_time">{t('exams.fields.start_time')}</Label>
                                        <Input
                                            id="start_time"
                                            type="datetime-local"
                                            value={examForm.data.start_time}
                                            onChange={(e) => examForm.setData('start_time', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="end_time">{t('exams.fields.end_time')}</Label>
                                        <Input
                                            id="end_time"
                                            type="datetime-local"
                                            value={examForm.data.end_time}
                                            onChange={(e) => examForm.setData('end_time', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="allowed_attempts">{t('exams.fields.attempts')}</Label>
                                        <Input
                                            id="allowed_attempts"
                                            type="number"
                                            min="1"
                                            value={examForm.data.allowed_attempts}
                                            onChange={(e) => examForm.setData('allowed_attempts', parseInt(e.target.value) || 1)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="passing_score">{t('exams.fields.passing_score')}</Label>
                                        <Input
                                            id="passing_score"
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={examForm.data.passing_score ?? ''}
                                            onChange={(e) => examForm.setData('passing_score', parseInt(e.target.value) || 0)}
                                        />
                                    </div>

                                    <Separator className="my-4" />

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="shuffle_questions"
                                                checked={examForm.data.shuffle_questions}
                                                onCheckedChange={(checked) => examForm.setData('shuffle_questions', checked as boolean)}
                                            />
                                            <Label htmlFor="shuffle_questions" className="text-sm cursor-pointer">{t('exams.fields.shuffle_questions')}</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="shuffle_options"
                                                checked={examForm.data.shuffle_options}
                                                onCheckedChange={(checked) => examForm.setData('shuffle_options', checked as boolean)}
                                            />
                                            <Label htmlFor="shuffle_options" className="text-sm cursor-pointer">{t('exams.fields.shuffle_options')}</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="show_results"
                                                checked={examForm.data.show_results}
                                                onCheckedChange={(checked) => examForm.setData('show_results', checked as boolean)}
                                            />
                                            <Label htmlFor="show_results" className="text-sm cursor-pointer">{t('exams.fields.show_results')}</Label>
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full" disabled={examForm.processing}>
                                        {t('common.save')}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Questions */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>{t('exams.questions.title')} ({exam.questions?.length || 0})</CardTitle>
                                    <CardDescription>{t('exams.questions.points_total')}: {totalPoints}</CardDescription>
                                </div>
                                <Button onClick={() => { setEditingQuestion(null); questionForm.reset(); setIsQuestionSheetOpen(true); }}>
                                    <PlusIcon className="mr-2 size-4" />
                                    {t('exams.questions.add')}
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Bulk Import */}
                                <div className="rounded-xl border border-dashed p-4 bg-muted/30">
                                    <div className="flex items-center gap-4">
                                        <div className="flex size-10 items-center justify-center rounded-lg bg-background border shadow-sm">
                                            <UploadIcon className="size-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-semibold truncate">{t('exams.questions.import.aiken')}</h3>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{t('exams.questions.import.aiken.desc')}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => {
                                                const aikenTemplate = "What is the capital of France?\nA) Paris\nB) Lyon\nC) Marseille\nD) Berlin\nANSWER: A";
                                                const blob = new Blob([aikenTemplate], { type: 'text/plain' });
                                                const url = window.URL.createObjectURL(blob);
                                                const a = document.createElement('a'); a.href = url; a.download = 'aiken_template.txt'; a.click();
                                            }}>
                                                {t('exams.questions.import.template')}
                                            </Button>
                                            <label className="cursor-pointer inline-flex items-center justify-center rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 h-8">
                                                {t('exams.questions.import.select')}
                                                <input type="file" className="hidden" accept=".txt" onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const formData = new FormData();
                                                        formData.append('file', file);
                                                        router.post(`/exams/${exam.id}/questions/import-aiken`, formData as any);
                                                    }
                                                }} />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Questions List */}
                                <div className="space-y-4">
                                    {exam.questions?.length === 0 ? (
                                        <p className="text-center py-8 text-muted-foreground">{t('exams.questions.none') || "No questions yet."}</p>
                                    ) : (
                                        exam.questions?.map((question, index) => (
                                            <div key={question.id} className="group relative rounded-lg border p-4 hover:border-primary/50 transition-colors">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
                                                            <Badge variant="outline" className="text-[10px] uppercase font-bold">
                                                                {t(`exams.questions.type.${question.type.replace('multiple_choice_single', 'mcq_single').replace('multiple_choice_multiple', 'mcq_multiple')}` as any)}
                                                            </Badge>
                                                            <span className="text-xs font-semibold text-primary">{question.points} {t('exams.questions.points')}</span>
                                                        </div>
                                                        <p className="text-sm font-medium leading-relaxed">{question.content}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button variant="ghost" size="icon" className="size-8" onClick={() => handleEditQuestion(question)}>
                                                            <PencilIcon className="size-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive/90" onClick={() => handleDeleteQuestion(question.id)}>
                                                            <TrashIcon className="size-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Question Editor Sheet */}
            <Sheet open={isQuestionSheetOpen} onOpenChange={setIsQuestionSheetOpen}>
                <SheetContent className="sm:max-w-xl overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{editingQuestion ? t('exams.questions.edit') : t('exams.questions.new')}</SheetTitle>
                        <SheetDescription>{t('exams.questions.new')}</SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleQuestionSubmit} className="space-y-6 mt-6 pb-10">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>{t('exams.questions.type')}</Label>
                                <Select 
                                    value={questionForm.data.type} 
                                    onValueChange={(value: QuestionType) => {
                                        questionForm.setData('type', value);
                                        if (['short_text', 'essay', 'true_false'].includes(value)) {
                                            questionForm.setData('options', []);
                                        } else if (questionForm.data.options.length < 2) {
                                            questionForm.setData('options', [
                                                { content: '', is_correct: false },
                                                { content: '', is_correct: false },
                                            ]);
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableQuestionTypes.map(type => (
                                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="q-points">{t('exams.questions.points')}</Label>
                                <Input
                                    id="q-points"
                                    type="number"
                                    min={0.1}
                                    step={0.1}
                                    value={questionForm.data.points}
                                    onChange={(e) => questionForm.setData('points', parseFloat(e.target.value) || 1)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="q-content">{t('exams.questions.content')}</Label>
                            <Textarea
                                id="q-content"
                                value={questionForm.data.content}
                                onChange={(e) => questionForm.setData('content', e.target.value)}
                                placeholder={t('exams.questions.content.placeholder')}
                                className="min-h-[100px]"
                            />
                            <InputError message={questionForm.errors.content} />
                        </div>

                        {/* Options for MCQ */}
                        {needsOptions && (
                            <div className="space-y-3">
                                <Label>{t('exams.questions.options')}</Label>
                                <div className="space-y-2">
                                    {questionForm.data.options.map((option, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Checkbox
                                                checked={option.is_correct}
                                                onCheckedChange={(checked) => updateOption(index, 'is_correct', checked as boolean)}
                                            />
                                            <Input
                                                value={option.content}
                                                onChange={(e) => updateOption(index, 'content', e.target.value)}
                                                placeholder={`${t('exams.questions.options.placeholder')} ${index + 1}`}
                                                className="flex-1"
                                            />
                                            {questionForm.data.options.length > 2 && (
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)}>
                                                    <TrashIcon className="size-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={addOption} className="w-full">
                                    <PlusIcon className="mr-2 size-4" />
                                    {t('exams.questions.options.add')}
                                </Button>
                            </div>
                        )}

                        {/* True/False */}
                        {isTrueFalse && (
                            <div className="space-y-2">
                                <Label>{t('exams.questions.correct_answer')}</Label>
                                <Select 
                                    value={questionForm.data.correct_answer} 
                                    onValueChange={(val) => questionForm.setData('correct_answer', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">{t('exams.questions.correct_answer.true')}</SelectItem>
                                        <SelectItem value="false">{t('exams.questions.correct_answer.false')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Short text */}
                        {questionForm.data.type === 'short_text' && (
                            <div className="space-y-2">
                                <Label htmlFor="q-correct">{t('exams.questions.correct_answers')}</Label>
                                <Input
                                    id="q-correct"
                                    value={questionForm.data.correct_answer}
                                    onChange={(e) => questionForm.setData('correct_answer', e.target.value)}
                                    placeholder={t('exams.questions.correct_answer.placeholder')}
                                />
                            </div>
                        )}

                        {/* Essay */}
                        {questionForm.data.type === 'essay' && (
                            <div className="space-y-2">
                                <Label htmlFor="q-notes">{t('exams.questions.grading_notes')}</Label>
                                <Textarea
                                    id="q-notes"
                                    value={questionForm.data.grading_notes}
                                    onChange={(e) => questionForm.setData('grading_notes', e.target.value)}
                                    placeholder={t('exams.questions.grading_notes.placeholder')}
                                />
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Button type="submit" className="flex-1" disabled={questionForm.processing}>
                                {editingQuestion ? t('common.save') : t('exams.questions.add')}
                            </Button>
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsQuestionSheetOpen(false)}>
                                {t('common.cancel')}
                            </Button>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>
        </AppLayout>
    );
}
