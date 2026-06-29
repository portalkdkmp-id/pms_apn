import { Head, Link } from '@inertiajs/react';
import { GitBranch, Lock, Milestone, Rows3 } from 'lucide-react';
import { PageHeader } from '@/components/app-page';
import { Button } from '@/components/ui/button';
import { index as flowActivitiesIndex } from '@/routes/flow-activities';
import { index as ganttChartIndex } from '@/routes/gantt-chart';
import type { Project, Task } from '@/types';

type GanttTask = Omit<Task, 'subtasks'> & {
    subtasks?: GanttTask[];
};

type GanttProject = Project & {
    tasks: GanttTask[];
};

type Props = {
    projects: GanttProject[];
};

type GanttRow = {
    id: string;
    type: 'project' | 'task';
    level: number;
    title: string;
    subtitle: string;
    statusName: string;
    statusColor: string;
    startDate: string | null;
    endDate: string | null;
    deadlineDate: string | null;
    blocked: boolean;
};

const DAY_MS = 86_400_000;

function parseDate(value?: string | null): Date | null {
    if (!value) {
        return null;
    }

    const date = new Date(`${value.slice(0, 10)}T00:00:00`);

    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value?: string | null): string {
    const date = parseDate(value);

    if (!date) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

function addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * DAY_MS);
}

function diffDays(from: Date, to: Date): number {
    return Math.max(0, Math.round((to.getTime() - from.getTime()) / DAY_MS));
}

function isProjectBlocked(project: GanttProject): boolean {
    return (
        project.requires_previous_project_done &&
        project.previous_project?.status?.slug !== 'done'
    );
}

function isTaskBlocked(task: GanttTask): boolean {
    return (
        task.requires_previous_task_done &&
        task.previous_task?.status?.slug !== 'done'
    );
}

function flattenTaskRows(tasks: GanttTask[], level: number): GanttRow[] {
    return tasks.flatMap((task) => [
        {
            id: `task:${task.id}`,
            type: 'task' as const,
            level,
            title: task.title,
            subtitle: task.assignee?.name ?? task.division?.name ?? '-',
            statusName: task.status?.name ?? '-',
            statusColor: task.status?.color ?? '#10b981',
            startDate: task.start_date,
            endDate: task.due_date,
            deadlineDate: task.due_date,
            blocked: isTaskBlocked(task),
        },
        ...flattenTaskRows(task.subtasks ?? [], level + 1),
    ]);
}

function buildRows(projects: GanttProject[]): GanttRow[] {
    return projects.flatMap((project) => [
        {
            id: `project:${project.id}`,
            type: 'project' as const,
            level: project.parent_id ? 1 : 0,
            title: project.title,
            subtitle: `${project.code} · ${project.division?.name ?? '-'}`,
            statusName: project.status?.name ?? '-',
            statusColor: project.status?.color ?? '#10b981',
            startDate: project.start_date,
            endDate: project.end_date ?? project.expected_deadline,
            deadlineDate: project.expected_deadline,
            blocked: isProjectBlocked(project),
        },
        ...flattenTaskRows(project.tasks, project.parent_id ? 2 : 1),
    ]);
}

function timelineBounds(rows: GanttRow[]): { start: Date; end: Date } {
    const dates = rows.flatMap((row) =>
        [row.startDate, row.endDate, row.deadlineDate]
            .map(parseDate)
            .filter((date): date is Date => date !== null),
    );

    if (dates.length === 0) {
        const today = new Date();

        return {
            start: today,
            end: addDays(today, 30),
        };
    }

    const min = new Date(Math.min(...dates.map((date) => date.getTime())));
    const max = new Date(Math.max(...dates.map((date) => date.getTime())));

    return {
        start: addDays(min, -3),
        end: addDays(max, 7),
    };
}

function barStyle(row: GanttRow, start: Date, totalDays: number) {
    const rowStart =
        parseDate(row.startDate) ?? parseDate(row.endDate) ?? start;
    const rowEnd = parseDate(row.endDate) ?? rowStart;
    const left = (diffDays(start, rowStart) / totalDays) * 100;
    const width = Math.max(
        1.5,
        ((diffDays(rowStart, rowEnd) + 1) / totalDays) * 100,
    );

    return {
        left: `${Math.min(100, left)}%`,
        width: `${Math.min(100 - left, width)}%`,
    };
}

function deadlineStyle(row: GanttRow, start: Date, totalDays: number) {
    const deadline = parseDate(row.deadlineDate);

    if (!deadline) {
        return null;
    }

    return {
        left: `${Math.min(100, (diffDays(start, deadline) / totalDays) * 100)}%`,
    };
}

