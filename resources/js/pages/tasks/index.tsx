import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    destroy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/TaskController';
import { FormSelect, formSelectValue } from '@/components/form-select';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type {
    Auth,
    OptionUser,
    Paginated,
    ProjectStatus,
    Task,
    TaskProject,
} from '@/types';

type Props = {
    tasks: Paginated<Task>;
    projects: TaskProject[];
    parentTasks: Pick<Task, 'id' | 'project_id' | 'title'>[];
    users: OptionUser[];
    statuses: Pick<ProjectStatus, 'id' | 'name' | 'color'>[];
    priorities: string[];
};

type TaskFormDialogProps = Omit<Props, 'tasks'> & {
    task?: Task;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function dateValue(value?: string | null): string {
    return value?.slice(0, 10) ?? '';
}

function uniqueUsers(users: OptionUser[]): OptionUser[] {
    return Array.from(new Map(users.map((user) => [user.id, user])).values());
}

function TaskFormDialog({
    projects,
    parentTasks,
    users,
    statuses,
    priorities,
    task,
    open,
    onOpenChange,
}: TaskFormDialogProps) {
    const [projectId, setProjectId] = useState(
        formSelectValue(task?.project_id),
    );
    const [parentId, setParentId] = useState(formSelectValue(task?.parent_id));
    const [assigneeId, setAssigneeId] = useState(
        formSelectValue(task?.assignee_id),
    );
    const [statusId, setStatusId] = useState(formSelectValue(task?.status_id));
    const [priority, setPriority] = useState(
        formSelectValue(task?.priority ?? 'medium'),
    );
    const project = projects.find((item) => item.id === projectId);
    const assignees = project
        ? uniqueUsers(project.teams.flatMap((team) => team.members))
        : users;
    const availableParents = parentTasks.filter(
        (item) => item.project_id === projectId && item.id !== task?.id,
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>
                        {task ? 'Edit task' : 'Tambah task'}
                    </DialogTitle>
                    <DialogDescription>
                        Kelola parent task, assignee team, status, dan poin KPI.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...(task ? update.form(task.id) : store.form())}
                    onSuccess={() => onOpenChange(false)}
                    className="grid gap-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="project_id">Project</Label>
                                    <FormSelect
                                        id="project_id"
                                        name="project_id"
                                        value={projectId}
                                        onValueChange={(value) => {
                                            setProjectId(value);
                                            setParentId(formSelectValue());
                                            setAssigneeId(formSelectValue());
                                        }}
                                        placeholder="Pilih project"
                                        options={projects.map((project) => ({
                                            label: `${project.code} - ${project.title}`,
                                            value: project.id,
                                        }))}
                                    />
                                    <InputError message={errors.project_id} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="parent_id">
                                        Parent task
                                    </Label>
                                    <FormSelect
                                        id="parent_id"
                                        name="parent_id"
                                        value={parentId}
                                        onValueChange={setParentId}
                                        placeholder="Tanpa parent"
                                        options={availableParents.map(
                                            (parent) => ({
                                                label: parent.title,
                                                value: parent.id,
                                            }),
                                        )}
                                    />
                                    <InputError message={errors.parent_id} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Judul</Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        defaultValue={task?.title}
                                        required
                                    />
                                    <InputError message={errors.title} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="assignee_id">
                                        Assignee
                                    </Label>
                                    <FormSelect
                                        id="assignee_id"
                                        name="assignee_id"
                                        value={assigneeId}
                                        onValueChange={setAssigneeId}
                                        placeholder="Belum assigned"
                                        options={assignees.map((user) => ({
                                            label: user.name,
                                            value: user.id,
                                        }))}
                                    />
                                    <InputError message={errors.assignee_id} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="status_id">Status</Label>
                                    <FormSelect
                                        id="status_id"
                                        name="status_id"
                                        value={statusId}
                                        onValueChange={setStatusId}
                                        placeholder="Pilih status"
                                        options={statuses.map((status) => ({
                                            label: status.name,
                                            value: String(status.id),
                                        }))}
                                    />
                                    <InputError message={errors.status_id} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <FormSelect
                                        id="priority"
                                        name="priority"
                                        value={priority}
                                        onValueChange={setPriority}
                                        placeholder="Pilih priority"
                                        options={priorities.map((priority) => ({
                                            label: priority,
                                            value: priority,
                                        }))}
                                    />
                                    <InputError message={errors.priority} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="kpi_point">KPI point</Label>
                                    <Input
                                        id="kpi_point"
                                        name="kpi_point"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        defaultValue={task?.kpi_point ?? '0.00'}
                                        required
                                    />
                                    <InputError message={errors.kpi_point} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="completed_at">
                                        Completed at
                                    </Label>
                                    <Input
                                        id="completed_at"
                                        name="completed_at"
                                        type="date"
                                        defaultValue={dateValue(
                                            task?.completed_at,
                                        )}
                                    />
                                    <InputError message={errors.completed_at} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="start_date">
                                        Start date
                                    </Label>
                                    <Input
                                        id="start_date"
                                        name="start_date"
                                        type="date"
                                        defaultValue={dateValue(
                                            task?.start_date,
                                        )}
                                    />
                                    <InputError message={errors.start_date} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="due_date">Due date</Label>
                                    <Input
                                        id="due_date"
                                        name="due_date"
                                        type="date"
                                        defaultValue={dateValue(task?.due_date)}
                                    />
                                    <InputError message={errors.due_date} />
                                </div>
                                <div className="grid gap-2 sm:col-span-2">
                                    <Label htmlFor="description">
                                        Deskripsi
                                    </Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        defaultValue={task?.description ?? ''}
                                        className="min-h-24 rounded-2xl bg-input/50 px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                                    />
                                    <InputError message={errors.description} />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Batal
                                </Button>
                                <Button disabled={processing}>
                                    {task ? 'Simpan' : 'Tambah'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function TasksIndex({
    tasks,
    projects,
    parentTasks,
    users,
    statuses,
    priorities,
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const permissions = new Set(auth.permissions);
    const canCreate = permissions.has('task.create');
    const canUpdate = permissions.has('task.update');
    const canDelete = permissions.has('task.delete');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const kpiTotal = useMemo(
        () =>
            tasks.data
                .reduce((total, task) => total + Number(task.kpi_point), 0)
                .toFixed(2),
        [tasks.data],
    );

    const deleteTask = (task: Task) => {
        if (window.confirm(`Hapus task ${task.title}?`)) {
            router.delete(destroy.url(task.id), { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title="Tasks" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Tasks</h1>
                        <p className="text-sm text-muted-foreground">
                            Kelola task, sub task, assignee, dan KPI point.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-sm text-muted-foreground">
                            KPI visible: {kpiTotal}
                        </div>
                        {canCreate && (
                            <Button onClick={() => setIsCreateOpen(true)}>
                                <Plus />
                                Tambah
                            </Button>
                        )}
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/60 text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        Task
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Project
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Assignee
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        KPI
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Due
                                    </th>
                                    {(canUpdate || canDelete) && (
                                        <th className="w-24 px-4 py-3 text-right font-medium">
                                            Aksi
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.data.map((task) => (
                                    <tr key={task.id} className="border-t">
                                        <td className="px-4 py-3">
                                            <div className="font-medium">
                                                {task.parent ? '↳ ' : ''}
                                                {task.title}
                                            </div>
                                            <div className="text-muted-foreground">
                                                {task.parent?.title ??
                                                    `${task.subtasks?.length ?? 0} sub task`}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {task.project
                                                ? `${task.project.code} - ${task.project.title}`
                                                : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {task.assignee?.name ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="size-3 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            task.status
                                                                ?.color ??
                                                            '#64748b',
                                                    }}
                                                />
                                                {task.status?.name ?? '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {task.kpi_point}
                                        </td>
                                        <td className="px-4 py-3">
                                            {dateValue(task.due_date) || '-'}
                                        </td>
                                        {(canUpdate || canDelete) && (
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    {canUpdate && (
                                                        <Button
                                                            size="icon-sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                setEditingTask(
                                                                    task,
                                                                )
                                                            }
                                                        >
                                                            <Edit />
                                                        </Button>
                                                    )}
                                                    {canDelete && (
                                                        <Button
                                                            size="icon-sm"
                                                            variant="destructive"
                                                            onClick={() =>
                                                                deleteTask(task)
                                                            }
                                                        >
                                                            <Trash2 />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {tasks.links.map((link) => (
                        <Button
                            key={link.label}
                            asChild
                            variant={link.active ? 'default' : 'outline'}
                            size="sm"
                            disabled={!link.url}
                        >
                            <Link
                                href={link.url ?? '#'}
                                preserveScroll
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        </Button>
                    ))}
                </div>
            </div>

            {canCreate && (
                <TaskFormDialog
                    projects={projects}
                    parentTasks={parentTasks}
                    users={users}
                    statuses={statuses}
                    priorities={priorities}
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                />
            )}
            {canUpdate && editingTask && (
                <TaskFormDialog
                    projects={projects}
                    parentTasks={parentTasks}
                    users={users}
                    statuses={statuses}
                    priorities={priorities}
                    task={editingTask}
                    open={!!editingTask}
                    onOpenChange={(open) => !open && setEditingTask(null)}
                />
            )}
        </>
    );
}

TasksIndex.layout = {
    breadcrumbs: [{ title: 'Tasks', href: index() }],
};
