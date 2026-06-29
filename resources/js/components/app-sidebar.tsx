import { Link, usePage } from '@inertiajs/react';
import {
    Building2,
    ChartNoAxesGantt,
    ClipboardCheck,
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
import { NavMain, type NavGroup } from '@/components/nav-main';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as divisionsIndex } from '@/routes/divisions';
import { index as flowActivitiesIndex } from '@/routes/flow-activities';
import { index as ganttChartIndex } from '@/routes/gantt-chart';
import { index as projectStatusesIndex } from '@/routes/project-statuses';
import { index as projectsIndex } from '@/routes/projects';
import { index as rolesIndex } from '@/routes/roles';
import { index as tasksIndex } from '@/routes/tasks';
import { pending as pendingTasksIndex } from '@/routes/tasks';
import { index as teamsIndex } from '@/routes/teams';
import { index as usersIndex } from '@/routes/users';
import type { Auth, NavItem } from '@/types';
import { NavUser } from './nav-user';

type PermissionNavItem = NavItem & {
    permission?: string;
    role?: string;
};

const navGroups: Array<{ title: string; items: PermissionNavItem[] }> = [
    {
        title: 'Overview',
        items: [
            {
                title: 'Dashboard',
                href: dashboard(),
                icon: LayoutGrid,
                permission: 'dashboard.view',
            },
        ],
    },
    {
        title: 'Project Work',
        items: [
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
                title: 'Pending Tasks',
                href: pendingTasksIndex(),
                icon: ClipboardCheck,
                permission: 'task.approve',
            },
            {
                title: 'Flow Aktivitas',
                href: flowActivitiesIndex(),
                icon: GitBranch,
                permission: 'task.view',
            },
            {
                title: 'Gantt Chart',
                href: ganttChartIndex(),
                icon: ChartNoAxesGantt,
                permission: 'task.view',
            },
        ],
    },
    {
        title: 'Organization',
        items: [
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
                title: 'Users',
                href: usersIndex(),
                icon: Users,
                permission: 'user.view',
            },
        ],
    },
    {
        title: 'Administration',
        items: [
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
        ],
    },
];

export function AppSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const permissions = new Set(auth.permissions);
    const roles = new Set(auth.roles);
    const visibleNavGroups: NavGroup[] = navGroups.map((group) => ({
        title: group.title,
        items: group.items.filter((item) => {
            if (item.role) {
                return roles.has(item.role);
            }

            return item.permission ? permissions.has(item.permission) : true;
        }),
    }));

    return (
        <Sidebar
            collapsible="icon"
            variant="inset"
            className="border-r border-sidebar-border group-data-[variant=inset]:p-3"
        >
            <SidebarHeader className="px-3 pt-3 pb-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="h-13 rounded-sm border border-sidebar-border bg-white text-sidebar-foreground shadow-none hover:bg-smoke-50"
                        >
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-3 pb-4">
                <NavMain groups={visibleNavGroups} />
            </SidebarContent>

            <SidebarFooter className="px-3 pb-3">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
