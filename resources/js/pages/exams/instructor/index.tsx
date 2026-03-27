import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    UsersIcon,
    MonitorIcon,
    EyeIcon,
    SearchIcon,
    MoreVerticalIcon,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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

export default function ExamIndex({ exams }: Props) {
    const { t, language } = useLanguageStandalone();
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [examIdToDelete, setExamIdToDelete] = useState<number | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('common.dashboard'), href: '/dashboard' },
        { title: t('exams.title'), href: '/exams' },
    ];

    const handleDelete = (examId: number) => {
        setExamIdToDelete(examId);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (examIdToDelete) {
            router.delete(`/exams/${examIdToDelete}`, {
                onSuccess: () => {
                    setDeleteModalOpen(false);
                    setExamIdToDelete(null);
                },
            });
        }
    };

    const formatDate = (date: string) => {
        const locale = language === 'fr' ? 'fr-FR' : 'en-US';
        return new Date(date).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const filteredExams = useMemo(() => {
        if (!searchQuery.trim()) return exams.data;
        const query = searchQuery.toLowerCase();
        return exams.data.filter(
            (exam) =>
                exam.title.toLowerCase().includes(query) ||
                exam.description?.toLowerCase().includes(query),
        );
    }, [exams.data, searchQuery]);

    const isExamLive = (exam: Exam) => {
        if (!exam.is_published) return false;
        const now = new Date();
        const start = new Date(exam.start_time);
        const end = new Date(exam.end_time);
        return now >= start && now <= end;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('exams.title')} />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                    <div>
                        <h1 className="text-2xl font-bold">{t('exams.title')}</h1>
                        <p className="mt-1 opacity-90">{t('exams.subtitle')}</p>
                    </div>
                    <Button
                        asChild
                        variant="secondary"
                        className="bg-white/20 text-white hover:bg-white/30"
                    >
                        <Link href="/exams/create">
                            <PlusIcon className="size-4" />
                            {t('exams.create')}
                        </Link>
                    </Button>
                </div>

                <div className="relative">
                    <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={t('exams.search.placeholder')}
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {filteredExams.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <p className="mb-4 text-muted-foreground">
                                {searchQuery
                                    ? t('common.noResults')
                                    : t('exams.empty')}
                            </p>
                            {!searchQuery && (
                                <Button asChild>
                                    <Link href="/exams/create">
                                        <PlusIcon className="size-4" />
                                        {t('exams.createFirst')}
                                    </Link>
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredExams.map((exam) => {
                            const live = isExamLive(exam);
                            return (
                                <Card
                                    key={exam.id}
                                    className={cn(
                                        'flex h-full min-h-[320px] flex-col transition-all',
                                        live &&
                                            'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-neutral-950',
                                    )}
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
                                            <div className="flex flex-col items-end gap-1.5">
                                                {live && (
                                                    <Badge className="bg-emerald-500 hover:bg-emerald-600">
                                                        {t('exams.status.live')}
                                                    </Badge>
                                                )}
                                                <Badge
                                                    variant={
                                                        exam.is_published
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                    className="shrink-0"
                                                >
                                                    {exam.is_published
                                                        ? t(
                                                              'exams.status.published',
                                                          )
                                                        : t(
                                                              'exams.status.draft',
                                                          )}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex flex-1 flex-col">
                                        <div className="flex-1 space-y-3">
                                            <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3 text-sm">
                                                <div className="text-center">
                                                    <p className="text-xs text-muted-foreground">
                                                        {t('exams.questions')}
                                                    </p>
                                                    <p className="text-lg font-semibold">
                                                        {exam.questions_count}
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs text-muted-foreground">
                                                        {t('exams.students')}
                                                    </p>
                                                    <p className="text-lg font-semibold">
                                                        {exam.assignments_count}
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs text-muted-foreground">
                                                        {t('exams.attempts')}
                                                    </p>
                                                    <p className="text-lg font-semibold">
                                                        {exam.attempts_count}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-1 text-sm text-muted-foreground">
                                                <p>
                                                    <span className="font-medium text-foreground">
                                                        {t('exams.duration')}:
                                                    </span>{' '}
                                                    {exam.duration_minutes} min
                                                </p>
                                                <p>
                                                    <span className="font-medium text-foreground">
                                                        {t('exams.start')}:
                                                    </span>{' '}
                                                    {formatDate(exam.start_time)}
                                                </p>
                                                <p>
                                                    <span className="font-medium text-foreground">
                                                        {t('exams.end')}:
                                                    </span>{' '}
                                                    {formatDate(exam.end_time)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between border-t pt-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                asChild
                                            >
                                                <Link
                                                    href={`/exams/${exam.id}`}
                                                >
                                                    <EyeIcon className="mr-2 size-4" />
                                                    {t('exams.card.view')}
                                                </Link>
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="ml-2 h-8 w-8 p-0"
                                                    >
                                                        <MoreVerticalIcon className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link
                                                            href={`/exams/${exam.id}/edit`}
                                                        >
                                                            <PencilIcon className="mr-2 size-4" />
                                                            {t(
                                                                'exams.card.edit',
                                                            )}
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link
                                                            href={`/exams/${exam.id}/assign`}
                                                        >
                                                            <UsersIcon className="mr-2 size-4" />
                                                            {t(
                                                                'exams.card.assign',
                                                            )}
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link
                                                            href={`/exams/${exam.id}/monitor`}
                                                        >
                                                            <MonitorIcon className="mr-2 size-4" />
                                                            {t(
                                                                'exams.card.monitor',
                                                            )}
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onSelect={() =>
                                                            handleDelete(
                                                                exam.id,
                                                            )
                                                        }
                                                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                    >
                                                        <TrashIcon className="mr-2 size-4" />
                                                        {t('exams.card.delete')}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('exams.delete.title')}</DialogTitle>
                        <DialogDescription>
                            {t('exams.delete.description')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteModalOpen(false)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            {t('common.delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
