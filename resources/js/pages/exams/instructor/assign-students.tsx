import { Head, useForm, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { SearchIcon, CheckIcon, XIcon } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem, Exam, User } from '@/types';

interface Props {
    exam: Exam & { assigned_students: User[] };
    students: User[];
}

export default function AssignStudents({ exam, students }: Props) {
    const [search, setSearch] = useState('');
    const assignedIds = new Set(exam.assigned_students?.map((s) => s.id) || []);

    const form = useForm({
        student_ids: Array.from(assignedIds) as number[],
    });

    const filteredStudents = useMemo(() => {
        if (!search) return students;
        const lower = search.toLowerCase();
        return students.filter(
            (s) =>
                s.name.toLowerCase().includes(lower) ||
                s.email.toLowerCase().includes(lower),
        );
    }, [students, search]);

    const toggleStudent = (studentId: number) => {
        const current = new Set(form.data.student_ids);
        if (current.has(studentId)) {
            current.delete(studentId);
        } else {
            current.add(studentId);
        }
        form.setData('student_ids', Array.from(current));
    };

    const selectAll = () => {
        const allIds = filteredStudents.map((s) => s.id);
        const current = new Set(form.data.student_ids);
        allIds.forEach((id) => current.add(id));
        form.setData('student_ids', Array.from(current));
    };

    const deselectAll = () => {
        const filteredIds = new Set(filteredStudents.map((s) => s.id));
        const remaining = form.data.student_ids.filter(
            (id) => !filteredIds.has(id),
        );
        form.setData('student_ids', remaining);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/exams/${exam.id}/assign`);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Exams', href: '/exams' },
        { title: exam.title, href: `/exams/${exam.id}` },
        { title: 'Assign Students', href: `/exams/${exam.id}/assign` },
    ];

    const selectedCount = form.data.student_ids.length;
    const originalCount = assignedIds.size;
    const hasChanges =
        selectedCount !== originalCount ||
        form.data.student_ids.some((id) => !assignedIds.has(id));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Assign Students - ${exam.title}`} />
            <div className="flex flex-col gap-6 p-6">
                <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                    <h1 className="text-2xl font-bold">Assign Students</h1>
                    <p className="mt-1 opacity-90">
                        Select which students should have access to "
                        {exam.title}"
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle>Students</CardTitle>
                                    <CardDescription>
                                        {selectedCount} of {students.length}{' '}
                                        selected
                                        {hasChanges && (
                                            <Badge
                                                variant="outline"
                                                className="ml-2"
                                            >
                                                Unsaved changes
                                            </Badge>
                                        )}
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={selectAll}
                                    >
                                        <CheckIcon className="size-4" />
                                        Select All
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={deselectAll}
                                    >
                                        <XIcon className="size-4" />
                                        Deselect All
                                    </Button>
                                </div>
                            </div>
                            <div className="relative mt-2">
                                <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search students by name or email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-[400px] space-y-1 overflow-y-auto">
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map((student) => {
                                        const isSelected =
                                            form.data.student_ids.includes(
                                                student.id,
                                            );
                                        const wasAssigned = assignedIds.has(
                                            student.id,
                                        );

                                        return (
                                            <div
                                                key={student.id}
                                                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                                                    isSelected
                                                        ? 'border-primary bg-primary/5'
                                                        : 'hover:bg-muted/50'
                                                }`}
                                                onClick={() =>
                                                    toggleStudent(student.id)
                                                }
                                            >
                                                <div
                                                    className={cn(
                                                        'flex size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs',
                                                        isSelected
                                                            ? 'border-primary bg-primary text-primary-foreground'
                                                            : 'border-input bg-background',
                                                    )}
                                                >
                                                    {isSelected && (
                                                        <CheckIcon className="size-3" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium">
                                                        {student.name}
                                                    </p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {student.email}
                                                    </p>
                                                </div>
                                                {wasAssigned && !isSelected && (
                                                    <Badge
                                                        variant="destructive"
                                                        className="text-xs"
                                                    >
                                                        Will remove
                                                    </Badge>
                                                )}
                                                {!wasAssigned && isSelected && (
                                                    <Badge
                                                        variant="default"
                                                        className="text-xs"
                                                    >
                                                        New
                                                    </Badge>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="py-8 text-center text-muted-foreground">
                                        {search
                                            ? 'No students match your search'
                                            : 'No students available'}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mt-4 flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(`/exams/${exam.id}`)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={form.processing || !hasChanges}
                        >
                            Save Assignments
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
