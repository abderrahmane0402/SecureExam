import { Link } from '@inertiajs/react';
import { BookOpen } from 'lucide-react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { home } from '@/routes';
import { useLanguageStandalone } from '@/hooks/use-language';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { t } = useLanguageStandalone();

    return (
        <div className="flex min-h-svh">
            {/* Left side - Gradient with branding */}
            <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-12 lg:flex">
                <Link href={home()} className="flex items-center gap-2">
                    <BookOpen className="h-8 w-8 text-white" />
                    <span className="text-xl font-bold text-white">
                        ExamSecure
                    </span>
                </Link>
                <div>
                    <blockquote className="space-y-2">
                        <p className="text-lg text-white/90">
                            "{t('auth.quote')}"
                        </p>
                        <footer className="text-sm text-white/70">
                            {t('auth.trusted')}
                        </footer>
                    </blockquote>
                </div>
                <div className="text-sm text-white/60">
                    © {new Date().getFullYear()} ExamSecure
                </div>
            </div>

            {/* Right side - Form */}
            <div className="flex w-full flex-col bg-background p-6 md:p-10 lg:w-1/2">
                <div className="flex justify-end">
                    <LanguageSwitcher />
                </div>
                <div className="flex flex-1 flex-col items-center justify-center gap-6">
                    <div className="w-full max-w-sm">
                        <div className="flex flex-col gap-8">
                            <div className="flex flex-col items-center gap-4">
                                <Link
                                    href={home()}
                                    className="flex items-center gap-2 font-medium lg:hidden"
                                >
                                    <BookOpen className="h-8 w-8 text-primary" />
                                    <span className="text-xl font-bold">
                                        ExamSecure
                                    </span>
                                </Link>

                                <div className="space-y-2 text-center">
                                    <h1 className="text-2xl font-semibold tracking-tight">
                                        {title}
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        {description}
                                    </p>
                                </div>
                            </div>
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
