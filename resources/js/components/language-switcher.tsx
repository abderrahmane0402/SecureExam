import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguageStandalone, type Language } from '@/hooks/use-language';

interface LanguageSwitcherProps {
    variant?: 'default' | 'ghost' | 'outline';
    size?: 'default' | 'sm' | 'icon';
    showLabel?: boolean;
}

const languageNames: Record<Language, string> = {
    en: 'English',
    fr: 'Français',
};

export function LanguageSwitcher({
    variant = 'ghost',
    size = 'sm',
    showLabel = true,
}: LanguageSwitcherProps) {
    const { language, setLanguage } = useLanguageStandalone();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size}>
                    <Globe className="h-4 w-4" />
                    {showLabel && (
                        <span className="ml-1 hidden sm:inline">
                            {languageNames[language]}
                        </span>
                    )}
                    {showLabel && (
                        <span className="ml-1 sm:hidden">
                            {language.toUpperCase()}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage('en')}>
                    🇬🇧 English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('fr')}>
                    🇫🇷 Français
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
