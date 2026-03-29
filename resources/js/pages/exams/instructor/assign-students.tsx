import { Head, useForm, Link } from '@inertiajs/react';
import { 
    SearchIcon, 
    CheckIcon, 
    UsersIcon, 
    MailIcon, 
    UserPlusIcon, 
    ArrowLeftIcon,
    InfoIcon
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguageStandalone } from '@/hooks/use-language';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem, Exam, User } from '@/types';

interface Props {
    exam: Exam & { assigned_students: User[] };
    students: User[];
    groups: string[];
}

export default function AssignStudents({ exam, students, groups }: Props) {
    const { t } = useLanguageStandalone();
    const [search, setSearch] = useState('');
    
    const initialSelectedIds = useMemo(() => 
        (exam.assigned_students || []).map((s) => s.id), 
    [exam.assigned_students]);

    const { data, setData, post, processing } = useForm({
        student_ids: initialSelectedIds,
        emails: '',
    });

    // Reset form when props change
    useEffect(() => {
        setData('student_ids', initialSelectedIds);
    }, [initialSelectedIds, setData]);

    const filteredStudents = useMemo(() => {
        return students.filter(
            (s) =>
                s.name.toLowerCase().includes(search.toLowerCase()) ||
                s.email.toLowerCase().includes(search.toLowerCase()),
        );
    }, [students, search]);

    const toggleStudent = (id: number) => {
        const currentIds = Array.isArray(data.student_ids) ? data.student_ids : [];
        if (currentIds.includes(id)) {
            setData('student_ids', currentIds.filter(currentId => currentId !== id));
        } else {
            setData('student_ids', [...currentIds, id]);
        }
    };

    const toggleGroup = (groupName: string) => {
        const groupStudents = students.filter(s => s.group === groupName).map(s => s.id);
        const currentIds = Array.isArray(data.student_ids) ? data.student_ids : [];
        
        const allInGroupSelected = groupStudents.every(id => currentIds.includes(id));
        
        if (allInGroupSelected) {
            setData('student_ids', currentIds.filter(id => !groupStudents.includes(id)));
        } else {
            setData('student_ids', Array.from(new Set([...currentIds, ...groupStudents])));
        }
    };

    const hasChanges = useMemo(() => {
        if (data.emails.trim().length > 0) return true;
        
        const currentIds = Array.isArray(data.student_ids) ? data.student_ids : [];
        if (currentIds.length !== initialSelectedIds.length) return true;
        
        const sortedSelected = [...currentIds].sort().join(',');
        const sortedInitial = [...initialSelectedIds].sort().join(',');
        
        const changed = sortedSelected !== sortedInitial;
        console.log('Change detection:', { sortedSelected, sortedInitial, changed });
        return changed;
    }, [data.student_ids, data.emails, initialSelectedIds]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submitting assignment data:', data);
        post(`/exams/${exam.id}/assign`, {
            preserveScroll: true,
            onSuccess: () => console.log('Successfully saved!'),
            onError: (err) => console.log('Error saving:', err),
        });
    };

    const selectAll = () => {
        setData('student_ids', students.map(s => s.id));
    };

    const deselectAll = () => {
        setData('student_ids', []);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('common.dashboard'), href: '/dashboard' },
        { title: t('exams.title'), href: '/exams' },
        { title: exam.title, href: `/exams/${exam.id}` },
        { title: t('exams.assign.breadcrumb'), href: `/exams/${exam.id}/assign` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('exams.assign.breadcrumb')}: ${exam.title}`} />
            
            <div className="flex flex-col gap-8 p-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col gap-4 rounded-[2.5rem] bg-gradient-to-br from-indigo-700 via-blue-600 to-cyan-500 dark:from-primary/30 dark:via-primary/10 dark:to-background p-8 text-white shadow-2xl shadow-indigo-500/20 sm:flex-row sm:items-center sm:justify-between border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <Button variant="ghost" size="icon" asChild className="rounded-2xl text-white hover:bg-white/10 hover:text-white border border-white/10 shadow-xl backdrop-blur-md transition-all shrink-0">
                                <Link href={`/exams/${exam.id}`}>
                                    <ArrowLeftIcon className="size-5" />
                                </Link>
                            </Button>
                            <h1 className="text-2xl font-black tracking-tight uppercase italic drop-shadow-md">{t('exams.assign.title')}</h1>
                        </div>
                        <p className="text-blue-50 font-bold max-w-md italic text-sm opacity-90">
                            {t('exams.assign.description')} <span className="text-white font-black underline decoration-white/30 decoration-2 underline-offset-4">{exam.title}</span>.
                        </p>
                    </div>
                    <UsersIcon className="absolute -right-8 -bottom-8 size-48 text-white/10 rotate-12 pointer-events-none" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 pb-20">
                    <Tabs defaultValue="search" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-16 p-0.5 bg-slate-100/80 dark:bg-muted/80 backdrop-blur-md rounded-[1.5rem] mb-8 border border-slate-200/50 dark:border-border/50 shadow-lg">
                            <TabsTrigger value="search" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl transition-all duration-300">
                                <SearchIcon className="mr-2 size-4" />
                                {t('exams.assign.tabs.directory')}
                            </TabsTrigger>
                            <TabsTrigger value="bulk" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl transition-all duration-300">
                                <MailIcon className="mr-2 size-4" />
                                {t('exams.assign.tabs.bulk')}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="search" className="mt-0 focus-visible:ring-0">
                            <div className="flex flex-wrap gap-2 mb-6">
                                {groups.map(group => {
                                    const groupStudents = students.filter(s => s.group === group).map(s => s.id);
                                    const currentIds = Array.isArray(data.student_ids) ? data.student_ids : [];
                                    const allInGroupSelected = groupStudents.every(id => currentIds.includes(id));
                                    
                                    return (
                                        <button
                                            key={group}
                                            type="button"
                                            onClick={() => toggleGroup(group)}
                                            className={cn(
                                                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                                                allInGroupSelected 
                                                    ? "bg-primary border-primary text-primary-foreground shadow-xl shadow-primary/20 scale-105" 
                                                    : "bg-card/40 backdrop-blur-md border-border/50 text-muted-foreground hover:border-primary/50"
                                            )}
                                        >
                                            {group}
                                        </button>
                                    );
                                })}
                            </div>

                             <Card className="rounded-[2.5rem] border border-border/50 shadow-2xl overflow-hidden bg-card/40 backdrop-blur-md pt-0 border-t-white/10 dark:border-t-white/5">
                                <CardHeader className="bg-primary/5 dark:bg-primary/10 border-b border-primary/10 px-8 py-8">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                        <div className="relative flex-1 w-full lg:max-w-md group">
                                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <Input
                                                placeholder={t('common.search')}
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                className="pl-11 h-14 border-border/50 rounded-2xl bg-background/50 font-bold italic transition-all focus-visible:ring-primary shadow-sm"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button type="button" variant="outline" size="lg" onClick={selectAll} className="flex-1 lg:flex-none font-black text-[10px] uppercase tracking-widest h-12 rounded-2xl border-border/50 hover:bg-accent transition-all shadow-sm">
                                                {t('common.selectAll')}
                                            </Button>
                                            <Button type="button" variant="ghost" size="lg" onClick={deselectAll} className="flex-1 lg:flex-none font-black text-[10px] uppercase tracking-widest h-12 rounded-2xl text-destructive hover:text-destructive hover:bg-destructive/10 transition-all">
                                                {t('common.clearAll')}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="min-h-[400px] max-h-[600px] overflow-y-auto divide-y divide-border/50 bg-card/20 custom-scrollbar">
                                        {filteredStudents.length > 0 ? (
                                            filteredStudents.map((student) => {
                                                const currentIds = Array.isArray(data.student_ids) ? data.student_ids : [];
                                                const isSelected = currentIds.includes(student.id);
                                                return (
                                                    <div
                                                        key={student.id}
                                                        className={cn(
                                                            "flex items-center justify-between px-8 py-5 transition-all group",
                                                            isSelected ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-accent/50"
                                                        )}
                                                    >
                                                        <label className="flex items-center gap-5 flex-1 cursor-pointer" htmlFor={`student-${student.id}`}>
                                                            <div className={cn(
                                                                "flex size-12 shrink-0 items-center justify-center rounded-2xl font-black text-sm transition-all duration-300 border-2 shadow-sm",
                                                                isSelected 
                                                                    ? "bg-primary border-primary text-primary-foreground shadow-xl shadow-primary/20" 
                                                                    : "bg-muted border-border/50 text-muted-foreground group-hover:border-primary/50"
                                                            )}>
                                                                {isSelected ? <CheckIcon className="size-6" /> : student.name.charAt(0)}
                                                            </div>
                                                            <div className="min-w-0 pr-4">
                                                                <p className={cn(
                                                                    "font-black tracking-tight transition-colors truncate text-lg",
                                                                    isSelected ? "text-primary" : "text-foreground"
                                                                )}>
                                                                    {student.name}
                                                                </p>
                                                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground truncate opacity-60">
                                                                    {student.email}
                                                                </p>
                                                            </div>
                                                        </label>
                                                        <Checkbox
                                                            id={`student-${student.id}`}
                                                            checked={isSelected}
                                                            onCheckedChange={() => toggleStudent(student.id)}
                                                            className="rounded-xl h-7 w-7 border-2 border-border/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all shadow-xl"
                                                        />
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="py-24 text-center flex flex-col items-center opacity-40">
                                                <UsersIcon className="size-16 text-muted-foreground mb-4" />
                                                <p className="text-muted-foreground font-black uppercase tracking-widest text-xs italic">{t('common.noResults')}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="bulk" className="mt-0 focus-visible:ring-0">
                            <Card className="rounded-[2.5rem] border border-border/50 shadow-2xl overflow-hidden bg-card/40 backdrop-blur-md pt-0 border-t-white/10 dark:border-t-white/5">
                                <CardHeader className="bg-primary/5 dark:bg-primary/10 border-b border-primary/10 px-8 py-8">
                                    <CardTitle className="text-xl font-black uppercase tracking-tighter italic text-foreground">{t('exams.assign.bulk.title')}</CardTitle>
                                    <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t('exams.assign.bulk.description')}</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <div className="rounded-[2rem] bg-indigo-500/5 p-6 border border-indigo-500/20 flex gap-5 transition-all shadow-inner">
                                        <div className="h-12 w-12 rounded-2xl bg-white/50 dark:bg-card flex items-center justify-center shrink-0 shadow-xl border border-indigo-500/10">
                                            <InfoIcon className="size-6 text-indigo-500" />
                                        </div>
                                        <p className="text-xs font-black text-foreground/80 leading-relaxed italic uppercase tracking-tight">
                                            {t('exams.assign.bulk.notice')}
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground pl-2">{t('exams.assign.bulk.label')}</Label>
                                        <textarea
                                            value={data.emails}
                                            onChange={(e) => setData('emails', e.target.value)}
                                            placeholder={t('exams.assign.bulk.placeholder')}
                                            className="min-h-[350px] w-full rounded-[2.5rem] border-2 border-border/50 p-8 text-sm font-bold focus:border-primary focus:ring-0 transition-all bg-background/30 text-foreground shadow-inner placeholder:text-muted-foreground/20 italic"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Floating Bottom Action Bar */}
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
                        <div className="bg-background/95 dark:bg-card/95 backdrop-blur-xl text-foreground border border-border shadow-2xl rounded-[2rem] p-3 sm:p-4 flex items-center justify-between gap-2 sm:gap-6 ring-1 ring-border shadow-primary/10">
                            <div className="flex items-center gap-3 sm:gap-4 pl-1 sm:pl-2">
                                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20">
                                    <UserPlusIcon className="size-5 sm:size-6" />
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-lg sm:text-xl font-black tracking-tighter italic leading-none mb-0.5">{(Array.isArray(data.student_ids) ? data.student_ids : []).length}</p>
                                    <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">{t('exams.assign.selected')}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-1 sm:gap-2 pr-1 sm:pr-2">
                                <Button
                                    variant="ghost"
                                    type="button"
                                    asChild
                                    className="font-black text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-accent transition-colors h-10 sm:h-11 px-3 sm:px-4 rounded-xl"
                                >
                                    <Link href={`/exams/${exam.id}`}>{t('common.cancel')}</Link>
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing || !hasChanges}
                                    className="px-4 sm:px-8 font-black uppercase tracking-widest text-[10px] sm:text-[11px] h-10 sm:h-11 rounded-xl sm:rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {processing ? t('common.loading') : t('exams.assign.save')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
