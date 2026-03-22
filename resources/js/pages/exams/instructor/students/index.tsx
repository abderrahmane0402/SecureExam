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
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem, User } from '@/types';

interface Props {
    students: User[];
    groups: string[];
}

export default function StudentsIndex({ students, groups }: Props) {
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
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Students', href: '/students' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Student Management" />
            
            <div className="flex flex-col gap-8 p-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col gap-4 rounded-2xl bg-slate-900 p-8 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight uppercase italic text-blue-400 mb-1">
                            Student Directory
                        </h1>
                        <p className="text-sm font-bold text-slate-400">
                            Manage your students, groups, and bulk imports.
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                        <label className="cursor-pointer inline-flex items-center justify-center rounded-xl bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-white/20 transition-all border border-white/10">
                            <UploadIcon className="mr-2 size-4" />
                            Import CSV
                            <input 
                                type="file" 
                                className="hidden" 
                                accept=".csv,.txt"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const formData = new FormData();
                                        formData.append('file', file);
                                        // We use router.post directly for simple file upload without full useForm state if preferred
                                        router.post('/students/import', formData as any);
                                    }
                                }}
                            />
                        </label>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:max-w-md">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 h-11 border-slate-200 rounded-xl bg-white shadow-sm focus-visible:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border w-full md:w-auto overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => setSelectedGroup('all')}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                    selectedGroup === 'all' ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                All Groups
                            </button>
                            {groups.map(group => (
                                <button
                                    key={group}
                                    onClick={() => setSelectedGroup(group)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                        selectedGroup === group ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    {group}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Students Table/Grid */}
                <Card className="rounded-2xl overflow-hidden border-none shadow-xl">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b px-8 py-6">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-black uppercase tracking-tighter">Registered Students</CardTitle>
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-black text-[10px]">
                                {filteredStudents.length} Active
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {filteredStudents.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredStudents.map((student) => (
                                    <div
                                        key={student.id}
                                        className="group flex items-center justify-between gap-4 px-8 py-5 transition-all hover:bg-slate-50/50"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-transparent group-hover:border-blue-500 group-hover:bg-blue-50 transition-all duration-300">
                                                <span className="text-lg font-black text-slate-400 group-hover:text-blue-600">
                                                    {student.name.charAt(0)}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">
                                                    {student.name}
                                                </p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    {student.email}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-12">
                                            <div className="text-right min-w-[120px]">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                                    Group / Class
                                                </p>
                                                {student.group ? (
                                                    <Badge variant="outline" className="font-black text-[9px] uppercase border-blue-200 text-blue-600 bg-blue-50/30">
                                                        {student.group}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase">None</span>
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
                                <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
                                    <UsersIcon className="size-10 text-slate-300" />
                                </div>
                                <p className="text-xl font-black text-slate-400 uppercase tracking-tighter">No students found</p>
                                <p className="text-sm font-bold text-slate-400/60 mt-1 uppercase tracking-widest italic">Try adjusting your search or filters</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* CSV Template Info */}
                <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 flex flex-col md:flex-row items-center gap-6 bg-slate-50/30">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border shadow-sm">
                        <FileSpreadsheetIcon className="size-7 text-emerald-500" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="font-black uppercase tracking-tight text-slate-900 dark:text-white">CSV Import Guide</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">
                            Your CSV should have 3 columns: <span className="font-bold text-slate-700">name</span>, <span className="font-bold text-slate-700">email</span>, and <span className="font-bold text-slate-700">group</span>.
                        </p>
                    </div>
                    <Button variant="outline" className="font-black text-[10px] uppercase tracking-widest rounded-xl border-2 px-6 h-11" onClick={() => {
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
