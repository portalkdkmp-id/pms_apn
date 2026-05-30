import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    BriefcaseBusiness,
    CheckCircle2,
    CircleDot,
    Target,
    Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { dashboard } from '@/routes';

type ChartItem = {
    label: string;
    value: number;
    color?: string;
};

type StatusSummary = {
    name: string;
    color: string;
};

type ProjectSummary = {
    id: string;
    code: string;
    title: string;
    division: string | null;
    owner: string | null;
    status: StatusSummary | null;
    deadline: string | null;
};

type TaskSummary = {
    id: string;
    title: string;
    project: string | null;
    assignee?: string | null;
    status: StatusSummary | null;
    dueDate: string | null;
    kpiPoint: string;
};

type Props = {
    stats: {
        projects: number;
        activeProjects: number;
        tasks: number;
        openTasks: number;
        overdueTasks: number;
        teams: number;
        users: number;
        divisions: number;
        kpiTarget: number;
        kpiValue: number;
        kpiPercent: number;
        taskKpiPoints: number;
        completedTaskKpiPoints: number;
    };
    charts: {
        projectsByStatus: ChartItem[];
        tasksByStatus: ChartItem[];
        projectsByDivision: ChartItem[];
    };
    recentProjects: ProjectSummary[];
    overdueTasks: TaskSummary[];
    myTasks: TaskSummary[];
};

function formatDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));
}

function StatCard({
    title,
    value,
    description,
    icon: Icon,
}: {
    title: string;
    value: number | string;
    description: string;
    icon: typeof BriefcaseBusiness;
}) {
    return (
        <Card size="sm" className="rounded-lg">
            <CardHeader className="grid-cols-[1fr_auto]">
                <div>
                    <CardDescription>{title}</CardDescription>
                    <CardTitle className="text-2xl">{value}</CardTitle>
                </div>
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-4 text-muted-foreground" />
                </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
                {description}
            </CardContent>
        </Card>
    );
}

function BarChart({ title, items }: { title: string; items: ChartItem[] }) {
    const max = Math.max(...items.map((item) => item.value), 1);

    return (
        <Card className="rounded-lg">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Belum ada data.
                    </p>
                ) : (
                    items.map((item) => (
                        <div key={item.label} className="grid gap-1">
                            <div className="flex items-center justify-between gap-3 text-sm">
                                <div className="flex min-w-0 items-center gap-2">
                                    {item.color && (
                                        <span
                                            className="size-2.5 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor: item.color,
                                            }}
                                        />
                                    )}
                                    <span className="truncate">
                                        {item.label}
                                    </span>
                                </div>
                                <span className="font-medium">
                                    {item.value}
                                </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-primary"
                                    style={{
                                        width: `${Math.max((item.value / max) * 100, item.value > 0 ? 6 : 0)}%`,
                                        backgroundColor: item.color,
                                    }}
                                />
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status }: { status: StatusSummary | null }) {
    if (!status) {
        return <Badge variant="outline">-</Badge>;
    }

    return (
        <Badge variant="outline">
            <span
                className="size-2 rounded-full"
                style={{ backgroundColor: status.color }}
            />
            {status.name}
        </Badge>
    );
}

