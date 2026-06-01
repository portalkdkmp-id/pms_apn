import { Link, usePage } from '@inertiajs/react';
import {
    Building2,
    GitBranch,
    LayoutGrid,
    ListTodo,
    PanelsTopLeft,
    ShieldCheck,
    SquareCheckBig,
    UsersRound,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as divisionsIndex } from '@/routes/divisions';
import { index as flowActivitiesIndex } from '@/routes/flow-activities';
import { index as projectStatusesIndex } from '@/routes/project-statuses';
import { index as projectsIndex } from '@/routes/projects';
import { index as rolesIndex } from '@/routes/roles';
import { index as tasksIndex } from '@/routes/tasks';
import { index as teamsIndex } from '@/routes/teams';
import { index as usersIndex } from '@/routes/users';
import type { Auth, NavItem } from '@/types';

type PermissionNavItem = NavItem & {
    permission?: string;
    role?: string;
};

const mainNavItems: PermissionNavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
        permission: 'dashboard.view',
    },
    {
        title: 'Proyek',
        href: projectsIndex(),
        icon: PanelsTopLeft,
        permission: 'project.view',
    },
    {
        title: 'Tugas / Aktivitas',
        href: tasksIndex(),
        icon: SquareCheckBig,
        permission: 'task.view',
    },
    {
        title: 'Flow Aktivitas',
        href: flowActivitiesIndex(),
        icon: GitBranch,
        permission: 'task.view',
    },
    {
        title: 'Users',
        href: usersIndex(),
        icon: Users,
        permission: 'user.view',
    },
    {
        title: 'Divisions',
        href: divisionsIndex(),
        icon: Building2,
        permission: 'division.view',
    },
    {
        title: 'Teams',
        href: teamsIndex(),
        icon: UsersRound,
        permission: 'team.view',
    },
    {
        title: 'Roles & Permissions',
        href: rolesIndex(),
        icon: ShieldCheck,
        permission: 'role.view',
    },
    {
        title: 'Status Tags',
        href: projectStatusesIndex(),
        icon: ListTodo,
        permission: 'project_status.view',
    },
];

export function AppSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const permissions = new Set(auth.permissions);
    const roles = new Set(auth.roles);
    const visibleMainNavItems = mainNavItems.filter((item) => {
        if (item.role) {
            return roles.has(item.role);
        }

        return item.permission ? permissions.has(item.permission) : true;
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={visibleMainNavItems} />
            </SidebarContent>

            {/* <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter> */}
        </Sidebar>
    );
}
