import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { show } from '@/routes/two-factor';
import { edit as editPassword } from '@/routes/user-password';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: edit(),
        icon: null,
    },
    {
        title: 'Password',
        href: editPassword(),
        icon: null,
    },
    {
        title: 'Two-factor auth',
        href: show(),
        icon: null,
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: null,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    return (
        <div className="p-6">
            <Heading
                variant="gradient"
                title="Settings"
                description="Manage your profile and account settings"
            />

            <div className="mt-6 flex flex-col gap-6 lg:flex-row">
                <aside className="w-full shrink-0 lg:w-56">
                    <Card>
                        <CardContent className="p-2">
                            <nav
                                className="flex flex-col space-y-1"
                                aria-label="Settings"
                            >
                                {sidebarNavItems.map((item, index) => (
                                    <Button
                                        key={`${toUrl(item.href)}-${index}`}
                                        size="sm"
                                        variant="ghost"
                                        asChild
                                        className={cn('w-full justify-start', {
                                            'bg-primary/10 text-primary hover:bg-primary/20':
                                                isCurrentOrParentUrl(item.href),
                                        })}
                                    >
                                        <Link href={item.href}>
                                            {item.icon && (
                                                <item.icon className="h-4 w-4" />
                                            )}
                                            {item.title}
                                        </Link>
                                    </Button>
                                ))}
                            </nav>
                        </CardContent>
                    </Card>
                </aside>

                <Card className="flex-1">
                    <CardContent className="p-6">
                        <section className="max-w-xl space-y-12">
                            {children}
                        </section>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
