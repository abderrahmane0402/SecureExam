import { Head, Link, router } from '@inertiajs/react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    UsersIcon,
    MonitorIcon,
    EyeIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Exam } from '@/types';

interface Props {
    exams: {
        data: (Exam & {
            questions_count: number;
            assignments_count: number;
            attempts_count: number;
        })[];
        links: unknown[];
        meta: unknown;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Exams', href: '/exams' },
];

export default function ExamIndex({ exams }: Props) {
    const handleDelete = (examId: number) => {
        if (confirm('Are you sure you want to delete this exam?')) {
            router.delete(`/exams/${examId}`);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Exams" />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                    <div>
                        <h1 className="text-2xl font-bold">Exams</h1>
                        <p className="mt-1 opacity-90">
                            Create and manage your exams
                        </p>
                    </div>
                    <Button
                        asChild
                        variant="secondary"
                        className="bg-white/20 text-white hover:bg-white/30"
                    >
                        <Link href="/exams/create">
                            <PlusIcon className="size-4" />
                            Create Exam
                        </Link>
                    </Button>
                </div>

                {exams.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <p className="mb-4 text-muted-foreground">
                                No exams created yet
                            </p>
                            <Button asChild>
                                <Link href="/exams/create">
                                    <PlusIcon className="size-4" />
                                    Create Your First Exam
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {exams.data.map((exam) => (
                            <Card
                                key={exam.id}
                                className="flex h-full min-h-[320px] flex-col"
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <CardTitle className="truncate text-lg">
                                                {exam.title}
                                            </CardTitle>
                                            <CardDescription className="mt-1 line-clamp-2 h-10">
                                                {exam.description ||
                                                    'No description'}
                                            </CardDescription>
                                        </div>
                                        <Badge
                                            variant={
                                                exam.is_published
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                            className="shrink-0"
                                        >
                                            {exam.is_published
                                                ? 'Published'
                                                : 'Draft'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-1 flex-col">
                                    <div className="flex-1 space-y-3">
                                        <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3 text-sm">
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground">
                                                    Questions
                                                </p>
                                                <p className="text-lg font-semibold">
                                                    {exam.questions_count}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground">
                                                    Students
                                                </p>
                                                <p className="text-lg font-semibold">
                                                    {exam.assignments_count}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground">
                                                    Attempts
                                                </p>
                                                <p className="text-lg font-semibold">
                                                    {exam.attempts_count}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            <p>
                                                <span className="font-medium text-foreground">
                                                    Duration:
                                                </span>{' '}
                                                {exam.duration_minutes} min
                                            </p>
                                            <p>
                                                <span className="font-medium text-foreground">
                                                    Start:
                                                </span>{' '}
                                                {formatDate(exam.start_time)}
                                            </p>
                                            <p>
                                                <span className="font-medium text-foreground">
                                                    End:
                                                </span>{' '}
                                                {formatDate(exam.end_time)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <Link href={`/exams/${exam.id}`}>
                                                <EyeIcon className="size-4" />
                                                View
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <Link
                                                href={`/exams/${exam.id}/edit`}
                                            >
                                                <PencilIcon className="size-4" />
                                                Edit
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <Link
                                                href={`/exams/${exam.id}/assign`}
                                            >
                                                <UsersIcon className="size-4" />
                                                Assign
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <Link
                                                href={`/exams/${exam.id}/monitor`}
                                            >
                                                <MonitorIcon className="size-4" />
                                                Monitor
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() =>
                                                handleDelete(exam.id)
                                            }
                                        >
                                            <TrashIcon className="size-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
