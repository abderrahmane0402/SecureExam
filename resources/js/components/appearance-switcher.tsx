import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppearance } from '@/hooks/use-appearance';

interface AppearanceSwitcherProps {
    variant?: 'default' | 'ghost' | 'outline';
    size?: 'default' | 'sm' | 'icon';
}

export function AppearanceSwitcher({
    variant = 'ghost',
    size = 'sm',
}: AppearanceSwitcherProps) {
    const { appearance, updateAppearance } = useAppearance();

    const Icon = appearance === 'light' ? Sun : appearance === 'dark' ? Moon : Monitor;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size} className="h-9 w-9">
                    <Icon className="h-4 w-4" />
                    <span className="sr-only">Toggle appearance</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => updateAppearance('light')} className="gap-2 focus:bg-blue-50 dark:focus:bg-blue-900/40">
                    <Sun className="h-4 w-4 text-amber-500" />
                    <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateAppearance('dark')} className="gap-2 focus:bg-blue-50 dark:focus:bg-blue-900/40">
                    <Moon className="h-4 w-4 text-blue-400" />
                    <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateAppearance('system')} className="gap-2 focus:bg-blue-50 dark:focus:bg-blue-900/40">
                    <Monitor className="h-4 w-4 text-slate-400" />
                    <span>System</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
