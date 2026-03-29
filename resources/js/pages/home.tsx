import { Head, Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    GraduationCap,
    Shield,
    Clock,
    CheckCircle,
    Users,
    Globe,
    Menu,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    LanguageProvider,
    useLanguage
    
} from '@/hooks/use-language';
import type {Language} from '@/hooks/use-language';

export default function Home({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    return (
        <LanguageProvider>
            <HomeContent canRegister={canRegister} />
        </LanguageProvider>
    );
}

function HomeContent({ canRegister }: { canRegister: boolean }) {
    const { auth } = usePage<{ auth: { user: { role: string } | null } }>()
        .props;
    const { t, language, setLanguage } = useLanguage();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const languageNames: Record<Language, string> = {
        en: 'English',
        fr: 'Français',
    };

    return (
        <>
            <Head title="Secure Exam System">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=inter:400,500,600,700"
                    rel="stylesheet"
                />
            </Head>
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
                {/* Navigation */}
                <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:py-4 lg:px-8">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-7 w-7 text-blue-600 sm:h-8 sm:w-8" />
                            <span className="text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
                                ExamSecure
                            </span>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden items-center gap-2 sm:flex md:gap-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <Globe className="mr-1 h-4 w-4" />
                                        <span className="hidden md:inline">
                                            {languageNames[language]}
                                        </span>
                                        <span className="md:hidden">
                                            {language.toUpperCase()}
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => setLanguage('en')}
                                    >
                                        🇬🇧 English
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setLanguage('fr')}
                                    >
                                        🇫🇷 Français
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {auth.user ? (
                                <Link href="/dashboard">
                                    <Button size="sm" className="md:size-default">
                                        {t('nav.dashboard')}
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="md:size-default"
                                        >
                                            {t('nav.login')}
                                        </Button>
                                    </Link>
                                    {canRegister && (
                                        <Link href="/register">
                                            <Button
                                                size="sm"
                                                className="md:size-default"
                                            >
                                                {t('nav.register')}
                                            </Button>
                                        </Link>
                                    )}
                                </>
                            )}
                        </nav>

                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="sm:hidden"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </Button>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="border-t bg-white px-4 py-4 sm:hidden dark:bg-slate-900">
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-2">
                                    <Button
                                        variant={
                                            language === 'en'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => setLanguage('en')}
                                    >
                                        🇬🇧 English
                                    </Button>
                                    <Button
                                        variant={
                                            language === 'fr'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => setLanguage('fr')}
                                    >
                                        🇫🇷 Français
                                    </Button>
                                </div>
                                {auth.user ? (
                                    <Link
                                        href="/dashboard"
                                        className="w-full"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Button className="w-full">
                                            {t('nav.dashboard')}
                                        </Button>
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href="/login"
                                            className="w-full"
                                            onClick={() =>
                                                setMobileMenuOpen(false)
                                            }
                                        >
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                            >
                                                {t('nav.login')}
                                            </Button>
                                        </Link>
                                        {canRegister && (
                                            <Link
                                                href="/register"
                                                className="w-full"
                                                onClick={() =>
                                                    setMobileMenuOpen(false)
                                                }
                                            >
                                                <Button className="w-full">
                                                    {t('nav.register')}
                                                </Button>
                                            </Link>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </header>

                {/* Hero Section */}
                <section className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 sm:py-16 md:py-20 lg:px-8">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-6xl dark:text-white">
                        {t('hero.title')}
                        <span className="block text-blue-600">
                            {t('hero.subtitle')}
                        </span>
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:mt-6 sm:text-lg dark:text-slate-300">
                        {t('hero.description')}
                    </p>
                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4">
                        {auth.user ? (
                            <Link href="/dashboard" className="w-full sm:w-auto">
                                <Button
                                    size="lg"
                                    className="w-full px-8 sm:w-auto"
                                >
                                    <GraduationCap className="mr-2 h-5 w-5" />
                                    {t('hero.enterDashboard')}
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href="/register"
                                    className="w-full sm:w-auto"
                                >
                                    <Button
                                        size="lg"
                                        className="w-full px-8 sm:w-auto"
                                    >
                                        <GraduationCap className="mr-2 h-5 w-5" />
                                        {t('hero.getStarted')}
                                    </Button>
                                </Link>
                                <Link href="/login" className="w-full sm:w-auto">
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="w-full px-8 sm:w-auto"
                                    >
                                        {t('hero.signIn')}
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </section>

                {/* Features Section */}
                <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
                    <h2 className="mb-8 text-center text-2xl font-bold text-slate-900 sm:mb-12 sm:text-3xl dark:text-white">
                        {t('features.title')}
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
                        <Card className="h-full">
                            <CardHeader>
                                <Shield className="mb-2 h-8 w-8 text-blue-600 sm:h-10 sm:w-10" />
                                <CardTitle className="text-base sm:text-lg">
                                    {t('features.antiCheating.title')}
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    {t('features.antiCheating.description')}
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="h-full">
                            <CardHeader>
                                <Clock className="mb-2 h-8 w-8 text-green-600 sm:h-10 sm:w-10" />
                                <CardTitle className="text-base sm:text-lg">
                                    {t('features.timedExams.title')}
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    {t('features.timedExams.description')}
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="h-full">
                            <CardHeader>
                                <CheckCircle className="mb-2 h-8 w-8 text-purple-600 sm:h-10 sm:w-10" />
                                <CardTitle className="text-base sm:text-lg">
                                    {t('features.autoGrading.title')}
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    {t('features.autoGrading.description')}
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="h-full">
                            <CardHeader>
                                <Users className="mb-2 h-8 w-8 text-orange-600 sm:h-10 sm:w-10" />
                                <CardTitle className="text-base sm:text-lg">
                                    {t('features.monitoring.title')}
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    {t('features.monitoring.description')}
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="h-full">
                            <CardHeader>
                                <BookOpen className="mb-2 h-8 w-8 text-indigo-600 sm:h-10 sm:w-10" />
                                <CardTitle className="text-base sm:text-lg">
                                    {t('features.questionTypes.title')}
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    {t('features.questionTypes.description')}
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="h-full">
                            <CardHeader>
                                <GraduationCap className="mb-2 h-8 w-8 text-red-600 sm:h-10 sm:w-10" />
                                <CardTitle className="text-base sm:text-lg">
                                    {t('features.studentFriendly.title')}
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    {t('features.studentFriendly.description')}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </section>

                {/* Role Section */}
                <section className="bg-white py-12 sm:py-16 dark:bg-slate-800">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <h2 className="mb-8 text-center text-2xl font-bold text-slate-900 sm:mb-12 sm:text-3xl dark:text-white">
                            {t('roles.title')}
                        </h2>
                        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:gap-8">
                            <Card className="h-full border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
                                <CardHeader className="pb-2 sm:pb-4">
                                    <CardTitle className="flex items-center gap-2 text-base text-blue-700 sm:text-lg dark:text-blue-300">
                                        <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                                        {t('roles.instructors.title')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-1.5 text-sm text-slate-700 sm:space-y-2 sm:text-base dark:text-slate-300">
                                        <li>• {t('roles.instructors.item1')}</li>
                                        <li>• {t('roles.instructors.item2')}</li>
                                        <li>• {t('roles.instructors.item3')}</li>
                                        <li>• {t('roles.instructors.item4')}</li>
                                        <li>• {t('roles.instructors.item5')}</li>
                                        <li>• {t('roles.instructors.item6')}</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="h-full border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                                <CardHeader className="pb-2 sm:pb-4">
                                    <CardTitle className="flex items-center gap-2 text-base text-green-700 sm:text-lg dark:text-green-300">
                                        <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
                                        {t('roles.students.title')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-1.5 text-sm text-slate-700 sm:space-y-2 sm:text-base dark:text-slate-300">
                                        <li>• {t('roles.students.item1')}</li>
                                        <li>• {t('roles.students.item2')}</li>
                                        <li>• {t('roles.students.item3')}</li>
                                        <li>• {t('roles.students.item4')}</li>
                                        <li>• {t('roles.students.item5')}</li>
                                        <li>• {t('roles.students.item6')}</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 sm:py-16 md:py-20 lg:px-8">
                    <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
                        {t('cta.title')}
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:mt-4 sm:text-base dark:text-slate-300">
                        {t('cta.description')}
                    </p>
                    {!auth.user && (
                        <div className="mt-6 sm:mt-8">
                            <Link href="/register" className="inline-block">
                                <Button size="lg" className="w-full px-8 sm:w-auto">
                                    {t('cta.button')}
                                </Button>
                            </Link>
                        </div>
                    )}
                </section>

                {/* Footer */}
                <footer className="border-t bg-white py-6 sm:py-8 dark:bg-slate-900">
                    <div className="mx-auto max-w-7xl px-4 text-center text-xs text-slate-500 sm:px-6 sm:text-sm lg:px-8">
                        <div className="flex items-center justify-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
                            <span className="font-semibold text-slate-900 dark:text-white">
                                ExamSecure
                            </span>
                        </div>
                        <p className="mt-2">
                            © {new Date().getFullYear()} {t('footer.copyright')}
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
