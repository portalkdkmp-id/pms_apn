import { Form, Head, router, usePage } from '@inertiajs/react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    destroy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/TaskController';
import {
    EmptyTableState,
    PageHeader,
    PaginationLinks,
    TableCard,
} from '@/components/app-page';
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
    Option,
    OptionUser,
    Paginated,
    ProjectStatus,
    Task,
    TaskProject,
} from '@/types';

type Props = {
    tasks: Paginated<Task>;
    projects: TaskProject[];
    divisions: Option[];
    parentTasks: Pick<Task, 'id' | 'project_id' | 'title'>[];
    users: OptionUser[];
    statuses: Pick<ProjectStatus, 'id' | 'name' | 'slug' | 'color'>[];
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
    divisions,
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
    const [divisionId, setDivisionId] = useState(
        formSelectValue(task?.division_id),
    );
    const [assigneeId, setAssigneeId] = useState(
        formSelectValue(task?.assignee_id),
    );
    const [statusId, setStatusId] = useState(formSelectValue(task?.status_id));
    const [priority, setPriority] = useState(
        formSelectValue(task?.priority ?? 'medium'),
    );
    const [requiresPrevious, setRequiresPrevious] = useState(
        task?.requires_previous_task_done ?? false,
    );
    const [previousTaskId, setPreviousTaskId] = useState(
        formSelectValue(task?.previous_task_id),
    );
    const assignees = uniqueUsers(
        users.filter(
            (user) =>
                divisionId === formSelectValue() ||
                user.division_id === divisionId,
        ),
    );
    const availableParents = parentTasks.filter(
        (item) => item.project_id === projectId && item.id !== task?.id,
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>
                        {task ? 'Edit task' : 'Tambah task'}
                    </DialogTitle>
                    <DialogDescription>
                        Pilih project dan PIC dulu, lalu lengkapi KPI dan
                        tanggal kerja.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...(task ? update.form(task.id) : store.form())}
                    encType="multipart/form-data"
                    onSuccess={() => onOpenChange(false)}
                    className="grid gap-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-4 rounded-sm border border-border bg-smoke-50 p-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <div className="text-sm font-medium text-ink">
                                        Alur pekerjaan
                                    </div>
                                    <p className="text-xs text-graphite">
                                        Hubungkan task ke project agar progres
                                        dan KPI ikut terbaca.
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="project_id">Project</Label>
                                    <FormSelect
                                        id="project_id"
                                        name="project_id"
                                        value={projectId}
                                        onValueChange={(value) => {
                                            setProjectId(value);
                                            const nextProject = projects.find(
                                                (item) => item.id === value,
                                            );
                                            setDivisionId(
                                                formSelectValue(
                                                    nextProject?.division_id,
                                                ),
                                            );
                                            setParentId(formSelectValue());
                                            setPreviousTaskId(
                                                formSelectValue(),
                                            );
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
                                    <Label htmlFor="division_id">Divisi</Label>
                                    <FormSelect
                                        id="division_id"
                                        name="division_id"
                                        value={divisionId}
                                        onValueChange={(value) => {
                                            setDivisionId(value);
                                            setAssigneeId(formSelectValue());
                                        }}
                                        placeholder="Pilih divisi"
                                        options={divisions.map((division) => ({
                                            label: division.name,
                                            value: division.id,
                                        }))}
                                    />
                                    <InputError message={errors.division_id} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="assignee_id">PIC</Label>
                                    <FormSelect
                                        id="assignee_id"
                                        name="assignee_id"
                                        value={assigneeId}
                                        onValueChange={setAssigneeId}
                                        placeholder="Belum ada PIC"
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
                            </div>

                            <div className="grid gap-4 rounded-sm border border-border bg-smoke-50 p-4 sm:grid-cols-3">
                                <div className="sm:col-span-3">
                                    <div className="text-sm font-medium text-ink">
                                        Timeline
                                    </div>
                                    <p className="text-xs text-graphite">
                                        Gunakan tanggal penting saja supaya
                                        daftar task tetap mudah dibaca.
                                    </p>
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
                            </div>

                            <div className="grid gap-4 rounded-sm border border-border bg-smoke-50 p-4">
                                <div>
                                    <div className="text-sm font-medium text-ink">
                                        Detail tambahan
                                    </div>
                                    <p className="text-xs text-graphite">
                                        Dependensi dan attachment hanya diisi
                                        saat dibutuhkan.
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">
                                        Deskripsi
                                    </Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        defaultValue={task?.description ?? ''}
                                        className="min-h-24"
                                    />
                                    <InputError message={errors.description} />
                                </div>
                                <div className="grid gap-3 rounded-sm border border-border bg-white p-3">
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="hidden"
                                            name="requires_previous_task_done"
                                            value="0"
                                        />
                                        <input
                                            id="requires_previous_task_done"
                                            name="requires_previous_task_done"
                                            type="checkbox"
                                            value="1"
                                            checked={requiresPrevious}
                                            onChange={(event) =>
                                                setRequiresPrevious(
                                                    event.target.checked,
                                                )
                                            }
                                            className="mt-1 size-4 accent-ember-orange"
                                        />
                                        <div className="grid flex-1 gap-2">
                                            <Label htmlFor="requires_previous_task_done">
                                                Task ini menunggu task
                                                sebelumnya Done
                                            </Label>
                                            <FormSelect
                                                id="previous_task_id"
                                                name="previous_task_id"
                                                value={previousTaskId}
                                                onValueChange={
                                                    setPreviousTaskId
                                                }
                                                placeholder="Pilih previous task"
                                                disabled={!requiresPrevious}
                                                options={availableParents.map(
                                                    (parent) => ({
                                                        label: parent.title,
                                                        value: parent.id,
                                                    }),
                                                )}
                                            />
                                            <InputError
                                                message={
                                                    errors.previous_task_id
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="attachments">
                                        Upload dokumen / file / image
                                    </Label>
                                    <Input
                                        id="attachments"
                                        name="attachments[]"
                                        type="file"
                                        multiple
                                    />
                                    <InputError message={errors.attachments} />
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
    divisions,
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

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto bg-fog p-4 md:p-6">
                <PageHeader
                    eyebrow="Daily execution"
                    title="Tasks"
                    description="Pantau pekerjaan berdasarkan project, PIC, status, due date, dan KPI point yang sedang berjalan."
                    meta={
                        <>
                            <span>{tasks.data.length} task tampil</span>
                            <span>KPI visible: {kpiTotal}</span>
                            <span>{projects.length} project</span>
                        </>
                    }
                    actions={
                        canCreate && (
                            <Button onClick={() => setIsCreateOpen(true)}>
                                <Plus />
                                Task baru
                            </Button>
                        )
                    }
                />

                <TableCard>
                    {tasks.data.length === 0 ? (
                        <EmptyTableState
                            title="Belum ada task"
                            description="Tambahkan task dari project agar pekerjaan bisa ditugaskan dan dipantau."
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
                                        Status
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        KPI
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Due
                                    </th>
                                    {(canUpdate || canDelete) && (
                                        <th className="w-24 px-5 py-4 text-right font-medium">
                                            Aksi
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.data.map((task) => (
                                    <tr
                                        key={task.id}
                                        className="border-t border-border/70 transition hover:bg-fog/70"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="font-medium text-ink">
                                                {task.parent ? '↳ ' : ''}
                                                {task.title}
                                            </div>
                                            <div className="text-graphite">
                                                {task.parent?.title ??
                                                    `${task.subtasks?.length ?? 0} sub task`}
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
                                            <div className="inline-flex items-center gap-2 rounded-full bg-fog px-3 py-1">
                                                <span
                                                    className="size-2.5 rounded-full"
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
                                        <td className="px-5 py-4">
                                            {task.kpi_point}
                                        </td>
                                        <td className="px-5 py-4">
                                            {dateValue(task.due_date) || '-'}
                                        </td>
                                        {(canUpdate || canDelete) && (
                                            <td className="px-5 py-4">
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
                    )}
                </TableCard>

                <PaginationLinks links={tasks.links} />
            </div>

            {canCreate && (
                <TaskFormDialog
                    projects={projects}
                    divisions={divisions}
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
                    divisions={divisions}
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
