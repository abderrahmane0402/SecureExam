import type { DropResult } from '@hello-pangea/dnd';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Head, useForm, router } from '@inertiajs/react';
import { PlusIcon, TrashIcon, UploadIcon, PencilIcon, GripVerticalIcon, CheckCircleIcon } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from '@/components/ui/textarea';
import { useLanguageStandalone } from '@/hooks/use-language';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem, Exam, Question, QuestionType } from '@/types';

interface Props {
    exam: Exam & { questions: Question[] };
}

export default function EditExam({ exam }: Props) {
    const { t } = useLanguageStandalone();
    const [isQuestionSheetOpen, setIsQuestionSheetOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [localQuestions, setLocalQuestions] = useState(exam.questions || []);

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

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(localQuestions);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setLocalQuestions(items);

        router.post(`/exams/${exam.id}/questions/reorder`, {
            questions: items.map((q, index) => ({ id: q.id, order: index + 1 }))
        }, {
            preserveScroll: true,
        });
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 dark:from-primary/20 dark:via-primary/10 dark:to-background p-8 text-white shadow-xl shadow-blue-500/10 border border-white/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <h1 className="text-3xl font-black tracking-tight">{t('exams.edit.title')}</h1>
                        <p className="mt-2 text-blue-100 font-medium italic">{exam.title}</p>
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <Badge variant="secondary" className={cn(
                            "h-7 rounded-sm text-[10px] font-black uppercase tracking-widest px-3 border-none shadow-sm",
                            exam.is_published ? 'bg-emerald-500 text-white' : 'bg-white/20 text-white'
                        )}>
                            {exam.is_published ? t('exams.status.published') : t('exams.status.draft')}
                        </Badge>
                        <Button 
                            variant="secondary" 
                            className="h-10 rounded-xl bg-white text-blue-600 hover:bg-blue-50 border-none font-bold px-6 transition-all shadow-lg" 
                            onClick={handleTogglePublish}
                        >
                            {exam.is_published ? t('exams.card.unpublish') : t('exams.card.publish')}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column: Settings */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="rounded-3xl border border-border bg-white dark:bg-card shadow-sm overflow-hidden">
                            <CardHeader className="p-8 pb-4 bg-slate-50/50 dark:bg-card border-b border-border">
                                <CardTitle className="text-xl font-black tracking-tight text-foreground uppercase">{t('exams.details')}</CardTitle>
                                <CardDescription className="text-muted-foreground font-medium text-xs italic">
                                    {t('exams.details.description')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <form onSubmit={handleExamSubmit} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('exams.fields.title')}</Label>
                                        <Input
                                            id="title"
                                            value={examForm.data.title}
                                            onChange={(e) => examForm.setData('title', e.target.value)}
                                            className="h-11 rounded-xl bg-white dark:bg-background border-border focus:ring-primary font-bold text-foreground"
                                        />
                                        <InputError message={examForm.errors.title} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="type" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('exams.fields.type')}</Label>
                                        <Select
                                            value={examForm.data.type}
                                            onValueChange={(value: 'auto' | 'hybrid') => examForm.setData('type', value)}
                                        >
                                            <SelectTrigger id="type" className="h-11 rounded-xl bg-white dark:bg-background border-border focus:ring-primary font-bold text-foreground">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white dark:bg-background border-border">
                                                <SelectItem value="auto">{t('exams.fields.type.auto')}</SelectItem>
                                                <SelectItem value="hybrid">{t('exams.fields.type.hybrid')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={examForm.errors.type} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="duration" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('exams.fields.duration')}</Label>
                                        <Input
                                            id="duration"
                                            type="number"
                                            value={examForm.data.duration_minutes}
                                            onChange={(e) => examForm.setData('duration_minutes', parseInt(e.target.value) || 60)}
                                            className="h-11 rounded-xl bg-white dark:bg-background border-border focus:ring-primary font-bold text-foreground"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="start_time" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('exams.fields.start_time')}</Label>
                                        <Input
                                            id="start_time"
                                            type="datetime-local"
                                            value={examForm.data.start_time}
                                            onChange={(e) => examForm.setData('start_time', e.target.value)}
                                            className="h-11 rounded-xl bg-white dark:bg-background border-border focus:ring-primary font-bold text-foreground"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="end_time" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('exams.fields.end_time')}</Label>
                                        <Input
                                            id="end_time"
                                            type="datetime-local"
                                            value={examForm.data.end_time}
                                            onChange={(e) => examForm.setData('end_time', e.target.value)}
                                            className="h-11 rounded-xl bg-white dark:bg-background border-border focus:ring-primary font-bold text-foreground"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="allowed_attempts" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('exams.fields.attempts')}</Label>
                                        <Input
                                            id="allowed_attempts"
                                            type="number"
                                            min="1"
                                            value={examForm.data.allowed_attempts}
                                            onChange={(e) => examForm.setData('allowed_attempts', parseInt(e.target.value) || 1)}
                                            className="h-11 rounded-xl bg-white dark:bg-background border-border focus:ring-primary font-bold text-foreground"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="passing_score" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('exams.fields.passing_score')}</Label>
                                        <Input
                                            id="passing_score"
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={examForm.data.passing_score ?? ''}
                                            onChange={(e) => examForm.setData('passing_score', parseInt(e.target.value) || 0)}
                                            className="h-11 rounded-xl bg-white dark:bg-background border-border focus:ring-primary font-bold text-foreground"
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
                                            <Label htmlFor="shuffle_questions" className="text-sm cursor-pointer text-foreground font-medium">{t('exams.fields.shuffle_questions')}</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="shuffle_options"
                                                checked={examForm.data.shuffle_options}
                                                onCheckedChange={(checked) => examForm.setData('shuffle_options', checked as boolean)}
                                            />
                                            <Label htmlFor="shuffle_options" className="text-sm cursor-pointer text-foreground font-medium">{t('exams.fields.shuffle_options')}</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="show_results"
                                                checked={examForm.data.show_results}
                                                onCheckedChange={(checked) => examForm.setData('show_results', checked as boolean)}
                                            />
                                            <Label htmlFor="show_results" className="text-sm cursor-pointer text-foreground font-medium">{t('exams.fields.show_results')}</Label>
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
                        <Card className="rounded-3xl border border-border bg-white dark:bg-card shadow-sm overflow-hidden min-h-[600px]">
                            <CardHeader className="p-8 pb-4 bg-slate-50/50 dark:bg-card/40 border-b border-border flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-black tracking-tight text-foreground uppercase">
                                        {t('exams.questions.title')} ({exam.questions?.length || 0})
                                    </CardTitle>
                                    <CardDescription className="text-xs font-black text-primary uppercase tracking-widest mt-1">
                                        {t('exams.questions.points_total')}: {totalPoints}
                                    </CardDescription>
                                </div>
                                <Button 
                                    className="h-10 rounded-xl font-bold transition-all px-6"
                                    onClick={() => { setEditingQuestion(null); questionForm.reset(); setIsQuestionSheetOpen(true); }}
                                >
                                    <PlusIcon className="mr-2 size-4" />
                                    {t('exams.questions.add')}
                                </Button>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                {/* Bulk Import */}
                                <div className="rounded-xl border border-dashed border-border p-4 bg-muted/30 dark:bg-muted/20">
                                    <div className="flex items-center gap-4">
                                        <div className="flex size-14 items-center justify-center rounded-2xl bg-white dark:bg-muted border-2 border-border shadow-xl transition-transform group-hover:scale-110">
                                            <UploadIcon className="size-7 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">{t('exams.questions.import.aiken')}</h3>
                                            <p className="text-xs font-medium text-muted-foreground mt-1 italic">{t('exams.questions.import.aiken.desc')}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-8 text-xs" 
                                                onClick={() => {
                                                    const aikenTemplate = "What is the capital of France?\nA) Paris\nB) Lyon\nC) Marseille\nD) Berlin\nANSWER: A";
                                                    const blob = new Blob([aikenTemplate], { type: 'text/plain' });
                                                    const url = window.URL.createObjectURL(blob);
                                                    const a = document.createElement('a'); a.href = url; a.download = 'aiken_template.txt'; a.click();
                                                }}
                                            >
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
                                <DragDropContext onDragEnd={handleDragEnd}>
                                    <Droppable droppableId="questions">
                                        {(provided) => (
                                            <div 
                                                className="space-y-4"
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                            >
                                                {localQuestions.length === 0 ? (
                                                    <p className="text-center py-8 text-muted-foreground">{t('exams.questions.none') || "No questions yet."}</p>
                                                ) : (
                                                    localQuestions.map((question, index) => (
                                                        <Draggable key={question.id.toString()} draggableId={question.id.toString()} index={index}>
                                                            {(provided, snapshot) => (
                                                                <div 
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    className={cn(
                                                                        "group relative rounded-2xl border-2 p-5 transition-all duration-300 bg-white dark:bg-card",
                                                                        snapshot.isDragging 
                                                                            ? "shadow-2xl border-primary scale-[1.02] z-50 ring-4 ring-primary/10" 
                                                                            : "border-border hover:border-border/80 shadow-sm"
                                                                    )}
                                                                >
                                                                    <div className="flex items-start gap-4">
                                                                        <div 
                                                                            {...provided.dragHandleProps}
                                                                            className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors p-1"
                                                                        >
                                                                            <GripVerticalIcon className="size-5" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0 space-y-3">
                                                                            <div className="flex items-center justify-between">
                                                                               <div className="flex items-center gap-3">
                                                                                   <span className="flex items-center justify-center size-8 rounded-xl bg-muted text-[11px] font-black text-muted-foreground border border-border shadow-sm">#{index + 1}</span>
                                                                                   <Badge variant="outline" className="text-[9px] uppercase font-black bg-muted/50 text-foreground shadow-sm px-2">
                                                                                       {t(`exams.questions.type.${question.type.replace('multiple_choice_single', 'mcq_single').replace('multiple_choice_multiple', 'mcq_multiple')}` as any)}
                                                                                   </Badge>
                                                                                   <Badge variant="secondary" className="text-[10px] font-bold bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 shadow-sm">{question.points} {t('exams.questions.points')}</Badge>
                                                                               </div>
                                                                               <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                    <Button variant="ghost" size="icon" className="size-8 rounded-xl" onClick={() => handleEditQuestion(question)}>
                                                                                        <PencilIcon className="size-4" />
                                                                                    </Button>
                                                                                    <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10 rounded-xl" onClick={() => handleDeleteQuestion(question.id)}>
                                                                                        <TrashIcon className="size-4" />
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            <p className="text-[15px] font-bold text-foreground leading-relaxed pr-8">{question.content}</p>

                                                                            {/* Inline Options View */}
                                                                                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                                                                    {question.options.map(opt => (
                                                                                        <div key={opt.id} className={cn(
                                                                                            "flex items-start gap-3 p-3 rounded-xl border-2 text-sm transition-colors",
                                                                                            opt.is_correct 
                                                                                                ? "border-emerald-500/30 bg-emerald-500/5" 
                                                                                                : "border-border bg-muted/30 text-muted-foreground"
                                                                                        )}>
                                                                                            <div className={cn(
                                                                                                "mt-0.5 shrink-0 size-4 rounded-full flex items-center justify-center border transition-all",
                                                                                                opt.is_correct ? "bg-emerald-500 border-emerald-500 text-white" : "border-border bg-muted"
                                                                                            )}>
                                                                                                {opt.is_correct && <CheckCircleIcon className="size-3" />}
                                                                                            </div>
                                                                                            <span className={cn("font-medium", opt.is_correct ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-muted-foreground")}>{opt.content}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            {question.type === 'true_false' && (
                                                                                 <div className="mt-4 flex gap-3">
                                                                                     <Badge variant="outline" className={cn("px-4 py-1.5 border-2 text-xs rounded-xl transition-all", question.correct_answer === 'true' ? "border-emerald-500 bg-emerald-500/10 text-emerald-600" : "border-border text-muted-foreground")}>{t('exams.questions.true')}</Badge>
                                                                                     <Badge variant="outline" className={cn("px-4 py-1.5 border-2 text-xs rounded-xl transition-all", question.correct_answer === 'false' ? "border-emerald-500 bg-emerald-500/10 text-emerald-600" : "border-border text-muted-foreground")}>{t('exams.questions.false')}</Badge>
                                                                                 </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))
                                                )}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Question Editor Sheet */}
            <Sheet open={isQuestionSheetOpen} onOpenChange={setIsQuestionSheetOpen}>
                <SheetContent className="sm:max-w-xl overflow-y-auto bg-background p-0 border-l border-border shadow-2xl">
                    <div className="flex flex-col h-full">
                        <SheetHeader className="px-8 py-8 border-b border-border sticky top-0 z-10 bg-background/90 backdrop-blur-xl">
                            <div className="flex items-center gap-4">
                                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                                    {editingQuestion ? <PencilIcon className="size-6" /> : <PlusIcon className="size-6" />}
                                </div>
                                <div>
                                    <SheetTitle className="text-2xl font-black text-foreground tracking-tight">
                                        {editingQuestion ? t('exams.questions.edit') : t('exams.questions.new')}
                                    </SheetTitle>
                                    <SheetDescription className="text-muted-foreground text-sm">
                                        {editingQuestion ? t('exams.questions.edit.description') : t('exams.questions.new.description')}
                                    </SheetDescription>
                                </div>
                            </div>
                        </SheetHeader>
                        
                        <form onSubmit={handleQuestionSubmit} className="flex-1 px-8 py-8 space-y-10">
                            {/* Section: Configuration */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-primary whitespace-nowrap">
                                        {t('exams.questions.setup')}
                                    </Label>
                                    <Separator className="flex-1" />
                                </div>
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('exams.questions.type')}</Label>
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
                                            <SelectTrigger className="h-12 rounded-2xl bg-background border-border focus:ring-primary transition-all font-black text-foreground">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-border bg-popover">
                                                {availableQuestionTypes.map(type => (
                                                    <SelectItem key={type.value} value={type.value} className="rounded-xl font-bold py-3">{type.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="q-points" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('exams.questions.points')}</Label>
                                        <Input
                                            id="q-points"
                                            type="number"
                                            min={0.1}
                                            step={0.1}
                                            value={questionForm.data.points}
                                            onChange={(e) => questionForm.setData('points', parseFloat(e.target.value) || 1)}
                                            className="h-12 rounded-2xl bg-background border-border focus-visible:ring-primary font-black text-foreground"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Question Content */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-primary whitespace-nowrap">
                                        {t('exams.questions.label_content')}
                                    </Label>
                                    <Separator className="flex-1" />
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="q-content" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('exams.questions.content')}</Label>
                                    <Textarea
                                        id="q-content"
                                        value={questionForm.data.content}
                                        onChange={(e) => questionForm.setData('content', e.target.value)}
                                        placeholder={t('exams.questions.content.placeholder')}
                                        className="min-h-[140px] rounded-2xl bg-background border-border focus-visible:ring-primary resize-none leading-relaxed p-6 font-bold text-foreground placeholder:text-muted-foreground/50"
                                    />
                                    <InputError message={questionForm.errors.content} />
                                </div>
                            </div>

                            {/* Section: Options */}
                            {needsOptions && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-primary whitespace-nowrap">
                                            {t('exams.questions.choices')}
                                        </Label>
                                        <Separator className="flex-1" />
                                        <Badge variant="outline" className="rounded-full bg-muted text-[10px] font-black uppercase tracking-tighter text-muted-foreground px-3 border-border shadow-sm">{questionForm.data.options.length} {t('exams.questions.options')}</Badge>
                                    </div>
                                    <div className="space-y-4">
                                        {questionForm.data.options.map((option, index) => (
                                            <div key={index} className="flex items-start gap-4 group p-4 rounded-2xl bg-card border-2 border-border transition-all hover:border-primary">
                                                <div className="flex items-center justify-center mt-2.5">
                                                     <Checkbox
                                                         checked={option.is_correct}
                                                         onCheckedChange={(checked) => updateOption(index, 'is_correct', checked as boolean)}
                                                         className="size-6 rounded-lg border-2 border-border data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 transition-all shadow-sm"
                                                     />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <Input
                                                        value={option.content}
                                                        onChange={(e) => updateOption(index, 'content', e.target.value)}
                                                        placeholder={`${t('exams.questions.options.placeholder')} ${index + 1}`}
                                                        className="h-10 bg-background/50 border-border rounded-lg px-3 focus-visible:ring-primary font-bold text-foreground placeholder:text-muted-foreground/50"
                                                    />
                                                </div>
                                                {questionForm.data.options.length > 2 && (
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)} className="mt-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl shrink-0 transition-all">
                                                        <TrashIcon className="size-5" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <Button type="button" variant="outline" onClick={addOption} className="w-full h-14 rounded-2xl border-dashed border-2 border-border bg-muted/10 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all text-muted-foreground text-[11px] font-black uppercase tracking-widest shadow-sm">
                                        <PlusIcon className="mr-2 size-5" />
                                        {t('exams.questions.options.add')}
                                    </Button>
                                </div>
                            )}

                            {/* True/False */}
                            {isTrueFalse && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-primary whitespace-nowrap">
                                            {t('exams.questions.verification')}
                                        </Label>
                                        <Separator className="flex-1" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('exams.questions.correct_answer')}</Label>
                                        <Select 
                                            value={questionForm.data.correct_answer} 
                                            onValueChange={(val) => questionForm.setData('correct_answer', val)}
                                        >
                                            <SelectTrigger className="h-12 rounded-2xl bg-background border-border focus:ring-primary font-bold text-foreground transition-all">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-border bg-popover">
                                                <SelectItem value="true" className="rounded-xl font-bold py-3 text-emerald-600 dark:text-emerald-400">{t('exams.questions.correct_answer.true')}</SelectItem>
                                                <SelectItem value="false" className="rounded-xl font-bold py-3 text-rose-600 dark:text-rose-400">{t('exams.questions.correct_answer.false')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            {/* Short text */}
                            {questionForm.data.type === 'short_text' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-primary whitespace-nowrap">
                                            {t('exams.questions.verification')}
                                        </Label>
                                        <Separator className="flex-1" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="q-correct" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('exams.questions.correct_answers')}</Label>
                                        <Input
                                            id="q-correct"
                                            value={questionForm.data.correct_answer}
                                            onChange={(e) => questionForm.setData('correct_answer', e.target.value)}
                                            placeholder={t('exams.questions.correct_answer.placeholder')}
                                            className="h-12 rounded-2xl bg-background border-border focus-visible:ring-primary font-bold text-foreground p-4"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Essay */}
                            {questionForm.data.type === 'essay' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-primary whitespace-nowrap">
                                            {t('exams.questions.grading')}
                                        </Label>
                                        <Separator className="flex-1" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="q-notes" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('exams.questions.grading_notes')}</Label>
                                        <Textarea
                                            id="q-notes"
                                            value={questionForm.data.grading_notes}
                                            onChange={(e) => questionForm.setData('grading_notes', e.target.value)}
                                            placeholder={t('exams.questions.grading_notes.placeholder')}
                                            className="min-h-[140px] rounded-2xl bg-background border-border focus-visible:ring-primary resize-none leading-relaxed p-6 font-medium text-foreground"
                                        />
                                    </div>
                                </div>
                            )}
                            
                            <div className="pb-20"></div>
                        </form>
                        
                        {/* Sticky Bottom Actions */}
                        <div className="bg-background/95 backdrop-blur-xl border-t border-border p-8 flex gap-4 justify-end sticky bottom-0 z-10">
                            <Button type="button" variant="ghost" onClick={() => setIsQuestionSheetOpen(false)} className="rounded-[1.25rem] h-14 px-10 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                                {t('common.cancel')}
                            </Button>
                            <Button type="submit" disabled={questionForm.processing} className="rounded-[1.25rem] h-14 px-12 text-[11px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/30 transition-all active:scale-[0.98]">
                                {editingQuestion ? t('common.save') : t('exams.questions.add')}
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </AppLayout>
    );
}