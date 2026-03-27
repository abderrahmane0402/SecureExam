import { Head, Link } from '@inertiajs/react';
import { TrophyIcon, CalendarIcon, EyeIcon, ArrowLeftIcon, SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/hooks/use-language';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

interface PublishedAttempt {
    id: number;
    score: number;
    percentage: number;
    published_at: string;
    exam: {
        id: number;
        title: string;
        total_points: number;
        passing_score: number;
    };
}

interface Props {
    attempts: PublishedAttempt[];
}

export default function MyResults({ attempts = [] }: Props) {
    const { t } = useLanguage();
    const [search, setSearch] = useState('');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('common.dashboard'), href: '/dashboard' },
        { title: t('student.exams.title'), href: '/student/exams' },
        { title: t('student.results.title'), href: '/student/results' },
    ];

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

    const filteredAttempts = attempts.filter(a => 
        a.exam.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('student.results.title')} />
            
            <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Button variant="ghost" size="icon" asChild className="rounded-full -ml-2">
                                <Link href="/student/exams">
                                    <ArrowLeftIcon className="size-5" />
                                </Link>
                            </Button>
                            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 uppercase">
                                {t('student.results.title')}
                            </h1>
                        </div>
                        <p className="text-muted-foreground font-medium ml-10">
                            {t('student.results.subtitle')}
                        </p>
                    </div>
                    
                    <div className="relative w-64">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input 
                            placeholder={t('common.search')} 
                            className="pl-9 bg-white/50 backdrop-blur-sm border-slate-200 rounded-xl font-medium"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid gap-4">
                    {filteredAttempts.length > 0 ? (
                        filteredAttempts.map((attempt) => {
                            const passed = attempt.percentage >= (attempt.exam.passing_score ?? 0);
                            
                            return (
                                <Card key={attempt.id} className="group overflow-hidden border-slate-200 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
                                    <CardContent className="p-0">
                                        <div className="flex items-center p-6 gap-6">
                                            {/* Score Circle */}
                                            <div className={cn(
                                                "size-20 rounded-2xl flex flex-col items-center justify-center shrink-0 border-2 transition-transform group-hover:scale-110 duration-500",
                                                passed ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-rose-50 border-rose-200 text-rose-600"
                                            )}>
                                                <span className="text-2xl font-black leading-none">{Math.round(attempt.percentage)}</span>
                                                <span className="text-[10px] font-black uppercase opacity-70">%</span>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-50 truncate">
                                                        {attempt.exam.title}
                                                    </h3>
                                                    <Badge variant={passed ? "default" : "destructive"} className={cn(
                                                        "uppercase text-[9px] font-black px-1.5 h-4 tracking-tighter",
                                                        passed ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30" : "bg-rose-500/20 text-rose-600 border-rose-500/30"
                                                    )}>
                                                        {passed ? 'PASSED' : 'FAILED'}
                                                    </Badge>
                                                </div>
                                                
                                                <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                    <div className="flex items-center gap-1.5">
                                                        <TrophyIcon className="size-3.5" />
                                                        {attempt.score} / {attempt.exam.total_points} {t('exam.points')}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 border-l pl-4">
                                                        <CalendarIcon className="size-3.5" />
                                                        {formatDate(attempt.published_at)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <Button asChild className="rounded-xl font-black uppercase tracking-widest text-[10px] px-6 h-12 bg-slate-900 hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-500/20">
                                                <Link href={`/student/exams/${attempt.exam.id}/attempts/${attempt.id}`}>
                                                    <EyeIcon className="mr-2 size-4" />
                                                    {t('student.results.viewDetail')}
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    ) : (
                        <Card className="border-dashed border-2 bg-slate-50/50">
                            <CardContent className="py-20 text-center">
                                <TrophyIcon className="size-16 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-500 font-black uppercase tracking-widest">
                                    {search ? t('common.noResults') : t('student.results.none')}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