export default function GanttChartIndex({ projects }: Props) {
    const rows = buildRows(projects);
    const { start, end } = timelineBounds(rows);
    const totalDays = Math.max(1, diffDays(start, end));
    const ticks = Array.from({ length: 7 }, (_, index) => {
        const date = addDays(start, Math.round((totalDays / 6) * index));

        return {
            key: date.toISOString(),
            label: new Intl.DateTimeFormat('id-ID', {
                day: '2-digit',
                month: 'short',
            }).format(date),
        };
    });

    return (
        <>
            <Head title="Gantt Chart" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-hidden bg-fog p-4 md:p-6">
                <PageHeader
                    eyebrow="Timeline"
                    title="Gantt Chart"
                    description="Timeline project, sub-project, task, dan sub task berdasarkan start date, end date, dan deadline."
                    actions={
                        <Button asChild variant="outline">
                            <Link href={flowActivitiesIndex()}>
                                <GitBranch />
                                Flow Aktivitas
                            </Link>
                        </Button>
                    }
                />

                <div className="flex flex-wrap items-center gap-3 border-b border-border bg-white px-4 py-3 text-xs text-graphite">
                    <div className="font-medium text-ink">Legend</div>
                    <div className="flex items-center gap-1.5">
                        <span className="h-3 w-6 rounded-sm bg-emerald-500" />
                        Normal
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="h-3 w-6 rounded-sm bg-red-500" />
                        Blocked dependency
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Milestone className="size-3.5 text-amber-500" />
                        Deadline
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Lock className="size-3.5 text-red-500" />
                        Menunggu predecessor Done
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-hidden bg-white">
                    <div className="grid h-full grid-cols-[360px_1fr] overflow-auto">
                        <div className="sticky left-0 z-20 border-r bg-white">
                            <div className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b bg-smoke-50 px-4 text-sm font-medium text-ink">
                                <Rows3 className="size-4 text-pulse-green" />
                                Aktivitas
                            </div>
                            {rows.map((row) => (
                                <div
                                    key={row.id}
                                    className={`grid min-h-16 border-b px-4 py-2 ${
                                        row.blocked
                                            ? 'bg-red-50 text-red-900'
                                            : 'bg-white'
                                    }`}
                                    style={{
                                        paddingLeft: `${16 + row.level * 18}px`,
                                    }}
                                >
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        {row.blocked && (
                                            <Lock className="size-3.5 text-red-500" />
                                        )}
                                        <span className="truncate">
                                            {row.title}
                                        </span>
                                    </div>
                                    <div className="truncate text-xs text-muted-foreground">
                                        {row.subtitle}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {formatDate(row.startDate)} -{' '}
                                        {formatDate(row.endDate)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="min-w-[900px]">
                            <div className="sticky top-0 z-10 grid h-12 grid-cols-7 border-b bg-smoke-50">
                                {ticks.map((tick) => (
                                    <div
                                        key={tick.key}
                                        className="border-r px-3 py-3 text-xs font-medium text-slate-500"
                                    >
                                        {tick.label}
                                    </div>
                                ))}
                            </div>
                            {rows.map((row) => {
                                const deadline = deadlineStyle(
                                    row,
                                    start,
                                    totalDays,
                                );

                                return (
                                    <div
                                        key={row.id}
                                        className={`relative min-h-16 border-b ${
                                            row.blocked
                                                ? 'bg-red-50/60'
                                                : 'bg-white'
                                        }`}
                                    >
                                        <div className="absolute inset-0 grid grid-cols-7">
                                            {ticks.map((tick) => (
                                                <div
                                                    key={tick.key}
                                                    className="border-r border-slate-100"
                                                />
                                            ))}
                                        </div>
                                        <div
                                            className={`absolute top-5 h-5 rounded-sm shadow-sm ${
                                                row.blocked
                                                    ? 'bg-red-500'
                                                    : row.type === 'project'
                                                      ? 'bg-emerald-600'
                                                      : 'bg-emerald-400'
                                            }`}
                                            style={barStyle(
                                                row,
                                                start,
                                                totalDays,
                                            )}
                                        />
                                        {deadline && (
                                            <div
                                                className="absolute top-3 h-9 border-l-2 border-amber-500"
                                                style={deadline}
                                            >
                                                <Milestone className="-ml-2 size-4 text-amber-500" />
                                            </div>
                                        )}
                                        <div
                                            className="absolute top-8 truncate px-2 text-[11px] text-slate-600"
                                            style={barStyle(
                                                row,
                                                start,
                                                totalDays,
                                            )}
                                        >
                                            {row.statusName}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

GanttChartIndex.layout = {
    breadcrumbs: [{ title: 'Gantt Chart', href: ganttChartIndex() }],
};
