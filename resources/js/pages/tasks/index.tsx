import { Form, Head, router, usePage } from '@inertiajs/react';
import {
    ArrowUpDown,
    ChevronRight,
    Clock,
    Edit,
    Plus,
    Trash2,
} from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';
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

type SortField = 'title' | 'project' | 'status' | 'kpi' | 'due' | 'approved';

type Props = {
    tasks: Paginated<Task>;
    projects: TaskProject[];
    divisions: Option[];
    parentTasks: Pick<Task, 'id' | 'project_id' | 'title'>[];
    users: OptionUser[];
    statuses: Pick<ProjectStatus, 'id' | 'name' | 'slug' | 'color'>[];
    priorities: string[];
    sort: {
        field: SortField | 'created_at';
        direction: 'asc' | 'desc';
    };
};

type TaskFormDialogProps = Omit<Props, 'tasks' | 'sort'> & {
    task?: Task;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function dateValue(value?: string | null): string {
    return value?.slice(0, 10) ?? '';
}

function isDoneTask(task: Task): boolean {
    return task.status?.slug === 'done';
}

function isOverdueTask(task: Task): boolean {
    const dueDate = dateValue(task.due_date);

    return (
        !!dueDate &&
        dueDate < new Date().toISOString().slice(0, 10) &&
        !isDoneTask(task)
    );
}

function projectFromTask(task: Task): Task['project'] {
    return task.project ?? null;
}

function uniqueUsers(users: OptionUser[]): OptionUser[] {
    return Array.from(new Map(users.map((user) => [user.id, user])).values());
}

function ProjectDetailDialog({
    project,
    open,
    onOpenChange,
}: {
    project: Task['project'];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {project ? `${project.code} - ${project.title}` : '-'}
                    </DialogTitle>
                    <DialogDescription>
                        Detail singkat project dari task yang dipilih.
                    </DialogDescription>
                </DialogHeader>

                {project && (
                    <div className="grid gap-4 text-sm">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <div className="text-xs font-medium text-graphite uppercase">
                                    Divisi
                                </div>
                                <div className="text-ink">
                                    {project.division?.name ?? '-'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-graphite uppercase">
                                    Owner
                                </div>
                                <div className="text-ink">
                                    {project.owner?.name ?? '-'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-graphite uppercase">
                                    Status
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-sm bg-fog px-2 py-1 text-ink">
                                    <span
                                        className="size-2 rounded-full"
                                        style={{
                                            backgroundColor:
                                                project.status?.color ??
                                                '#64748b',
                                        }}
                                    />
                                    {project.status?.name ?? '-'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-graphite uppercase">
                                    Priority
                                </div>
                                <div className="text-ink">
                                    {project.priority ?? '-'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-graphite uppercase">
                                    Start / End
                                </div>
                                <div className="text-ink">
                                    {dateValue(project.start_date) || '-'} -{' '}
                                    {dateValue(project.end_date) || '-'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-graphite uppercase">
                                    Deadline
                                </div>
                                <div className="text-ink">
                                    {dateValue(project.expected_deadline) ||
                                        '-'}
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="text-xs font-medium text-graphite uppercase">
                                Deskripsi
                            </div>
                            <div className="mt-1 whitespace-pre-line text-ink">
                                {project.description || '-'}
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function SortHeader({
    label,
    field,
    sort,
    onSort,
    align = 'left',
}: {
    label: string;
    field: SortField;
    sort: Props['sort'];
    onSort: (field: SortField) => void;
    align?: 'left' | 'right';
}) {
    const active = sort.field === field;

    return (
        <button
            type="button"
            onClick={() => onSort(field)}
            className={`inline-flex items-center gap-1.5 text-xs font-medium tracking-[0.12em] text-graphite uppercase transition hover:text-ink ${
                align === 'right' ? 'justify-end' : ''
            }`}
        >
            {label}
            <ArrowUpDown
                className={`size-3.5 ${active ? 'text-ink' : 'text-graphite/60'}`}
            />
            {active && (
                <span className="sr-only">
                    sorted{' '}
                    {sort.direction === 'asc' ? 'ascending' : 'descending'}
                </span>
            )}
        </button>
    );
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
    sort,
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const permissions = new Set(auth.permissions);
    const canCreate = permissions.has('task.create');
    const canUpdate = permissions.has('task.update');
    const canUpdateDivision = permissions.has('task.update_division');
    const canDelete = permissions.has('task.delete');
    const canViewAll = permissions.has('task.view_all');
    const isStaffView =
        auth.roles.includes('staff') && !canViewAll && !canUpdateDivision;
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(
        () => new Set(),
    );
    const [selectedProject, setSelectedProject] =
        useState<Task['project']>(null);
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

    const sortBy = (field: SortField) => {
        const nextDirection =
            sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc';

        router.get(
            index.url(),
            {
                sort: field,
                direction: nextDirection,
            },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const canEditTask = (task: Task) => {
        if (!canUpdate) {
            return false;
        }

        if (canViewAll || canUpdateDivision) {
            return true;
        }

        return task.assignee_id === auth.user.id;
    };

    const visibleTaskIds = useMemo(
        () => new Set(tasks.data.map((task) => task.id)),
        [tasks.data],
    );
    const childTasksByParent = useMemo(() => {
        const grouped = new Map<string, Task[]>();

        tasks.data.forEach((task) => {
            if (!task.parent_id) {
                return;
            }

            grouped.set(task.parent_id, [
                ...(grouped.get(task.parent_id) ?? []),
                task,
            ]);
        });

        return grouped;
    }, [tasks.data]);
    const tableTasks = useMemo(
        () =>
            tasks.data.filter(
                (task) =>
                    !task.parent_id || !visibleTaskIds.has(task.parent_id),
            ),
        [tasks.data, visibleTaskIds],
    );

    const childTasksFor = (task: Task) => {
        const childrenFromPage = childTasksByParent.get(task.id);

        return childrenFromPage && childrenFromPage.length > 0
            ? childrenFromPage
            : (task.subtasks ?? []);
    };

    const toggleTask = (taskId: string) => {
        setExpandedTaskIds((current) => {
            const next = new Set(current);

            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }

            return next;
        });
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
                            <thead className="bg-fog text-left">
                                <tr>
                                    <th className="px-5 py-4">
                                        <SortHeader
                                            label="Task"
                                            field="title"
                                            sort={sort}
                                            onSort={sortBy}
                                        />
                                    </th>
                                    <th className="px-5 py-4">
                                        <SortHeader
                                            label="Project"
                                            field="project"
                                            sort={sort}
                                            onSort={sortBy}
                                        />
                                    </th>
                                    {!isStaffView && (
                                        <th className="px-5 py-4 text-xs font-medium tracking-[0.12em] text-graphite uppercase">
                                            Divisi / PIC
                                        </th>
                                    )}
                                    <th className="px-5 py-4">
                                        <SortHeader
                                            label="Status"
                                            field="status"
                                            sort={sort}
                                            onSort={sortBy}
                                        />
                                    </th>
                                    <th className="px-5 py-4">
                                        <SortHeader
                                            label="KPI"
                                            field="kpi"
                                            sort={sort}
                                            onSort={sortBy}
                                        />
                                    </th>
                                    <th className="px-5 py-4">
                                        <SortHeader
                                            label="Due"
                                            field="due"
                                            sort={sort}
                                            onSort={sortBy}
                                        />
                                    </th>
                                    <th className="px-5 py-4">
                                        <SortHeader
                                            label="Approved"
                                            field="approved"
                                            sort={sort}
                                            onSort={sortBy}
                                        />
                                    </th>
                                    {(canUpdate || canDelete) && (
                                        <th className="w-24 px-5 py-4 text-right font-medium">
                                            Aksi
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {tableTasks.map((task) => {
                                    const overdue = isOverdueTask(task);
                                    const editable = canEditTask(task);
                                    const children = childTasksFor(task);
                                    const expanded = expandedTaskIds.has(
                                        task.id,
                                    );

                                    return (
                                        <Fragment key={task.id}>
                                            <tr
                                                className={`border-t border-border/70 transition hover:bg-fog/70 ${
                                                    overdue
                                                        ? 'bg-red-50/70'
                                                        : ''
                                                }`}
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-start gap-2">
                                                        {children.length > 0 ? (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    toggleTask(
                                                                        task.id,
                                                                    )
                                                                }
                                                                className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm border border-border bg-white text-graphite transition hover:bg-fog hover:text-ink"
                                                                aria-label={
                                                                    expanded
                                                                        ? 'Tutup subtasks'
                                                                        : 'Buka subtasks'
                                                                }
                                                            >
                                                                <ChevronRight
                                                                    className={`size-4 transition ${
                                                                        expanded
                                                                            ? 'rotate-90'
                                                                            : ''
                                                                    }`}
                                                                />
                                                            </button>
                                                        ) : (
                                                            <span className="size-6 shrink-0" />
                                                        )}
                                                        <div>
                                                            <div className="font-medium text-ink">
                                                                {task.title}
                                                            </div>
                                                            <div className="text-graphite">
                                                                {children.length >
                                                                0
                                                                    ? `${children.length} sub task`
                                                                    : task.parent
                                                                      ? `Child dari ${task.parent.title}`
                                                                      : 'Tidak ada sub task'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {task.project ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedProject(
                                                                    projectFromTask(
                                                                        task,
                                                                    ),
                                                                )
                                                            }
                                                            className="font-medium text-pulse-green underline-offset-4 transition hover:underline"
                                                        >
                                                            {task.project.code}
                                                        </button>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                {!isStaffView && (
                                                    <td className="px-5 py-4">
                                                        <div>
                                                            {task.division
                                                                ?.name ?? '-'}
                                                        </div>
                                                        <div className="text-graphite">
                                                            {task.assignee
                                                                ?.name ?? '-'}
                                                        </div>
                                                    </td>
                                                )}
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
                                                        {task.status?.name ??
                                                            '-'}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {task.kpi_point}
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
                                                    {dateValue(
                                                        task.approved_at,
                                                    ) || '-'}
                                                </td>
                                                {(canUpdate || canDelete) && (
                                                    <td className="px-5 py-4">
                                                        <div className="flex justify-end gap-2">
                                                            {editable && (
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
                                                                        deleteTask(
                                                                            task,
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                            {expanded &&
                                                children.map((childTask) => {
                                                    const childOverdue =
                                                        isOverdueTask(
                                                            childTask,
                                                        );
                                                    const childEditable =
                                                        canEditTask(childTask);

                                                    return (
                                                        <tr
                                                            key={childTask.id}
                                                            className={`border-t border-border/50 bg-smoke-50/70 transition hover:bg-fog ${
                                                                childOverdue
                                                                    ? 'bg-red-50/70'
                                                                    : ''
                                                            }`}
                                                        >
                                                            <td className="px-5 py-3 pl-16">
                                                                <div className="font-medium text-ink">
                                                                    {
                                                                        childTask.title
                                                                    }
                                                                </div>
                                                                <div className="text-xs text-graphite">
                                                                    Sub task
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3">
                                                                {childTask.project ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setSelectedProject(
                                                                                projectFromTask(
                                                                                    childTask,
                                                                                ),
                                                                            )
                                                                        }
                                                                        className="font-medium text-pulse-green underline-offset-4 transition hover:underline"
                                                                    >
                                                                        {
                                                                            childTask
                                                                                .project
                                                                                .code
                                                                        }
                                                                    </button>
                                                                ) : (
                                                                    '-'
                                                                )}
                                                            </td>
                                                            {!isStaffView && (
                                                                <td className="px-5 py-3">
                                                                    <div>
                                                                        {childTask
                                                                            .division
                                                                            ?.name ??
                                                                            '-'}
                                                                    </div>
                                                                    <div className="text-graphite">
                                                                        {childTask
                                                                            .assignee
                                                                            ?.name ??
                                                                            '-'}
                                                                    </div>
                                                                </td>
                                                            )}
                                                            <td className="px-5 py-3">
                                                                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1">
                                                                    <span
                                                                        className="size-2.5 rounded-full"
                                                                        style={{
                                                                            backgroundColor:
                                                                                childTask
                                                                                    .status
                                                                                    ?.color ??
                                                                                '#64748b',
                                                                        }}
                                                                    />
                                                                    {childTask
                                                                        .status
                                                                        ?.name ??
                                                                        '-'}
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3">
                                                                {
                                                                    childTask.kpi_point
                                                                }
                                                            </td>
                                                            <td className="px-5 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    {childOverdue && (
                                                                        <Clock className="size-4 text-red-600" />
                                                                    )}
                                                                    <span
                                                                        className={
                                                                            childOverdue
                                                                                ? 'font-medium text-red-700'
                                                                                : ''
                                                                        }
                                                                    >
                                                                        {dateValue(
                                                                            childTask.due_date,
                                                                        ) ||
                                                                            '-'}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3">
                                                                {dateValue(
                                                                    childTask.approved_at,
                                                                ) || '-'}
                                                            </td>
                                                            {(canUpdate ||
                                                                canDelete) && (
                                                                <td className="px-5 py-3">
                                                                    <div className="flex justify-end gap-2">
                                                                        {childEditable && (
                                                                            <Button
                                                                                size="icon-sm"
                                                                                variant="outline"
                                                                                onClick={() =>
                                                                                    setEditingTask(
                                                                                        childTask,
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
                                                                                    deleteTask(
                                                                                        childTask,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <Trash2 />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    );
                                                })}
                                        </Fragment>
                                    );
                                })}
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
            <ProjectDetailDialog
                project={selectedProject}
                open={!!selectedProject}
                onOpenChange={(open) => !open && setSelectedProject(null)}
            />
        </>
    );
}

TasksIndex.layout = {
    breadcrumbs: [{ title: 'Tasks', href: index() }],
};
