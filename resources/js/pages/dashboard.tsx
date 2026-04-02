import { Head, Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Users,
    Clock,
    GraduationCap,
    PlusCircle,
    Play,
    BarChart3,
    ArrowRight,
    Shield,
    AlertTriangle,
    Lightbulb,
    Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguageStandalone  } from '@/hooks/use-language';
import type {TranslationKey} from '@/hooks/use-language';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, User } from '@/types';

type TFunction = (key: TranslationKey) => string;

export default function Dashboard() {
    const { auth } = usePage<{ auth: { user: User } }>().props;
    const isInstructor = auth.user.role === 'instructor';
    const { t } = useLanguageStandalone();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('common.dashboard'), href: '/dashboard' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('common.dashboard')} />
            <div className="flex h-full w-full flex-1 flex-col gap-6 p-4 sm:p-6">
                {/* Welcome Section */}
                <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-5 sm:p-6 text-primary-foreground shadow-lg">
                    <h1 className="text-xl sm:text-2xl font-bold break-words">
                        {t('dashboard.welcome')}, {auth.user.name}!
                    </h1>
                    <p className="mt-1 opacity-90">
                        {isInstructor
                            ? t('dashboard.instructor.subtitle')
                            : t('dashboard.student.subtitle')}
                    </p>
                </div>

                {isInstructor ? <InstructorDashboard t={t} /> : <StudentDashboard t={t} />}
            </div>
        </AppLayout>
    );
}

