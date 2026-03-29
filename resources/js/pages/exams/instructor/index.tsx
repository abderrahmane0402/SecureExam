import { Head, Link, router } from '@inertiajs/react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    UsersIcon,
    MonitorIcon,
    EyeIcon,
    FileIcon,
    ActivityIcon,
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
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 dark:from-primary/20 dark:via-primary/10 dark:to-background p-8 text-white shadow-2xl shadow-blue-500/10 border border-white/10 relative overflow-hidden">
                    <div className="relative z-10">
                        <h1 className="text-3xl font-black tracking-tight">{t('exams.title')}</h1>
                        <p className="mt-1.5 text-blue-100/80 font-medium italic">{t('exams.subtitle')}</p>
                    </div>
                    <div className="relative z-10 flex shrink-0 gap-3">
                        <Button
                            asChild
                            variant="secondary"
                            className="bg-white/20 text-white hover:bg-white/30 border-white/20 backdrop-blur-md font-bold"
                        >
                            <Link href="/exams/create">
                                <PlusIcon className="size-4 mr-2" />
                                {t('exams.create')}
                            </Link>
                        </Button>
                    </div>
                    <div className="absolute top-0 right-0 size-64 bg-white/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                </div>

                <div className="relative group max-w-2xl mx-auto w-full transition-all duration-300">
                    <SearchIcon className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors" />
                    <Input
                        placeholder={t('exams.search.placeholder')}
                        className="pl-12 h-14 rounded-xl border-border bg-card shadow-lg focus-visible:ring-primary text-foreground transition-all font-medium text-lg"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {filteredExams.length === 0 ? (
                    <Card className="rounded-3xl border border-border shadow-xl overflow-hidden bg-card/40 backdrop-blur-md">
                        <CardContent className="flex flex-col items-center justify-center py-24">
                            <div className="mx-auto flex size-24 items-center justify-center rounded-2xl bg-muted shadow-2xl ring-1 ring-border transition-transform group-hover:scale-110 duration-500 mb-6">
                                <SearchIcon className="size-10 text-muted-foreground opacity-20" />
                            </div>
                            <p className="mb-4 text-muted-foreground font-black uppercase tracking-widest text-sm italic text-center">
                                {searchQuery
                                    ? t('common.noResults')
                                    : t('exams.empty')}
                            </p>
                            {!searchQuery && (
                                <Button asChild className="rounded-xl h-12 px-10 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95">
                                    <Link href="/exams/create">
                                        <PlusIcon className="size-4 mr-2" />
                                        {t('exams.createFirst')}
                                    </Link>
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredExams.map((exam) => {
                            const live = isExamLive(exam);
                            return (
                                 <Card
                                    key={exam.id}
                                    className={cn(
                                        'flex h-full min-h-[340px] flex-col transition-all duration-500 rounded-3xl border border-border group bg-card/40 backdrop-blur-md hover:shadow-2xl hover:border-primary/50 hover:-translate-y-2',
                                        live &&
                                        'ring-4 ring-emerald-500/20 border-emerald-500/50 shadow-emerald-500/10',
                                    )}
                                >
                                    <CardHeader className="pb-3 px-8 pt-8">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <CardTitle className="truncate text-xl font-black tracking-tight text-foreground uppercase">
                                                    {exam.title}
                                                </CardTitle>
                                                <CardDescription className="mt-1 line-clamp-2 h-10 text-muted-foreground italic font-medium text-xs leading-relaxed">
                                                    {exam.description ||
                                                        t('exams.noDescription')}
                                                </CardDescription>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
                                                {live && (
                                                    <Badge className="bg-emerald-500 hover:bg-emerald-600 font-bold px-2 sm:px-3">
                                                        <ActivityIcon className="size-3 sm:mr-1.5" />
                                                        <span className="hidden sm:inline">{t('exams.status.live')}</span>
                                                    </Badge>
                                                )}
                                                <Badge
                                                    variant={
                                                        exam.is_published
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                    className={cn("shrink-0 font-bold px-2 sm:px-3", !exam.is_published && "bg-muted text-muted-foreground")}
                                                >
                                                    {exam.is_published ? (
                                                        <>
                                                            <EyeIcon className="size-3 sm:mr-1.5" />
                                                            <span className="hidden sm:inline">{t('exams.status.published')}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FileIcon className="size-3 sm:mr-1.5" />
                                                            <span className="hidden sm:inline">{t('exams.status.draft')}</span>
                                                        </>
                                                    )}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex flex-1 flex-col pt-0 px-8 pb-8">
                                        <div className="flex-1 space-y-4">
                                             <div className="grid grid-cols-3 gap-2 rounded-2xl bg-muted/50 p-5 border border-border transition-all group-hover:bg-primary/[0.05] group-hover:border-primary/20 shadow-inner">
                                                <div className="text-center">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">
                                                        {t('exams.questions')}
                                                    </p>
                                                    <p className="text-2xl font-black text-foreground tabular-nums tracking-tighter italic">
                                                        {exam.questions_count}
                                                    </p>
                                                </div>
                                                <div className="text-center border-x border-border">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">
                                                        {t('exams.students')}
                                                    </p>
                                                    <p className="text-2xl font-black text-foreground tabular-nums tracking-tighter italic">
                                                        {exam.assignments_count}
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">
                                                        {t('exams.attempts')}
                                                    </p>
                                                    <p className="text-2xl font-black text-foreground tabular-nums tracking-tighter italic">
                                                        {exam.attempts_count}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-2 py-2 px-1">
                                                <div className="flex items-center justify-between text-[10px] font-bold">
                                                    <span className="text-muted-foreground uppercase tracking-widest">{t('exams.duration')}</span>
                                                    <span className="text-foreground tabular-nums bg-muted/50 px-2 py-0.5 rounded-lg">{exam.duration_minutes} min</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] font-bold">
                                                    <span className="text-muted-foreground uppercase tracking-widest">{t('exams.start')}</span>
                                                    <span className="text-foreground tabular-nums bg-muted/50 px-2 py-0.5 rounded-lg">{formatDate(exam.start_time)}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] font-bold">
                                                    <span className="text-muted-foreground uppercase tracking-widest">{t('exams.end')}</span>
                                                    <span className="text-foreground tabular-nums bg-muted/50 px-2 py-0.5 rounded-lg">{formatDate(exam.end_time)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex items-center justify-between border-t border-border pt-6">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 font-black uppercase tracking-widest text-[10px] h-10 rounded-xl border-border hover:bg-accent transition-all shadow-sm"
                                                asChild
                                            >
                                                <Link
                                                    href={`/exams/${exam.id}`}
                                                >
                                                    <EyeIcon className="mr-2 size-4 text-primary" />
                                                    {t('exams.card.view')}
                                                </Link>
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="ml-3 h-10 w-10 rounded-xl hover:bg-accent transition-colors"
                                                    >
                                                        <MoreVerticalIcon className="size-5 text-muted-foreground" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-border bg-popover">
                                                    <DropdownMenuItem asChild className="rounded-xl font-bold py-2.5 focus:bg-accent">
                                                        <Link
                                                            href={`/exams/${exam.id}/edit`}
                                                        >
                                                            <PencilIcon className="mr-2 size-4" />
                                                            {t(
                                                                'exams.card.edit',
                                                            )}
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild className="rounded-xl font-bold py-2.5 focus:bg-accent">
                                                        <Link
                                                            href={`/exams/${exam.id}/assign`}
                                                        >
                                                            <UsersIcon className="mr-2 size-4" />
                                                            {t(
                                                                'exams.card.assign',
                                                            )}
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild className="rounded-xl font-bold py-2.5 focus:bg-accent">
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
                                                        className="rounded-xl font-bold py-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive"
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
