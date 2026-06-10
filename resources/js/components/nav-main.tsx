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

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-0 py-2">
            <SidebarGroupLabel className="px-3 text-[11px] font-medium tracking-[0.12em] text-graphite uppercase">
                Main Menu
            </SidebarGroupLabel>
            <SidebarMenu className="gap-1.5">
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                            className="h-10 rounded-xl text-sidebar-foreground/80 hover:bg-white hover:text-sidebar-foreground data-[active=true]:bg-white data-[active=true]:text-sidebar-foreground data-[active=true]:shadow-sm data-[active=true]:ring-1 data-[active=true]:ring-sidebar-border data-[active=true]:[&_svg]:text-sidebar-foreground [&>svg]:text-graphite"
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
    );
}