function InstructorDashboard({ t }: { t: TFunction }) {
    return (
        <>
            {/* Quick Actions - Fixed height cards */}
            <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/exams/create" className="group min-w-0 overflow-hidden">
                    <Card className="h-full min-h-[140px] cursor-pointer border-2 border-border transition-all hover:border-primary/30 hover:shadow-lg">
                        <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
                            <div className="mb-3 rounded-full bg-primary/10 p-3 transition-transform group-hover:scale-110">
                                <PlusCircle className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="text-base font-black uppercase tracking-tight">
                                {t('dashboard.createExam')}
                            </CardTitle>
                            <CardDescription className="mt-1 text-xs font-bold">
                                {t('dashboard.createExam.desc')}
                            </CardDescription>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/exams" className="group min-w-0 overflow-hidden">
                    <Card className="h-full min-h-[140px] cursor-pointer border-2 border-border transition-all hover:border-amber-500/30 hover:shadow-lg">
                        <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
                            <div className="mb-3 rounded-full bg-emerald-500/10 p-3 transition-transform group-hover:scale-110">
                                <BookOpen className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <CardTitle className="text-base font-black uppercase tracking-tight">
                                {t('dashboard.myExams')}
                            </CardTitle>
                            <CardDescription className="mt-1 text-xs font-bold">
                                {t('dashboard.myExams.desc')}
                            </CardDescription>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/exams" className="group min-w-0 overflow-hidden">
                    <Card className="h-full min-h-[140px] cursor-pointer border-2 border-border transition-all hover:border-primary/30 hover:shadow-lg">
                        <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
                            <div className="mb-3 rounded-full bg-primary/10 p-3 transition-transform group-hover:scale-110">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="text-base font-black uppercase tracking-tight">{t('dashboard.monitor')}</CardTitle>
                            <CardDescription className="mt-1 text-xs font-bold">
                                {t('dashboard.monitor.desc')}
                            </CardDescription>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/exams" className="group min-w-0 overflow-hidden">
                    <Card className="h-full min-h-[140px] cursor-pointer border-2 border-border transition-all hover:border-amber-500/30 hover:shadow-lg">
                        <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
                            <div className="mb-3 rounded-full bg-amber-500/10 p-3 transition-transform group-hover:scale-110">
                                <BarChart3 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <CardTitle className="text-base font-black uppercase tracking-tight">{t('dashboard.grading')}</CardTitle>
                            <CardDescription className="mt-1 text-xs font-bold">
                                {t('dashboard.grading.desc')}
                            </CardDescription>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Main Content */}
            <div className="grid w-full gap-6 lg:grid-cols-2">
                <Card className="flex min-w-0 flex-col overflow-hidden">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <div className="rounded-lg bg-primary/10 p-2">
                                <Clock className="h-4 w-4 text-primary" />
                            </div>
                            {t('dashboard.gettingStarted')}
                        </CardTitle>
                        <CardDescription>
                            {t('dashboard.gettingStarted.desc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="space-y-4">
                            {[
                                {
                                    step: 1,
                                    title: t('dashboard.step1.title'),
                                    desc: t('dashboard.step1.desc'),
                                },
                                {
                                    step: 2,
                                    title: t('dashboard.step2.title'),
                                    desc: t('dashboard.step2.desc'),
                                },
                                {
                                    step: 3,
                                    title: t('dashboard.step3.title'),
                                    desc: t('dashboard.step3.desc'),
                                },
                                {
                                    step: 4,
                                    title: t('dashboard.step4.title'),
                                    desc: t('dashboard.step4.desc'),
                                },
                            ].map((item) => (
                                <div
                                    key={item.step}
                                    className="flex items-start gap-3"
                                >
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
                                        {item.step}
                                    </div>
                                    <div className="flex-1">
                                        <p className="leading-tight font-medium">
                                            {item.title}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <div className="p-6 pt-0">
                        <Button asChild className="w-full">
                            <Link href="/exams/create">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                {t('dashboard.createFirst')}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </Card>

                <Card className="flex min-w-0 flex-col overflow-hidden">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <div className="rounded-lg bg-emerald-500/10 p-2">
                                <Lightbulb className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            {t('dashboard.quickTips')}
                        </CardTitle>
                        <CardDescription>
                            {t('dashboard.quickTips.desc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ScrollArea className="h-[200px] pr-4">
                            <div className="space-y-3">
                                {[
                                    { icon: '🔀', text: t('dashboard.tip1') },
                                    { icon: '⏱️', text: t('dashboard.tip2') },
                                    { icon: '🖥️', text: t('dashboard.tip3') },
                                    { icon: '✅', text: t('dashboard.tip4') },
                                    { icon: '👁️', text: t('dashboard.tip5') },
                                    { icon: '📝', text: t('dashboard.tip6') },
                                ].map((tip, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-3 rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
                                    >
                                        <span className="text-lg">
                                            {tip.icon}
                                        </span>
                                        <p className="text-sm">{tip.text}</p>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

function StudentDashboard({ t }: { t: TFunction }) {
    return (
        <>
            {/* Quick Actions - Fixed height cards */}
            <div className="grid w-full gap-4 sm:grid-cols-3">
                <Link href="/student/exams" className="group min-w-0 overflow-hidden">
                    <Card className="h-full min-h-[140px] cursor-pointer border-2 border-border transition-all hover:border-amber-500/30 hover:shadow-lg">
                        <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
                            <div className="mb-3 rounded-full bg-emerald-500/10 p-3 transition-transform group-hover:scale-110">
                                <Play className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <CardTitle className="text-base font-black uppercase tracking-tight">
                                {t('dashboard.availableExams')}
                            </CardTitle>
                            <CardDescription className="mt-1 text-xs font-bold">
                                {t('dashboard.availableExams.desc')}
                            </CardDescription>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/student/exams" className="group min-w-0 overflow-hidden">
                    <Card className="h-full min-h-[140px] cursor-pointer border-2 border-border transition-all hover:border-primary/30 hover:shadow-lg">
                        <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
                            <div className="mb-3 rounded-full bg-primary/10 p-3 transition-transform group-hover:scale-110">
                                <Clock className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="text-base font-black uppercase tracking-tight">
                                {t('dashboard.inProgress')}
                            </CardTitle>
                            <CardDescription className="mt-1 text-xs font-bold">
                                {t('dashboard.inProgress.desc')}
                            </CardDescription>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/student/results" className="group min-w-0 overflow-hidden">
                    <Card className="h-full min-h-[140px] cursor-pointer border-2 border-border transition-all hover:border-primary/30 hover:shadow-lg">
                        <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
                            <div className="mb-3 rounded-full bg-primary/10 p-3 transition-transform group-hover:scale-110">
                                <Trophy className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="text-base font-black uppercase tracking-tight">{t('dashboard.results')}</CardTitle>
                            <CardDescription className="mt-1 text-xs font-bold">
                                {t('dashboard.results.desc')}
                            </CardDescription>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Info Cards */}
            <div className="grid w-full gap-6 lg:grid-cols-2">
                <Card className="flex min-w-0 flex-col overflow-hidden">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <div className="rounded-lg bg-primary/10 p-2">
                                <GraduationCap className="h-4 w-4 text-primary" />
                            </div>
                            {t('dashboard.howToTake')}
                        </CardTitle>
                        <CardDescription>
                            {t('dashboard.howToTake.desc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="space-y-4">
                            {[
                                {
                                    step: 1,
                                    title: t('dashboard.studentStep1.title'),
                                    desc: t('dashboard.studentStep1.desc'),
                                },
                                {
                                    step: 2,
                                    title: t('dashboard.studentStep2.title'),
                                    desc: t('dashboard.studentStep2.desc'),
                                },
                                {
                                    step: 3,
                                    title: t('dashboard.studentStep3.title'),
                                    desc: t('dashboard.studentStep3.desc'),
                                },
                                {
                                    step: 4,
                                    title: t('dashboard.studentStep4.title'),
                                    desc: t('dashboard.studentStep4.desc'),
                                },
                            ].map((item) => (
                                <div
                                    key={item.step}
                                    className="flex items-start gap-3"
                                >
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
                                        {item.step}
                                    </div>
                                    <div className="flex-1">
                                        <p className="leading-tight font-medium">
                                            {item.title}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <div className="p-6 pt-0">
                        <Button asChild className="w-full">
                            <Link href="/student/exams">
                                <Play className="mr-2 h-4 w-4" />
                                {t('dashboard.viewAvailable')}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </Card>

                <Card className="flex min-w-0 flex-col overflow-hidden border-amber-500/20">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                            <div className="rounded-lg bg-amber-500/10 p-2">
                                <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            {t('dashboard.importantRules')}
                        </CardTitle>
                        <CardDescription>
                            {t('dashboard.importantRules.desc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ScrollArea className="h-[200px] pr-4">
                            <div className="space-y-3">
                                {[
                                    { icon: '🖥️', text: t('dashboard.rule1') },
                                    { icon: '🚫', text: t('dashboard.rule2') },
                                    { icon: '📋', text: t('dashboard.rule3') },
                                    { icon: '🖱️', text: t('dashboard.rule4') },
                                    { icon: '📊', text: t('dashboard.rule5') },
                                    { icon: '⏰', text: t('dashboard.rule6') },
                                ].map((rule, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-3 rounded-lg bg-amber-500/5 p-3 transition-colors hover:bg-amber-500/10"
                                    >
                                        <span className="text-lg">
                                            {rule.icon}
                                        </span>
                                        <p className="text-sm font-medium">{rule.text}</p>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <div className="p-6 pt-0">
                        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-3">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                            <p className="text-sm font-black uppercase tracking-tight text-amber-700 dark:text-amber-300">
                                {t('dashboard.violationWarning')}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </>
    );
}
