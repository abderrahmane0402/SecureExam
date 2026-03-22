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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem, Exam, User } from '@/types';

interface Props {
    exam: Exam & { assigned_students: User[] };
    students: User[];
    groups: string[];
}

export default function AssignStudents({ exam, students, groups }: Props) {
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
    }, [initialSelectedIds]);

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
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Exams', href: '/exams' },
        { title: exam.title, href: `/exams/${exam.id}` },
        { title: 'Assign Students', href: `/exams/${exam.id}/assign` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Assign: ${exam.title}`} />
            
            <div className="flex flex-col gap-8 p-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col gap-4 rounded-2xl bg-indigo-950 p-8 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <Button variant="ghost" size="icon" asChild className="rounded-full text-indigo-200 hover:bg-white/10 hover:text-white">
                                <Link href={`/exams/${exam.id}`}>
                                    <ArrowLeftIcon className="size-5" />
                                </Link>
                            </Button>
                            <h1 className="text-2xl font-black tracking-tight uppercase">Manage Access</h1>
                        </div>
                        <p className="text-indigo-200 font-medium max-w-md">
                            Control which students are allowed to take <span className="text-white font-bold">{exam.title}</span>.
                        </p>
                    </div>
                    <UsersIcon className="absolute -right-8 -bottom-8 size-48 text-indigo-900/40 rotate-12" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 pb-20">
                    <Tabs defaultValue="search" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
                            <TabsTrigger value="search" className="rounded-lg font-black uppercase text-xs tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <SearchIcon className="mr-2 size-4" />
                                Student Directory
                            </TabsTrigger>
                            <TabsTrigger value="bulk" className="rounded-lg font-black uppercase text-xs tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <MailIcon className="mr-2 size-4" />
                                Bulk Invite (Emails)
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="search" className="mt-0 focus-visible:ring-0">
                            <div className="flex flex-wrap gap-2 mb-4">
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
                                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                                                allInGroupSelected 
                                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200" 
                                                    : "bg-white dark:bg-slate-900 border-slate-200 text-slate-500 hover:border-indigo-300"
                                            )}
                                        >
                                            {group}
                                        </button>
                                    );
                                })}
                            </div>

                            <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b px-8 py-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="relative flex-1 max-w-md">
                                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search by name or email..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                className="pl-10 h-11 border-slate-200 rounded-xl bg-white focus-visible:ring-indigo-500"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="button" variant="outline" size="sm" onClick={selectAll} className="font-bold text-[10px] uppercase tracking-widest h-9 rounded-lg">
                                                Select All
                                            </Button>
                                            <Button type="button" variant="ghost" size="sm" onClick={deselectAll} className="font-bold text-[10px] uppercase tracking-widest h-9 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                                                Clear All
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                        {filteredStudents.length > 0 ? (
                                            filteredStudents.map((student) => {
                                                const currentIds = Array.isArray(data.student_ids) ? data.student_ids : [];
                                                const isSelected = currentIds.includes(student.id);
                                                return (
                                                    <div
                                                        key={student.id}
                                                        className={cn(
                                                            "flex items-center justify-between px-8 py-4 transition-all group",
                                                            isSelected ? "bg-indigo-50/50 dark:bg-indigo-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-900/50"
                                                        )}
                                                    >
                                                        <label className="flex items-center gap-4 flex-1 cursor-pointer" htmlFor={`student-${student.id}`}>
                                                            <div className={cn(
                                                                "flex size-10 items-center justify-center rounded-xl font-bold transition-all duration-300 border-2",
                                                                isSelected 
                                                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200" 
                                                                    : "bg-white dark:bg-slate-800 border-slate-200 text-slate-400 group-hover:border-indigo-300"
                                                            )}>
                                                                {isSelected ? <CheckIcon className="size-5" /> : student.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className={cn(
                                                                    "font-bold tracking-tight transition-colors",
                                                                    isSelected ? "text-indigo-900 dark:text-indigo-100" : "text-slate-700 dark:text-slate-300"
                                                                )}>
                                                                    {student.name}
                                                                </p>
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                                    {student.email}
                                                                </p>
                                                            </div>
                                                        </label>
                                                        <Checkbox
                                                            id={`student-${student.id}`}
                                                            checked={isSelected}
                                                            onCheckedChange={() => toggleStudent(student.id)}
                                                            className="rounded-md border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                                        />
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="py-20 text-center flex flex-col items-center">
                                                <UsersIcon className="size-12 text-slate-200 mb-4" />
                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No students found matching your search</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="bulk" className="mt-0 focus-visible:ring-0">
                            <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b px-8 py-6">
                                    <CardTitle className="text-lg font-black uppercase tracking-tighter">Bulk Email Import</CardTitle>
                                    <CardDescription className="text-xs font-bold uppercase tracking-widest">Paste a list of student emails below</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-100 dark:border-blue-800 flex gap-3">
                                        <InfoIcon className="size-5 text-blue-600 shrink-0" />
                                        <p className="text-xs font-medium text-blue-800 dark:text-blue-300 leading-relaxed">
                                            Enter emails separated by commas, spaces, or new lines. The system will automatically match them to existing student accounts and add them to the selection.
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email List</Label>
                                        <textarea
                                            value={data.emails}
                                            onChange={(e) => setData('emails', e.target.value)}
                                            placeholder="student1@example.com, student2@example.com..."
                                            className="min-h-[250px] w-full rounded-2xl border-2 border-slate-100 dark:border-slate-800 p-6 text-sm font-medium focus:border-indigo-500 focus:ring-0 transition-all bg-slate-50/50 dark:bg-slate-900/50"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Floating Bottom Action Bar */}
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-50">
                        <div className="bg-white dark:bg-slate-900 border shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-6 backdrop-blur-md bg-opacity-90">
                            <div className="flex items-center gap-3 pl-2">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                                    <UserPlusIcon className="size-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-black tracking-tight">{(Array.isArray(data.student_ids) ? data.student_ids : []).length} Selected</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Students to be assigned</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    type="button"
                                    asChild
                                    className="font-bold text-xs uppercase tracking-widest"
                                >
                                    <Link href={`/exams/${exam.id}`}>Cancel</Link>
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing || !hasChanges}
                                    className="px-8 font-black uppercase tracking-widest text-xs h-11 shadow-lg shadow-indigo-500/25 bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {processing ? 'Processing...' : 'Save Assignments'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
