import { Head, router, Link } from '@inertiajs/react';
import {
    CheckCircleIcon,
    SaveIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ArrowLeftIcon,
    ClockIcon,
    ShieldAlertIcon,
    TrophyIcon,
    CheckIcon,
    XIcon,
    FileTextIcon,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
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
    exam: Exam & { total_points: number };
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
    const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(
        questions.find(q => q.type === 'short_text' || q.type === 'essay')?.id || questions[0]?.id || null
    );

    const handleGradeAnswer = async (
        answerId: number,
        points: number,
        feedback: string,
    ) => {
        setSavingQuestion(answerId);
        try {
            const response = await fetch(`/grading/attempt/${attempt.id}/answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'))?.[2] || ''),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    answer_id: answerId,
                    points_earned: points,
                    feedback: feedback,
                }),
            });
            
            if (response.ok) {
                router.reload({ only: ['questions', 'attempt'] });
            }
        } finally {
            setSavingQuestion(null);
        }
    };

    const handleFinalize = () => {
        if (
            confirm(
                'Finalize grading? This will calculate the final score and notify the student.',
            )
        ) {
            router.post(`/grading/attempt/${attempt.id}/finalize`);
        }
    };

    const manualQuestions = useMemo(() => 
        questions.filter(q => q.type === 'short_text' || q.type === 'essay'),
    [questions]);

    const needsManualGradingCount = manualQuestions.filter(q => q.answer && q.answer.is_correct === null).length;

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

    const selectedQuestion = questions.find(q => q.id === selectedQuestionId);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Grade: ${attempt.student.name}`} />
            
            <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
                {/* Fixed Top Nav Bar */}
                <div className="flex items-center justify-between border-b bg-background px-6 py-3 shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild className="rounded-full">
                            <Link href={`/grading/${exam.id}`}>
                                <ArrowLeftIcon className="size-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-lg font-black tracking-tight">{attempt.student.name}</h1>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                {exam.title} • Attempt #{attempt.attempt_number}
                            </p>
                        </div>
                        <Badge className={cn(
                            "ml-2 uppercase text-[10px] font-black",
                            attempt.status === 'graded' ? "bg-emerald-500" : "bg-amber-500"
                        )}>
                            {attempt.status.replace(/_/g, ' ')}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center border rounded-lg overflow-hidden mr-2">
                            {previousAttemptId ? (
                                <Link 
                                    href={`/grading/attempt/${previousAttemptId}`}
                                    className="p-2 hover:bg-muted transition-colors border-r"
                                    title="Previous Student"
                                >
                                    <ChevronLeftIcon className="size-4" />
                                </Link>
                            ) : (
                                <div className="p-2 opacity-20 border-r cursor-not-allowed bg-muted/50">
                                    <ChevronLeftIcon className="size-4" />
                                </div>
                            )}
                            
                            {nextAttemptId ? (
                                <Link 
                                    href={`/grading/attempt/${nextAttemptId}`}
                                    className="p-2 hover:bg-muted transition-colors"
                                    title="Next Student"
                                >
                                    <ChevronRightIcon className="size-4" />
                                </Link>
                            ) : (
                                <div className="p-2 opacity-20 cursor-not-allowed bg-muted/50">
                                    <ChevronRightIcon className="size-4" />
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={handleFinalize}
                            disabled={needsManualGradingCount > 0}
                            className={cn(
                                "font-black tracking-wide",
                                needsManualGradingCount === 0 ? "bg-emerald-600 hover:bg-emerald-700" : ""
                            )}
                        >
                            {needsManualGradingCount > 0 
                                ? `Finish Review (${needsManualGradingCount} left)` 
                                : 'Finalize & Publish Grade'}
                        </Button>
                    </div>
                </div>

                {/* Main Side-by-Side Area */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Left Panel: Full Exam View */}
                    <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 border-r overflow-hidden flex flex-col">
                        <div className="p-4 border-b bg-background/50 backdrop-blur-sm flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Student Submission</span>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                                    <ClockIcon className="size-3.5" />
                                    {attempt.submitted_at 
                                        ? Math.round((new Date(attempt.submitted_at).getTime() - new Date(attempt.started_at).getTime()) / 60000)
                                        : '?'
                                    }m taken
                                </div>
                                <div className={cn(
                                    "flex items-center gap-1.5 text-xs font-bold",
                                    attempt.violation_count > 0 ? "text-rose-600" : "text-muted-foreground"
                                )}>
                                    <ShieldAlertIcon className="size-3.5" />
                                    {attempt.violation_count} violations
                                </div>
                            </div>
                        </div>
                        
                        <ScrollArea className="flex-1 p-8">
                            <div className="max-w-3xl mx-auto space-y-8 pb-20">
                                {questions.map((q, idx) => (
                                    <div 
                                        key={q.id} 
                                        id={`q-${q.id}`}
                                        className={cn(
                                            "group relative rounded-2xl border bg-background p-6 transition-all duration-200",
                                            selectedQuestionId === q.id ? "ring-2 ring-blue-500 border-blue-200 shadow-lg" : "hover:border-slate-300",
                                            q.answer?.is_correct === true ? "border-l-emerald-500 border-l-4" : 
                                            q.answer?.is_correct === false ? "border-l-rose-500 border-l-4" : "border-l-amber-500 border-l-4"
                                        )}
                                        onClick={() => setSelectedQuestionId(q.id)}
                                    >
                                        <div className="mb-4 flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="flex size-7 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white dark:bg-white dark:text-slate-900">
                                                    {idx + 1}
                                                </span>
                                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter">
                                                    {q.type.replace(/_/g, ' ')}
                                                </Badge>
                                            </div>
                                            <div className="text-sm font-black text-slate-400 group-hover:text-slate-600 transition-colors">
                                                {q.answer?.points_earned || 0} / {q.points} PTS
                                            </div>
                                        </div>

                                        <p className="mb-6 text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                                            {q.content}
                                        </p>

                                        {/* Answer Content based on Type */}
                                        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/80 p-4 border border-slate-100 dark:border-slate-800">
                                            {(q.type === 'multiple_choice_single' || q.type === 'multiple_choice_multiple') && (
                                                <div className="space-y-2">
                                                    {q.options?.map(opt => {
                                                        const isSelected = q.answer?.selected_options?.includes(opt.id);
                                                        return (
                                                            <div key={opt.id} className={cn(
                                                                "flex items-center justify-between rounded-lg px-3 py-2 text-sm border",
                                                                isSelected 
                                                                    ? opt.is_correct ? "bg-emerald-50 border-emerald-200 text-emerald-900 font-bold" : "bg-rose-50 border-rose-200 text-rose-900 font-bold"
                                                                    : opt.is_correct ? "bg-slate-100 border-dashed border-emerald-300 opacity-60" : "bg-white border-slate-100 opacity-40"
                                                            )}>
                                                                <div className="flex items-center gap-2">
                                                                    {isSelected ? <CheckIcon className="size-3.5" /> : <div className="size-3.5" />}
                                                                    {opt.content}
                                                                </div>
                                                                {opt.is_correct && <Badge variant="outline" className="bg-emerald-500 text-white border-none h-4 text-[8px]">Correct</Badge>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {q.type === 'true_false' && (
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "flex-1 rounded-lg border p-3 text-center text-sm font-black uppercase",
                                                        q.answer?.text_answer === q.correct_answer ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"
                                                    )}>
                                                        {q.answer?.text_answer || 'NO ANSWER'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground font-black uppercase tracking-widest">
                                                        vs Correct: {q.correct_answer}
                                                    </div>
                                                </div>
                                            )}

                                            {(q.type === 'short_text' || q.type === 'essay') && (
                                                <div className="space-y-3">
                                                    <div className="text-sm font-medium whitespace-pre-wrap leading-relaxed">
                                                        {q.answer?.text_answer || <span className="italic text-muted-foreground opacity-50">Student provided no answer for this question.</span>}
                                                    </div>
                                                    {q.correct_answer && (
                                                        <div className="mt-4 border-t pt-3">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block mb-1">Expected / Reference Answer</span>
                                                            <div className="text-xs text-emerald-700 font-bold italic">{q.correct_answer}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Right Panel: Grading Sidebar */}
                    <div className="w-[400px] bg-background border-l flex flex-col overflow-hidden shadow-2xl relative z-20">
                        <div className="p-4 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-900">
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Grading Dashboard</h2>
                            <TrophyIcon className="size-4 text-amber-500" />
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-6 space-y-8">
                                {/* Overall Progress */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-black text-slate-900 dark:text-slate-100">Live Score Preview</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Updates as you grade</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-black tracking-tighter text-blue-600">
                                                {attempt.score !== null ? `${Math.round(attempt.score)}` : '0'}
                                                <span className="text-sm text-slate-400 ml-1 font-bold">/ {exam.total_points}</span>
                                            </p>
                                            <Badge variant="secondary" className="font-black text-[10px] px-1.5 h-5 bg-blue-100 text-blue-700">
                                                {attempt.percentage || 0}%
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-blue-600 transition-all duration-500" 
                                            style={{ width: `${attempt.percentage || 0}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="border-t pt-6">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Manual Review Queue</h3>
                                    
                                    {manualQuestions.length === 0 ? (
                                        <div className="rounded-xl border border-dashed p-8 text-center bg-slate-50/50">
                                            <CheckCircleIcon className="size-8 text-emerald-500 mx-auto mb-3 opacity-50" />
                                            <p className="text-xs font-bold text-slate-500">No free-text questions in this exam</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {manualQuestions.map((q, i) => (
                                                <button
                                                    key={q.id}
                                                    onClick={() => {
                                                        setSelectedQuestionId(q.id);
                                                        document.getElementById(`q-${q.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center justify-between rounded-xl border p-3 text-left transition-all group",
                                                        selectedQuestionId === q.id 
                                                            ? "border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-500" 
                                                            : "hover:border-slate-300 hover:bg-slate-50"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "flex size-6 items-center justify-center rounded-lg text-[10px] font-black",
                                                            q.answer && q.answer.is_correct !== null 
                                                                ? "bg-emerald-500 text-white" 
                                                                : "bg-slate-200 text-slate-500"
                                                        )}>
                                                            {i + 1}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-black truncate w-40">{q.content}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Max {q.points} pts</p>
                                                        </div>
                                                    </div>
                                                    {q.answer && q.answer.is_correct !== null ? (
                                                        <div className="text-[10px] font-black text-emerald-600">
                                                            {q.answer.points_earned} pts
                                                        </div>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[8px] font-black text-amber-600 border-amber-200 bg-amber-50">Pending</Badge>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Active Grading Form */}
                                {selectedQuestion && (selectedQuestion.type === 'short_text' || selectedQuestion.type === 'essay') && (
                                    <div className="border-t pt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                        <div className="mb-4 flex items-center justify-between">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Evaluating Q{questions.indexOf(selectedQuestion) + 1}</h3>
                                            <Badge className="bg-slate-900 font-black">{selectedQuestion.points} PTS MAX</Badge>
                                        </div>
                                        
                                        {selectedQuestion.answer ? (
                                            <GradeForm
                                                key={`${selectedQuestion.id}-${selectedQuestion.answer.id}`}
                                                answer={selectedQuestion.answer}
                                                maxPoints={selectedQuestion.points}
                                                saving={savingQuestion === selectedQuestion.answer.id}
                                                onSave={(points, feedback) => 
                                                    handleGradeAnswer(selectedQuestion.answer!.id, points, feedback)
                                                }
                                            />
                                        ) : (
                                            <div className="rounded-xl bg-slate-50 p-6 text-center border border-dashed">
                                                <XIcon className="size-6 text-slate-300 mx-auto mb-2" />
                                                <p className="text-xs font-bold text-slate-400">No answer to grade</p>
                                            </div>
                                        )}

                                        {selectedQuestion.grading_notes && (
                                            <div className="mt-6 rounded-xl bg-amber-50/50 p-4 border border-amber-100">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 flex items-center gap-1 mb-2">
                                                    <FileTextIcon className="size-3" />
                                                    Your Grading Notes
                                                </span>
                                                <p className="text-xs font-medium text-amber-800 italic leading-relaxed">
                                                    "{selectedQuestion.grading_notes}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
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

    const setQuickGrade = (val: number) => {
        setPoints(val.toString());
    };

    return (
        <div className="space-y-5">
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Points Awarded</Label>
                    <span className="text-[10px] font-bold text-slate-400 italic">Range: 0 to {maxPoints}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        min={0}
                        max={maxPoints}
                        step={0.1}
                        value={points}
                        onChange={(e) => setPoints(e.target.value)}
                        className="h-12 text-lg font-black text-center w-24 border-2 focus-visible:ring-blue-500"
                    />
                    <div className="flex-1 flex gap-1">
                        <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-[10px] font-black h-12 uppercase border-2 hover:bg-emerald-50 hover:border-emerald-200"
                            onClick={() => setQuickGrade(maxPoints)}
                        >Full</Button>
                        <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-[10px] font-black h-12 uppercase border-2 hover:bg-blue-50 hover:border-blue-200"
                            onClick={() => setQuickGrade(maxPoints / 2)}
                        >Half</Button>
                        <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-[10px] font-black h-12 uppercase border-2 hover:bg-rose-50 hover:border-rose-200"
                            onClick={() => setQuickGrade(0)}
                        >Zero</Button>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Feedback for Student</Label>
                <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Example: Great work on explaining the core concepts..."
                    className="min-h-[100px] w-full rounded-xl border-2 p-3 text-sm font-medium focus:border-blue-500 focus:outline-none transition-all"
                />
            </div>

            <Button
                className="w-full h-12 font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                onClick={() => onSave(parseFloat(points) || 0, feedback)}
                disabled={saving}
            >
                {saving ? (
                    <>
                        <SaveIcon className="mr-2 size-4 animate-spin" />
                        Saving Grade...
                    </>
                ) : (
                    <>
                        <SaveIcon className="mr-2 size-4" />
                        Save Evaluation
                    </>
                )}
            </Button>
        </div>
    );
}