export default function Dashboard({
    stats,
    charts,
    recentProjects,
    overdueTasks,
    myTasks,
}: Props) {
    const kpiWidth = Math.min(Math.max(stats.kpiPercent, 0), 100);
    const taskKpiPercent =
        stats.taskKpiPoints > 0
            ? Math.round(
                  (stats.completedTaskKpiPoints / stats.taskKpiPoints) * 1000,
              ) / 10
            : 0;

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Dashboard</h1>
                        <p className="text-sm text-muted-foreground">
                            Ringkasan performa PMS, project, team, task, dan
                            KPI.
                        </p>
                    </div>
                    <Badge
                        variant={
                            stats.overdueTasks > 0 ? 'destructive' : 'outline'
                        }
                    >
                        {stats.overdueTasks} task overdue
                    </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Projects"
                        value={stats.projects}
                        description={`${stats.activeProjects} project masih aktif`}
                        icon={BriefcaseBusiness}
                    />
                    <StatCard
                        title="Tasks"
                        value={stats.tasks}
                        description={`${stats.openTasks} task masih terbuka`}
                        icon={CheckCircle2}
                    />
                    <StatCard
                        title="Teams"
                        value={stats.teams}
                        description={`${stats.users} user dari ${stats.divisions} divisi`}
                        icon={Users}
                    />
                    <StatCard
                        title="KPI Project"
                        value={`${stats.kpiPercent}%`}
                        description={`${stats.kpiValue} KPI task done dari target ${stats.kpiTarget}`}
                        icon={Target}
                    />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card className="rounded-lg">
                        <CardHeader>
                            <CardTitle>Progress KPI</CardTitle>
                            <CardDescription>
                                KPI project dihitung dari KPI point task yang
                                berstatus Done.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Project KPI</span>
                                    <span className="font-medium">
                                        {stats.kpiPercent}%
                                    </span>
                                </div>
                                <div className="h-3 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-primary"
                                        style={{ width: `${kpiWidth}%` }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Completed Task KPI Points</span>
                                    <span className="font-medium">
                                        {taskKpiPercent}%
                                    </span>
                                </div>
                                <div className="h-3 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-emerald-600"
                                        style={{
                                            width: `${Math.min(taskKpiPercent, 100)}%`,
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.completedTaskKpiPoints} dari{' '}
                                    {stats.taskKpiPoints} KPI point task
                                    berstatus Done.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <BarChart
                        title="Project by Status"
                        items={charts.projectsByStatus}
                    />
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    <BarChart
                        title="Task by Status"
                        items={charts.tasksByStatus}
                    />
                    <BarChart
                        title="Project by Division"
                        items={charts.projectsByDivision}
                    />
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                    <Card className="rounded-lg xl:col-span-2">
                        <CardHeader>
                            <CardTitle>Recent Projects</CardTitle>
                            <CardDescription>
                                Project terbaru sesuai aksesmu.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-left text-muted-foreground">
                                        <tr>
                                            <th className="py-2 pr-3 font-medium">
                                                Project
                                            </th>
                                            <th className="py-2 pr-3 font-medium">
                                                Owner
                                            </th>
                                            <th className="py-2 pr-3 font-medium">
                                                Status
                                            </th>
                                            <th className="py-2 text-right font-medium">
                                                Deadline
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentProjects.map((project) => (
                                            <tr
                                                key={project.id}
                                                className="border-t"
                                            >
                                                <td className="py-3 pr-3">
                                                    <div className="font-medium">
                                                        {project.title}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {project.code} ·{' '}
                                                        {project.division ??
                                                            '-'}
                                                    </div>
                                                </td>
                                                <td className="py-3 pr-3">
                                                    {project.owner ?? '-'}
                                                </td>
                                                <td className="py-3 pr-3">
                                                    <StatusBadge
                                                        status={project.status}
                                                    />
                                                </td>
                                                <td className="py-3 text-right">
                                                    {formatDate(
                                                        project.deadline,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-lg">
                        <CardHeader>
                            <CardTitle>My Open Tasks</CardTitle>
                            <CardDescription>
                                Task yang assigned ke kamu.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {myTasks.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Tidak ada task terbuka.
                                </p>
                            ) : (
                                myTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="rounded-lg border p-3"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="font-medium">
                                                    {task.title}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {task.project ?? '-'}
                                                </div>
                                            </div>
                                            <StatusBadge status={task.status} />
                                        </div>
                                        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                                            <span>
                                                Due {formatDate(task.dueDate)}
                                            </span>
                                            <span>{task.kpiPoint} KPI</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card className="rounded-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="size-4 text-destructive" />
                            Overdue Tasks
                        </CardTitle>
                        <CardDescription>
                            Task melewati due date dan belum selesai.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {overdueTasks.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Tidak ada overdue task.
                                </p>
                            ) : (
                                overdueTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="rounded-lg border p-3"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="font-medium">
                                                    {task.title}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {task.project ?? '-'}
                                                </div>
                                            </div>
                                            <CircleDot className="size-4 text-destructive" />
                                        </div>
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <StatusBadge status={task.status} />
                                            <Badge variant="destructive">
                                                Due {formatDate(task.dueDate)}
                                            </Badge>
                                            <Badge variant="outline">
                                                {task.kpiPoint} KPI
                                            </Badge>
                                        </div>
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            PIC: {task.assignee ?? '-'}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
