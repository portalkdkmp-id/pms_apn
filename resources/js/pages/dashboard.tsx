import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowUpRight,
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
    tone,
}: {
    title: string;
    value: number | string;
    description: string;
    icon: typeof BriefcaseBusiness;
    tone: 'ink' | 'warm' | 'cool' | 'neutral';
}) {
    const tones = {
        ink: 'bg-ink text-pure-white ring-ink/10',
        warm: 'bg-apricot-wash text-rust ring-rust/10',
        cool: 'bg-sky-wash text-ink ring-ink/10',
        neutral: 'bg-fog text-graphite ring-dove/35',
    };

    return (
        <Card size="sm" className="relative transition hover:-translate-y-0.5">
            <CardHeader className="grid-cols-[1fr_auto]">
                <div>
                    <CardDescription className="text-xs font-medium tracking-[0.12em] text-graphite uppercase">
                        {title}
                    </CardDescription>
                    <CardTitle className="mt-2 text-3xl font-medium text-ink">
                        {value}
                    </CardTitle>
                </div>
                <div
                    className={`flex size-11 items-center justify-center rounded-xl ring-1 ${tones[tone]}`}
                >
                    <Icon className="size-5" />
                </div>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-xs text-graphite">
                <ArrowUpRight className="size-3.5 text-rust" />
                <span>{description}</span>
            </CardContent>
        </Card>
    );
}

function BarChart({ title, items }: { title: string; items: ChartItem[] }) {
    const max = Math.max(...items.map((item) => item.value), 1);

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {items.length === 0 ? (
                    <p className="text-sm text-graphite">Belum ada data.</p>
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
                                <span className="font-medium text-ink">
                                    {item.value}
                                </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-fog">
                                <div
                                    className="h-full rounded-full bg-rust"
                                    style={{
                                        width: `${Math.max((item.value / max) * 100, item.value > 0 ? 6 : 0)}%`,
                                        backgroundColor:
                                            item.color ?? '#5d2a1a',
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

            <div className="flex h-full flex-1 flex-col gap-5 overflow-x-auto bg-fog p-4 md:p-6">
                <div className="relative overflow-hidden rounded-[28px] bg-card p-5 shadow-[var(--shadow-subtle)] md:p-6">
                    <div className="absolute inset-0 hidden bg-[radial-gradient(circle_at_82%_18%,rgba(251,225,209,0.72),transparent_26rem)] md:block" />
                    <div className="relative flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <Badge className="mb-3 bg-apricot-wash text-rust hover:bg-apricot-wash">
                                PMS APN Workspace
                            </Badge>
                            <h1 className="font-heading text-[44px] leading-[1.1] font-normal tracking-[-0.015em] text-ink">
                                Dashboard
                            </h1>
                            <p className="mt-2 max-w-2xl text-base text-ash">
                                Ringkasan performa PMS, project, team, task, dan
                                KPI dalam satu tampilan kerja.
                            </p>
                        </div>
                        <Badge
                            className="h-8 bg-fog px-3 text-ink hover:bg-fog"
                            variant={
                                stats.overdueTasks > 0
                                    ? 'destructive'
                                    : 'outline'
                            }
                        >
                            {stats.overdueTasks} task overdue
                        </Badge>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Projects"
                        value={stats.projects}
                        description={`${stats.activeProjects} project masih aktif`}
                        icon={BriefcaseBusiness}
                        tone="cool"
                    />
                    <StatCard
                        title="Tasks"
                        value={stats.tasks}
                        description={`${stats.openTasks} task masih terbuka`}
                        icon={CheckCircle2}
                        tone="warm"
                    />
                    <StatCard
                        title="Teams"
                        value={stats.teams}
                        description={`${stats.users} user dari ${stats.divisions} divisi`}
                        icon={Users}
                        tone="neutral"
                    />
                    <StatCard
                        title="KPI Project"
                        value={`${stats.kpiPercent}%`}
                        description={`${stats.kpiValue} KPI task done dari target ${stats.kpiTarget}`}
                        icon={Target}
                        tone="ink"
                    />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card>
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
                                <div className="h-3 overflow-hidden rounded-full bg-fog">
                                    <div
                                        className="h-full rounded-full bg-rust"
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
                                <div className="h-3 overflow-hidden rounded-full bg-fog">
                                    <div
                                        className="h-full rounded-full bg-[color:var(--chart-2)]"
                                        style={{
                                            width: `${Math.min(taskKpiPercent, 100)}%`,
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-graphite">
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
                    <Card className="xl:col-span-2">
                        <CardHeader>
                            <CardTitle>Recent Projects</CardTitle>
                            <CardDescription>
                                Project terbaru sesuai aksesmu.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full border-separate border-spacing-0 text-sm">
                                    <thead className="text-left text-xs tracking-[0.12em] text-graphite uppercase">
                                        <tr>
                                            <th className="border-b border-border/70 py-3 pr-3 font-medium">
                                                Project
                                            </th>
                                            <th className="border-b border-border/70 py-3 pr-3 font-medium">
                                                Owner
                                            </th>
                                            <th className="border-b border-border/70 py-3 pr-3 font-medium">
                                                Status
                                            </th>
                                            <th className="border-b border-border/70 py-3 text-right font-medium">
                                                Deadline
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentProjects.map((project) => (
                                            <tr
                                                key={project.id}
                                                className="transition hover:bg-fog/70"
                                            >
                                                <td className="py-3 pr-3">
                                                    <div className="font-medium text-ink">
                                                        {project.title}
                                                    </div>
                                                    <div className="text-xs text-graphite">
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

                    <Card>
                        <CardHeader>
                            <CardTitle>My Open Tasks</CardTitle>
                            <CardDescription>
                                Task yang assigned ke kamu.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {myTasks.length === 0 ? (
                                <p className="text-sm text-graphite">
                                    Tidak ada task terbuka.
                                </p>
                            ) : (
                                myTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="rounded-2xl bg-fog p-3 transition hover:bg-apricot-wash/45"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="font-medium text-ink">
                                                    {task.title}
                                                </div>
                                                <div className="text-xs text-graphite">
                                                    {task.project ?? '-'}
                                                </div>
                                            </div>
                                            <StatusBadge status={task.status} />
                                        </div>
                                        <div className="mt-2 flex justify-between text-xs text-graphite">
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

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="size-4 text-rust" />
                            Overdue Tasks
                        </CardTitle>
                        <CardDescription>
                            Task melewati due date dan belum selesai.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {overdueTasks.length === 0 ? (
                                <p className="text-sm text-graphite">
                                    Tidak ada overdue task.
                                </p>
                            ) : (
                                overdueTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="rounded-2xl bg-fog p-3 transition hover:bg-apricot-wash/45"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="font-medium text-ink">
                                                    {task.title}
                                                </div>
                                                <div className="text-xs text-graphite">
                                                    {task.project ?? '-'}
                                                </div>
                                            </div>
                                            <CircleDot className="size-4 text-rust" />
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
                                        <div className="mt-2 text-xs text-graphite">
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
