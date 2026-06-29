import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Clock } from 'lucide-react';
import {
    approve,
    pending,
} from '@/actions/App/Http/Controllers/TaskController';
import {
    EmptyTableState,
    PageHeader,
    PaginationLinks,
    TableCard,
} from '@/components/app-page';
import { Button } from '@/components/ui/button';
import type { Paginated, Task } from '@/types';

type Props = {
    tasks: Paginated<Task>;
};

function dateValue(value?: string | null): string {
    return value?.slice(0, 10) ?? '';
}

function isOverdueTask(task: Task): boolean {
    const dueDate = dateValue(task.due_date);

    return !!dueDate && dueDate < new Date().toISOString().slice(0, 10);
}

export default function PendingTasksIndex({ tasks }: Props) {
    const approveTask = (task: Task) => {
        router.post(approve.url(task.id), undefined, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Pending Tasks" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto bg-fog p-4 md:p-6">
                <PageHeader
                    eyebrow="Task approval"
                    title="Pending Tasks"
                    description="Daftar task completed dari staff yang menunggu approval manager atau superadmin."
                    meta={
                        <>
                            <span>{tasks.data.length} task menunggu</span>
                        </>
                    }
                />

                <TableCard>
                    {tasks.data.length === 0 ? (
                        <EmptyTableState
                            title="Tidak ada task pending"
                            description="Task yang sudah completed dan menunggu approval akan tampil di sini."
                        />
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-fog text-left text-xs tracking-[0.12em] text-graphite uppercase">
                                <tr>
                                    <th className="px-5 py-4 font-medium">
                                        Task
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Project
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Divisi / PIC
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Due
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Completed
                                    </th>
                                    <th className="w-28 px-5 py-4 text-right font-medium">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.data.map((task) => {
                                    const overdue = isOverdueTask(task);

                                    return (
                                        <tr
                                            key={task.id}
                                            className={`border-t border-border/70 transition hover:bg-fog/70 ${
                                                overdue ? 'bg-red-50/70' : ''
                                            }`}
                                        >
                                            <td className="px-5 py-4">
                                                <div className="font-medium text-ink">
                                                    {task.title}
                                                </div>
                                                <div className="text-graphite">
                                                    KPI {task.kpi_point}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                {task.project
                                                    ? `${task.project.code} - ${task.project.title}`
                                                    : '-'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div>
                                                    {task.division?.name ?? '-'}
                                                </div>
                                                <div className="text-graphite">
                                                    {task.assignee?.name ?? '-'}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    {overdue && (
                                                        <Clock className="size-4 text-red-600" />
                                                    )}
                                                    <span
                                                        className={
                                                            overdue
                                                                ? 'font-medium text-red-700'
                                                                : ''
                                                        }
                                                    >
                                                        {dateValue(
                                                            task.due_date,
                                                        ) || '-'}
                                                    </span>
                                                </div>
                                                {overdue && (
                                                    <div className="text-xs font-medium text-red-600">
                                                        Overdue
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                {dateValue(task.completed_at) ||
                                                    '-'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end">
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            approveTask(task)
                                                        }
                                                    >
                                                        <CheckCircle2 />
                                                        Approve
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </TableCard>

                <PaginationLinks links={tasks.links} />
            </div>
        </>
    );
}

PendingTasksIndex.layout = {
    breadcrumbs: [{ title: 'Pending Tasks', href: pending() }],
};
