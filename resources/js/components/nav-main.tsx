import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export type NavGroup = {
    title: string;
    items: NavItem[];
};

export function NavMain({ groups = [] }: { groups: NavGroup[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <>
            {groups
                .filter((group) => group.items.length > 0)
                .map((group) => (
                    <SidebarGroup key={group.title} className="px-0 py-2">
                        <SidebarGroupLabel className="px-3 text-[11px] font-medium tracking-[0.12em] text-graphite uppercase">
                            {group.title}
                        </SidebarGroupLabel>
                        <SidebarMenu className="gap-1">
                            {group.items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isCurrentUrl(item.href)}
                                        tooltip={{ children: item.title }}
                                        className="h-9 rounded-sm text-sidebar-foreground/80 hover:bg-smoke-50 hover:text-sidebar-foreground data-[active=true]:bg-smoke-50 data-[active=true]:text-sidebar-foreground data-[active=true]:ring-1 data-[active=true]:ring-sidebar-border data-[active=true]:[&_svg]:text-sidebar-foreground [&>svg]:text-graphite"
                                    >
                                        <Link href={item.href} prefetch>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                ))}
        </>
    );
}
