import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    BookOpen,
    Users,
    Clock,
    GraduationCap,
    PlusCircle,
    Play,
    CheckCircle,
    BarChart3,
    ArrowRight,
    Shield,
    AlertTriangle,
    Lightbulb,
} from 'lucide-react';
import type { BreadcrumbItem, User } from '@/types';
import { useLanguageStandalone, type TranslationKey } from '@/hooks/use-language';

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
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Welcome Section */}
                <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">
                    <h1 className="text-2xl font-bold">
                        {t('dashboard.welcome')}, {auth.user.name}!
                    </h1>
                    <p className="mt-1 text-blue-100">
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/exams/create" className="group">
                    <Card className="h-full min-h-[140px] cursor-pointer border-2 border-transparent transition-all hover:border-blue-200 hover:shadow-lg dark:hover:border-blue-900">
                        <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
                            <div className="mb-3 rounded-full bg-blue-100 p-3 transition-transform group-hover:scale-110 dark:bg-blue-900/50">
                                <PlusCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <CardTitle className="text-base">
                                {t('dashboard.createExam')}
                            </CardTitle>
                            <CardDescription className="mt-1 text-xs">
                                {t('dashboard.createExam.desc')}
                            </CardDescription>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/exams" className="group">
                    <Card className="h-full min-h-[140px] cursor-pointer border-2 border-transparent transition-all hover:border-green-200 hover:shadow-lg dark:hover:border-green-900">
                        <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
                            <div className="mb-3 rounded-full bg-green-100 p-3 transition-transform group-hover:scale-110 dark:bg-green-900/50">
                                <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <CardTitle className="text-base">
                                {t('dashboard.myExams')}
                            </CardTitle>
                            <CardDescription className="mt-1 text-xs">
                                {t('dashboard.myExams.desc')}
                            </CardDescription>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/exams" className="group">
                    <Card className="h-full min-h-[140px] cursor-pointer border-2 border-transparent transition-all hover:border-purple-200 hover:shadow-lg dark:hover:border-purple-900">
                        <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
                            <div className="mb-3 rounded-full bg-purple-100 p-3 transition-transform group-hover:scale-110 dark:bg-purple-900/50">
                                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <CardTitle className="text-base">{t('dashboard.monitor')}</CardTitle>
                            <CardDescription className="mt-1 text-xs">
                                {t('dashboard.monitor.desc')}
                            </CardDescription>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/exams" className="group">
                    <Card className="h-full min-h-[140px] cursor-pointer border-2 border-transparent transition-all hover:border-orange-200 hover:shadow-lg dark:hover:border-orange-900">
                        <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
                            <div className="mb-3 rounded-full bg-orange-100 p-3 transition-transform group-hover:scale-110 dark:bg-orange-900/50">
                                <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <CardTitle className="text-base">{t('dashboard.grading')}</CardTitle>
                            <CardDescription className="mt-1 text-xs">
                                {t('dashboard.grading.desc')}
                            </CardDescription>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Main Content */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="flex flex-col">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/50">
                                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-xs font-bold text-white shadow-sm">
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

                <Card className="flex flex-col">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/50">
                                <Lightbulb className="h-4 w-4 text-green-600 dark:text-green-400" />
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
            <div className="grid gap-4 sm:grid-cols-3">
                <Link href="/student/exams" className="group">
                    <Card className="h-full min-h-[140px] cursor-pointer border-2 border-transparent transition-all hover:border-green-200 hover:shadow-lg dark:hover:border-green-900">
                        <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
                            <div className="mb-3 rounded-full bg-green-100 p-3 transition-transform group-hover:scale-110 dark:bg-green-900/50">
                                <Play className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <CardTitle className="text-base">
                                {t('dashboard.availableExams')}
                            </CardTitle>
                            <CardDescription className="mt-1 text-xs">
                                {t('dashboard.availableExams.desc')}
                            </CardDescription>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/student/exams" className="group">
                    <Card className="h-full min-h-[140px] cursor-pointer border-2 border-transparent transition-all hover:border-blue-200 hover:shadow-lg dark:hover:border-blue-900">
                        <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
                            <div className="mb-3 rounded-full bg-blue-100 p-3 transition-transform group-hover:scale-110 dark:bg-blue-900/50">
                                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <CardTitle className="text-base">
                                {t('dashboard.inProgress')}
                            </CardTitle>
                            <CardDescription className="mt-1 text-xs">
                                {t('dashboard.inProgress.desc')}
                            </CardDescription>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/student/exams" className="group">
                    <Card className="h-full min-h-[140px] cursor-pointer border-2 border-transparent transition-all hover:border-purple-200 hover:shadow-lg dark:hover:border-purple-900">
                        <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
                            <div className="mb-3 rounded-full bg-purple-100 p-3 transition-transform group-hover:scale-110 dark:bg-purple-900/50">
                                <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <CardTitle className="text-base">{t('dashboard.results')}</CardTitle>
                            <CardDescription className="mt-1 text-xs">
                                {t('dashboard.results.desc')}
                            </CardDescription>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Info Cards */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="flex flex-col">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/50">
                                <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-xs font-bold text-white shadow-sm">
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

                <Card className="flex flex-col border-amber-200 dark:border-amber-900/50">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                            <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/50">
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
                                        className="flex items-start gap-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20"
                                    >
                                        <span className="text-lg">
                                            {rule.icon}
                                        </span>
                                        <p className="text-sm">{rule.text}</p>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <div className="p-6 pt-0">
                        <div className="flex items-center gap-2 rounded-lg bg-amber-100 p-3 dark:bg-amber-900/30">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                                {t('dashboard.violationWarning')}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </>
    );
}
