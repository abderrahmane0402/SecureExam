import { Head, router } from '@inertiajs/react';
import { 
    UsersIcon, 
    UploadIcon, 
    TrashIcon, 
    SearchIcon, 
    FileSpreadsheetIcon,
    MoreVerticalIcon,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useLanguageStandalone } from '@/hooks/use-language';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem, User } from '@/types';

interface Props {
    students: User[];
    groups: string[];
}

export default function StudentsIndex({ students, groups }: Props) {
    const { t } = useLanguageStandalone();
    const [search, setSearch] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<string | 'all'>('all');

    const filteredStudents = useMemo(() => {
        return students.filter((s) => {
            const matchesSearch = 
                s.name.toLowerCase().includes(search.toLowerCase()) ||
                s.email.toLowerCase().includes(search.toLowerCase());
            
            const matchesGroup = selectedGroup === 'all' || s.group === selectedGroup;
            
            return matchesSearch && matchesGroup;
        });
    }, [students, search, selectedGroup]);

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
            router.delete(`/students/${id}`);
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('common.dashboard'), href: '/dashboard' },
        { title: t('exams.students'), href: '/students' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('students.title')} />
            
            <div className="flex flex-col gap-8 p-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col gap-4 rounded-[2.5rem] bg-gradient-to-br from-indigo-700 via-blue-600 to-cyan-500 dark:from-primary/30 dark:via-primary/10 dark:to-background p-8 text-white shadow-2xl shadow-indigo-500/20 sm:flex-row sm:items-center sm:justify-between border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
                                <UsersIcon className="size-6 text-white" />
                            </div>
                            <h1 className="text-2xl font-black tracking-tight uppercase italic text-white drop-shadow-md">
                                {t('students.title')}
                            </h1>
                        </div>
                        <p className="text-blue-50 font-bold italic text-sm opacity-90 max-w-md">
                            {t('students.subtitle')}
                        </p>
                    </div>
                    
                    <div className="relative z-10 flex flex-wrap gap-3">
                        <label className="cursor-pointer inline-flex items-center justify-center rounded-2xl bg-white/10 px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/20 transition-all border border-white/20 shadow-xl backdrop-blur-md active:scale-95 group">
                            <UploadIcon className="mr-2 size-4 group-hover:scale-110 transition-transform" />
                            {t('students.import')}
                            <input 
                                type="file" 
                                className="hidden" 
                                accept=".csv,.txt"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const formData = new FormData();
                                        formData.append('file', file);
                                        router.post('/students/import', formData as any);
                                    }
                                }}
                            />
                        </label>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div className="relative w-full md:max-w-md group">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder={t('common.search')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-11 h-14 border-border/50 rounded-[1.5rem] bg-card/40 backdrop-blur-md shadow-lg focus-visible:ring-primary text-foreground transition-all font-bold italic"
                        />
                    </div>
 
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-card/80 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-slate-200/50 dark:border-border/50 w-full md:w-auto overflow-x-auto no-scrollbar shadow-lg">
                            <button
                                onClick={() => setSelectedGroup('all')}
                                className={cn(
                                    "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                    selectedGroup === 'all' 
                                        ? "bg-white dark:bg-primary shadow-lg text-primary dark:text-primary-foreground scale-105" 
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {t('common.allGroups')}
                            </button>
                            {groups.map(group => (
                                <button
                                    key={group}
                                    onClick={() => setSelectedGroup(group)}
                                    className={cn(
                                        "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                        selectedGroup === group 
                                            ? "bg-white dark:bg-primary shadow-lg text-primary dark:text-primary-foreground scale-105" 
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {group}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Students Table/Grid */}
                <Card className="rounded-[2.5rem] overflow-hidden border border-border/50 shadow-2xl bg-card/40 backdrop-blur-md transition-all pt-0 border-t-white/10 dark:border-t-white/5">
                    <CardHeader className="bg-primary/5 dark:bg-primary/10 border-b border-primary/10 px-8 py-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black uppercase tracking-tighter italic text-foreground">{t('students.registered')}</CardTitle>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">{t('students.registered.desc')}</p>
                            </div>
                            <Badge className="bg-primary dark:bg-primary text-primary-foreground border-none font-black text-[10px] px-4 py-1.5 rounded-xl uppercase tracking-widest shadow-xl shadow-primary/20">
                                {filteredStudents.length} {filteredStudents.length === 1 ? t('common.record') : t('common.records')}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {filteredStudents.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-border/50">
                                {filteredStudents.map((student) => (
                                    <div
                                        key={student.id}
                                        className="group flex items-center justify-between gap-4 px-8 py-6 transition-all hover:bg-slate-50/80 dark:hover:bg-card/40"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted dark:bg-muted border-2 border-slate-200 dark:border-border/50 group-hover:border-blue-500 dark:group-hover:border-blue-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 shadow-sm transition-all duration-300">
                                                <span className="text-xl font-black text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                    {student.name.charAt(0)}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-foreground text-lg tracking-tight leading-none mb-1">
                                                    {student.name}
                                                </p>
                                                <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-[0.2em]">
                                                    {student.email}
                                                </p>
                                            </div>
                                        </div>

                                         <div className="flex items-center gap-12">
                                            <div className="text-right min-w-[140px] hidden sm:block">
                                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">
                                                    Group Reference
                                                </p>
                                                {student.group ? (
                                                    <Badge variant="outline" className="font-black text-[9px] uppercase border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 px-3 py-1 rounded-lg">
                                                        {student.group}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-[10px] font-black text-slate-300 dark:text-muted-foreground uppercase italic">Unassigned</span>
                                                )}
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreVerticalIcon className="size-4 text-slate-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
                                                    <DropdownMenuItem 
                                                        className="text-rose-600 font-bold focus:text-rose-600 focus:bg-rose-50 rounded-lg cursor-pointer"
                                                        onClick={() => handleDelete(student.id)}
                                                    >
                                                        <TrashIcon className="mr-2 size-4" />
                                                        Delete Student
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-muted dark:bg-muted">
                                    <UsersIcon className="size-10 text-muted-foreground" />
                                </div>
                                <p className="text-xl font-black text-slate-400 uppercase tracking-tighter">No students found</p>
                                <p className="text-sm font-bold text-slate-400/60 mt-1 uppercase tracking-widest italic">Try adjusting your search or filters</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                 {/* CSV Template Info */}
                <div className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-border/50 p-8 flex flex-col md:flex-row items-center gap-8 bg-white/50 dark:bg-card/20 backdrop-blur-sm transition-all hover:bg-white/80 dark:hover:bg-card/40">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 shadow-sm shrink-0">
                        <FileSpreadsheetIcon className="size-8 text-emerald-500" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="font-black uppercase tracking-tight text-slate-900 dark:text-white text-lg">CSV Import Guide</h3>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 italic">
                            Your CSV must include 3 headers in the first row: <span className="text-slate-900 dark:text-white font-black not-italic underline decoration-emerald-500/30 decoration-2">name</span>, <span className="text-slate-900 dark:text-white font-black not-italic underline decoration-emerald-500/30 decoration-2">email</span>, and <span className="text-slate-900 dark:text-white font-black not-italic underline decoration-emerald-500/30 decoration-2">group</span>.
                        </p>
                    </div>
                    <Button variant="outline" className="font-black text-[10px] uppercase tracking-widest rounded-2xl border-2 px-8 h-12 shadow-sm hover:bg-white dark:hover:bg-muted transition-all active:scale-95" onClick={() => {
                        const csvContent = "data:text/csv;charset=utf-8,name,email,group\nJohn Doe,john@example.com,Class A\nJane Smith,jane@example.com,Class B";
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", "students_template.csv");
                        document.body.appendChild(link);
                        link.click();
                    }}>
                        Download Template
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
