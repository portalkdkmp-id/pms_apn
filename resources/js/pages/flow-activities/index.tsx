import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import {
    Background,
    Controls,
    MarkerType,
    MiniMap,
    ReactFlow,
    ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Edge, Node } from '@xyflow/react';
import {
    Edit,
    GitBranch,
    MoreVertical,
    Plus,
    Redo2,
    Save,
    Search,
    Table2,
    Trash2,
    Undo2,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    destroy as destroyProject,
    store as storeProject,
    update as updateProject,
} from '@/actions/App/Http/Controllers/ProjectController';
import {
    destroy as destroyTask,
    store as storeTask,
    update as updateTask,
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
import {
    flow2 as flowActivitiesFlow2,
    index as flowActivitiesIndex,
    timeline as flowActivitiesTimeline,
} from '@/routes/flow-activities';
import type {
    Auth,
    Option,
    OptionProject,
    OptionUser,
    Project,
    ProjectStatus,
    Task,
} from '@/types';

type FlowTask = Omit<Task, 'subtasks'> & {
    subtasks?: FlowTask[];
};

type FlowProject = Project & {
    tasks: FlowTask[];
};

type Props = {
    mode: 'flow' | 'flow2' | 'timeline';
    projects: FlowProject[];
    allProjects: Array<
        OptionProject & { parent_id: string | null; division_id: string }
    >;
    parentTasks: Pick<Task, 'id' | 'project_id' | 'title'>[];
    divisions: Option[];
    users: OptionUser[];
    statuses: Pick<ProjectStatus, 'id' | 'name' | 'color'>[];
    priorities: string[];
};

type SelectedNode =
    | { type: 'project'; item: FlowProject }
    | { type: 'task'; item: FlowTask };

function dateValue(value?: string | null): string {
    return value?.slice(0, 10) ?? '';
}

function formatDate(value?: string | null): string {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));
}

function findTask(projects: FlowProject[], id: string): FlowTask | null {
    const findNestedTask = (tasks: FlowTask[]): FlowTask | null => {
        for (const task of tasks) {
            if (task.id === id) {
                return task;
            }

            const nested = findNestedTask(task.subtasks ?? []);

            if (nested) {
                return nested;
            }
        }

        return null;
    };

    for (const project of projects) {
        const task = findNestedTask(project.tasks);

        if (task) {
            return task;
        }
    }

    return null;
}

function flattenTasks(tasks: FlowTask[]): FlowTask[] {
    return tasks.flatMap((task) => [
        task,
        ...flattenTasks(task.subtasks ?? []),
    ]);
}

function flattenTasksWithDepth(
    tasks: FlowTask[],
    depth = 0,
): Array<{ task: FlowTask; depth: number }> {
    return tasks.flatMap((task) => [
        { task, depth },
        ...flattenTasksWithDepth(task.subtasks ?? [], depth + 1),
    ]);
}

function FlowNodeLabel({
    title,
    meta,
    color,
    kind = 'Task',
}: {
    title: string;
    meta: string;
    color?: string;
    kind?: string;
}) {
    return (
        <div className="max-w-64 min-w-56 rounded-sm border border-slate-200 bg-white text-left shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
            <div className="border-b border-slate-100 px-3 py-2">
                <span className="rounded-sm bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
                    {kind}
                </span>
                <div className="mt-1 truncate text-sm font-semibold text-slate-700">
                    {title}
                </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500">
                <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: color ?? '#10b981' }}
                />
                <span className="truncate">{meta}</span>
            </div>
        </div>
    );
}

function ProjectTableLabel({
    project,
    onSelectTask,
}: {
    project: FlowProject;
    onSelectTask: (task: FlowTask) => void;
}) {
    const tasks = flattenTasksWithDepth(project.tasks);
    const accentColor = project.status?.color ?? '#10b981';

    return (
        <div className="w-72 overflow-hidden rounded-md border border-slate-200 bg-white text-left text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.12)]">
            <div
                className="h-1.5"
                style={{ backgroundColor: accentColor }}
            />
            <div className="border-b border-slate-100 bg-slate-50/90 px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase text-emerald-700">
                            <Table2 className="size-3" />
                            {project.parent_id ? 'Sub Project' : 'Project'}
                        </div>
                        <div className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-slate-800">
                            {project.title}
                        </div>
                    </div>
                    <MoreVertical className="mt-0.5 size-4 shrink-0 text-slate-400" />
                </div>
                <div className="mt-1 truncate text-[11px] text-slate-500">
                    {project.code} · {project.division?.name ?? '-'}
                </div>
            </div>
            <div className="divide-y divide-slate-100">
                {tasks.length === 0 ? (
                    <div className="px-3 py-3 text-xs text-slate-400">
                        Belum ada task
                    </div>
                ) : (
                    tasks.map(({ task, depth }) => (
                        <button
                            key={task.id}
                            type="button"
                            className="nodrag nopan grid w-full grid-cols-[1fr_auto] items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-emerald-50/70"
                            style={{ paddingLeft: `${12 + depth * 18}px` }}
                            onClick={(event) => {
                                event.stopPropagation();
                                onSelectTask(task);
                            }}
                            onMouseDown={(event) => event.stopPropagation()}
                        >
                            <span className="min-w-0">
                                <span className="block truncate font-medium text-slate-700">
                                    {depth > 0 ? 'Sub task' : 'Task'} ·{' '}
                                    {task.title}
                                </span>
                                <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                                    PIC {task.assignee?.name ?? '-'} · due{' '}
                                    {formatDate(task.due_date)}
                                </span>
                            </span>
                            <span
                                className="size-2.5 rounded-full"
                                style={{
                                    backgroundColor:
                                        task.status?.color ?? '#10b981',
                                }}
                            />
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}

function buildFlow(projects: FlowProject[]): {
    nodes: Node[];
    edges: Edge[];
} {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const edgeStyle = { stroke: '#10b981', strokeWidth: 2 };
    const markerEnd = { type: MarkerType.ArrowClosed, color: '#10b981' };
    let y = 0;

    const appendTask = (
        task: FlowTask,
        project: FlowProject,
        sourceId: string,
        x: number,
        yPosition: number,
        level = 0,
    ): number => {
        const nodeId = `task:${task.id}`;

        nodes.push({
            id: nodeId,
            position: { x, y: yPosition },
            data: {
                label: (
                    <FlowNodeLabel
                        title={task.title}
                        meta={`${task.division?.name ?? project.division?.name ?? '-'} · due ${formatDate(task.due_date)}`}
                        color={task.status?.color}
                        kind={level > 0 ? 'Sub Task' : 'Task'}
                    />
                ),
            },
            className: 'activity-flow-node',
            style: {
                background: 'transparent',
                border: 'none',
                padding: 0,
                width: 'auto',
            },
        });
        edges.push({
            id: `${sourceId}:${nodeId}`,
            source: sourceId,
            target: nodeId,
            type: 'smoothstep',
            markerEnd,
            style: edgeStyle,
        });

        let nextY = yPosition;

        task.subtasks?.forEach((subtask, index) => {
            nextY = appendTask(
                subtask,
                project,
                nodeId,
                x + 330,
                nextY + (index === 0 ? 0 : 115),
                level + 1,
            );
        });

        return Math.max(nextY, yPosition);
    };

    projects.forEach((project) => {
        const projectY = y;
        const projectNodeId = `project:${project.id}`;

        nodes.push({
            id: projectNodeId,
            position: { x: project.parent_id ? 380 : 40, y: projectY },
            data: {
                label: (
                    <FlowNodeLabel
                        title={project.title}
                        meta={`${project.code} · ${project.division?.name ?? '-'}`}
                        color={project.status?.color}
                        kind={
                            project.parent_id ? 'Sub Project' : 'Main Project'
                        }
                    />
                ),
            },
            className: 'activity-flow-node',
            style: {
                background: 'transparent',
                border: 'none',
                padding: 0,
                width: 'auto',
            },
        });

        if (project.parent_id) {
            edges.push({
                id: `project-edge:${project.parent_id}:${project.id}`,
                source: `project:${project.parent_id}`,
                target: projectNodeId,
                type: 'smoothstep',
                markerEnd,
                style: edgeStyle,
            });
        }

        let maxY = projectY;

        project.tasks.forEach((task, taskIndex) => {
            maxY = Math.max(
                maxY,
                appendTask(
                    task,
                    project,
                    projectNodeId,
                    project.parent_id ? 720 : 380,
                    projectY + taskIndex * 150,
                ),
            );
        });

        y = maxY + 190;
    });

    return { nodes, edges };
}

function buildTableFlow(
    projects: FlowProject[],
    onSelectTask: (task: FlowTask) => void,
): {
    nodes: Node[];
    edges: Edge[];
} {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const markerEnd = { type: MarkerType.ArrowClosed, color: '#94a3b8' };
    const edgeStyle = { stroke: '#cbd5e1', strokeWidth: 2 };
    const projectsByParent = projects.reduce<Record<string, FlowProject[]>>(
        (groups, project) => {
            const key = project.parent_id ?? 'root';
            groups[key] = [...(groups[key] ?? []), project];

            return groups;
        },
        {},
    );
    const estimateHeight = (project: FlowProject) =>
        Math.max(170, 96 + flattenTasks(project.tasks).length * 48);
    let rootY = 70;

    const appendProject = (
        project: FlowProject,
        depth: number,
        yPosition: number,
    ): number => {
        const nodeId = `project:${project.id}`;

        nodes.push({
            id: nodeId,
            position: { x: 80 + depth * 390, y: yPosition },
            data: {
                label: (
                    <ProjectTableLabel
                        project={project}
                        onSelectTask={onSelectTask}
                    />
                ),
            },
            className: 'activity-flow-node',
            style: {
                background: 'transparent',
                border: 'none',
                padding: 0,
                width: 'auto',
            },
        });

        const children = projectsByParent[project.id] ?? [];
        let childY = yPosition - Math.max(0, children.length - 1) * 120;

        children.forEach((child) => {
            edges.push({
                id: `table-project-edge:${project.id}:${child.id}`,
                source: nodeId,
                target: `project:${child.id}`,
                type: 'smoothstep',
                markerEnd,
                style: edgeStyle,
            });

            childY = appendProject(child, depth + 1, Math.max(40, childY));
        });

        return Math.max(
            yPosition + estimateHeight(project) + 90,
            childY + 40,
        );
    };

    (projectsByParent.root ?? []).forEach((project) => {
        rootY = appendProject(project, 0, rootY);
    });

    return { nodes, edges };
}

function ProjectDialog({
    open,
    onOpenChange,
    project,
    allProjects,
    divisions,
    users,
    statuses,
    priorities,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project?: FlowProject;
    allProjects: Props['allProjects'];
    divisions: Option[];
    users: OptionUser[];
    statuses: Pick<ProjectStatus, 'id' | 'name' | 'color'>[];
    priorities: string[];
}) {
    'use no memo';

    const [parentId, setParentId] = useState(
        formSelectValue(project?.parent_id),
    );
    const [divisionId, setDivisionId] = useState(
        formSelectValue(project?.division_id),
    );
    const [ownerId, setOwnerId] = useState(formSelectValue(project?.owner_id));
    const [statusId, setStatusId] = useState(
        formSelectValue(project?.status_id),
    );
    const [priority, setPriority] = useState(
        formSelectValue(project?.priority ?? 'medium'),
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        {project ? 'Edit project' : 'Tambah project'}
                    </DialogTitle>
                    <DialogDescription>
                        Kelola project atau sub-project dari diagram aktivitas.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    {...(project
                        ? updateProject.form(project.id)
                        : storeProject.form())}
                    onSuccess={() => onOpenChange(false)}
                    className="grid gap-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="code">Kode</Label>
                                    <Input
                                        id="code"
                                        name="code"
                                        defaultValue={project?.code}
                                        required
                                    />
                                    <InputError message={errors.code} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Judul</Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        defaultValue={project?.title}
                                        required
                                    />
                                    <InputError message={errors.title} />
                                </div>
                                <div className="grid gap-2 sm:col-span-2">
                                    <Label htmlFor="parent_id">
                                        Parent project
                                    </Label>
                                    <FormSelect
                                        id="parent_id"
                                        name="parent_id"
                                        value={parentId}
                                        onValueChange={setParentId}
                                        placeholder="Tanpa parent project"
                                        options={allProjects
                                            .filter(
                                                (item) =>
                                                    item.id !== project?.id,
                                            )
                                            .map((item) => ({
                                                label: `${item.code} - ${item.title}`,
                                                value: item.id,
                                            }))}
                                    />
                                    <InputError message={errors.parent_id} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="division_id">Divisi</Label>
                                    <FormSelect
                                        id="division_id"
                                        name="division_id"
                                        value={divisionId}
                                        onValueChange={setDivisionId}
                                        placeholder="Pilih divisi"
                                        options={divisions.map((division) => ({
                                            label: division.name,
                                            value: division.id,
                                        }))}
                                    />
                                    <InputError message={errors.division_id} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="owner_id">Owner</Label>
                                    <FormSelect
                                        id="owner_id"
                                        name="owner_id"
                                        value={ownerId}
                                        onValueChange={setOwnerId}
                                        placeholder="Pilih owner"
                                        options={users.map((user) => ({
                                            label: user.name,
                                            value: user.id,
                                        }))}
                                    />
                                    <InputError message={errors.owner_id} />
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
                                        options={priorities.map((item) => ({
                                            label: item,
                                            value: item,
                                        }))}
                                    />
                                    <InputError message={errors.priority} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="kpi_target">
                                        KPI target
                                    </Label>
                                    <Input
                                        id="kpi_target"
                                        name="kpi_target"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        defaultValue={project?.kpi_target ?? ''}
                                    />
                                    <InputError message={errors.kpi_target} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="expected_deadline">
                                        Deadline
                                    </Label>
                                    <Input
                                        id="expected_deadline"
                                        name="expected_deadline"
                                        type="date"
                                        defaultValue={dateValue(
                                            project?.expected_deadline,
                                        )}
                                    />
                                    <InputError
                                        message={errors.expected_deadline}
                                    />
                                </div>
                                <div className="grid gap-2 sm:col-span-2">
                                    <Label htmlFor="description">
                                        Deskripsi
                                    </Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        defaultValue={
                                            project?.description ?? ''
                                        }
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
                                <Button disabled={processing}>Simpan</Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function TaskDialog({
    open,
    onOpenChange,
    task,
    allProjects,
    parentTasks,
    divisions,
    users,
    statuses,
    priorities,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task?: FlowTask;
    allProjects: Props['allProjects'];
    parentTasks: Props['parentTasks'];
    divisions: Option[];
    users: OptionUser[];
    statuses: Pick<ProjectStatus, 'id' | 'name' | 'color'>[];
    priorities: string[];
}) {
    'use no memo';

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
    const assignees = users.filter(
        (user) =>
            divisionId === formSelectValue() || user.division_id === divisionId,
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        {task ? 'Edit task' : 'Tambah task'}
                    </DialogTitle>
                    <DialogDescription>
                        Kelola task atau sub task dari diagram aktivitas.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    {...(task ? updateTask.form(task.id) : storeTask.form())}
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
                                            setDivisionId(
                                                formSelectValue(
                                                    allProjects.find(
                                                        (item) =>
                                                            item.id === value,
                                                    )?.division_id,
                                                ),
                                            );
                                        }}
                                        placeholder="Pilih project"
                                        options={allProjects.map((project) => ({
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
                                        placeholder="Tanpa parent task"
                                        options={parentTasks
                                            .filter(
                                                (item) =>
                                                    item.project_id ===
                                                        projectId &&
                                                    item.id !== task?.id,
                                            )
                                            .map((item) => ({
                                                label: item.title,
                                                value: item.id,
                                            }))}
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
                                        options={priorities.map((item) => ({
                                            label: item,
                                            value: item,
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
                                <Button disabled={processing}>Simpan</Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function FlowActivities({
    mode,
    projects,
    allProjects,
    parentTasks,
    divisions,
    users,
    statuses,
    priorities,
}: Props) {
    'use no memo';

    const { auth } = usePage<{ auth: Auth }>().props;
    const permissions = new Set(auth.permissions);
    const canCreateProject = permissions.has('project.create');
    const canUpdateProject = permissions.has('project.update');
    const canDeleteProject = permissions.has('project.delete');
    const canCreateTask = permissions.has('task.create');
    const canUpdateTask = permissions.has('task.update');
    const canDeleteTask = permissions.has('task.delete');
    const [projectDialogOpen, setProjectDialogOpen] = useState(false);
    const [taskDialogOpen, setTaskDialogOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<
        FlowProject | undefined
    >();
    const [editingTask, setEditingTask] = useState<FlowTask | undefined>();
    const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
    const { nodes, edges } = useMemo(() => buildFlow(projects), [projects]);
    const { nodes: tableNodes, edges: tableEdges } = useMemo(
        () =>
            buildTableFlow(projects, (task) =>
                setSelectedNode({ type: 'task', item: task }),
            ),
        [projects],
    );
    const timelineItems = useMemo(
        () =>
            projects
                .flatMap((project) => [
                    {
                        key: `project-${project.id}`,
                        type: 'Project',
                        title: project.title,
                        date: project.expected_deadline,
                        meta: `${project.code} · ${project.division?.name ?? '-'}`,
                    },
                    ...flattenTasks(project.tasks).map((task) => ({
                        key: `task-${task.id}`,
                        type: task.parent_id ? 'Sub task' : 'Task',
                        title: task.title,
                        date: task.due_date,
                        meta: `${project.code} · ${task.assignee?.name ?? 'Belum ada PIC'}`,
                    })),
                ])
                .sort((a, b) =>
                    (a.date ?? '9999-12-31').localeCompare(
                        b.date ?? '9999-12-31',
                    ),
                ),
        [projects],
    );

    const openProjectDialog = (project?: FlowProject) => {
        setEditingProject(project);
        setProjectDialogOpen(true);
    };

    const openTaskDialog = (task?: FlowTask) => {
        setEditingTask(task);
        setTaskDialogOpen(true);
    };

    const deleteSelected = () => {
        if (!selectedNode) {
            return;
        }

        if (
            selectedNode.type === 'project' &&
            window.confirm(`Hapus project ${selectedNode.item.title}?`)
        ) {
            router.delete(destroyProject.url(selectedNode.item.id), {
                preserveScroll: true,
            });
        }

        if (
            selectedNode.type === 'task' &&
            window.confirm(`Hapus task ${selectedNode.item.title}?`)
        ) {
            router.delete(destroyTask.url(selectedNode.item.id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title="Flow Aktivitas" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-hidden p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">
                            Flow Aktivitas
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Kelola project, sub-project, task, dan sub task
                            dalam diagram aktivitas.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            asChild
                            variant={mode === 'flow' ? 'default' : 'outline'}
                        >
                            <Link href={flowActivitiesIndex()}>
                                Flow Aktivitas
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant={mode === 'flow2' ? 'default' : 'outline'}
                        >
                            <Link href={flowActivitiesFlow2()}>
                                Flow Aktivitas 2
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant={
                                mode === 'timeline' ? 'default' : 'outline'
                            }
                        >
                            <Link href={flowActivitiesTimeline()}>
                                Timeline Aktivitas
                            </Link>
                        </Button>
                        {canCreateProject && (
                            <Button onClick={() => openProjectDialog()}>
                                <Plus />
                                Project
                            </Button>
                        )}
                        {canCreateTask && (
                            <Button
                                variant="outline"
                                onClick={() => openTaskDialog()}
                            >
                                <Plus />
                                Task
                            </Button>
                        )}
                    </div>
                </div>

                {mode === 'flow' ? (
                    <div className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-white shadow-sm">
                        <div className="flex h-10 items-center justify-between border-b bg-slate-50 px-3 text-sm">
                            <div className="flex items-center gap-3">
                                <div className="font-semibold text-slate-700">
                                    Activity Blocks
                                </div>
                                <div className="hidden h-5 w-px bg-slate-200 md:block" />
                                <div className="hidden text-xs text-slate-500 md:block">
                                    Pembentukan Kawasan Sentra Produksi Pangan
                                </div>
                            </div>
                            <Button size="sm" onClick={() => openTaskDialog()}>
                                <Plus />
                                Run Flow
                            </Button>
                        </div>
                        <div className="grid h-[680px] min-h-0 grid-cols-[190px_1fr] xl:grid-cols-[190px_1fr_280px]">
                            <aside className="hidden border-r bg-slate-50/80 p-3 md:block">
                                <div className="mb-3 grid grid-cols-2 rounded-sm border bg-white p-1 text-xs">
                                    <div className="rounded-sm bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
                                        Library
                                    </div>
                                    <div className="px-2 py-1 text-slate-500">
                                        Blocks
                                    </div>
                                </div>
                                <Input
                                    readOnly
                                    value=""
                                    placeholder="Search blocks"
                                    className="mb-3 h-8 rounded-sm bg-white"
                                />
                                <div className="space-y-3">
                                    <div>
                                        <div className="mb-1 rounded-sm bg-slate-200 px-2 py-1 text-xs font-medium text-slate-600">
                                            Projects
                                        </div>
                                        {projects.slice(0, 5).map((project) => (
                                            <div
                                                key={project.id}
                                                className="border-b px-2 py-2 text-xs text-slate-600"
                                            >
                                                {project.parent_id
                                                    ? '↳ '
                                                    : '▣ '}
                                                {project.title}
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <div className="mb-1 rounded-sm bg-slate-200 px-2 py-1 text-xs font-medium text-slate-600">
                                            Activities
                                        </div>
                                        {['Task', 'Sub Task', 'Approval'].map(
                                            (item) => (
                                                <div
                                                    key={item}
                                                    className="border-b px-2 py-2 text-xs text-slate-600"
                                                >
                                                    ⠿ {item}
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </aside>
                            <div
                                className="min-h-0 bg-white"
                                style={{
                                    backgroundImage:
                                        'radial-gradient(circle, rgba(148, 163, 184, 0.45) 1px, transparent 1px)',
                                    backgroundSize: '18px 18px',
                                }}
                            >
                                <ReactFlowProvider>
                                    <ReactFlow
                                        nodes={nodes}
                                        edges={edges}
                                        fitView
                                        proOptions={{ hideAttribution: true }}
                                        onNodeClick={(_, node) => {
                                            const [type, id] =
                                                node.id.split(':');

                                            if (type === 'project') {
                                                const project = projects.find(
                                                    (item) => item.id === id,
                                                );
                                                setSelectedNode(
                                                    project
                                                        ? {
                                                              type: 'project',
                                                              item: project,
                                                          }
                                                        : null,
                                                );
                                            }

                                            if (type === 'task') {
                                                const task = findTask(
                                                    projects,
                                                    id,
                                                );
                                                setSelectedNode(
                                                    task
                                                        ? {
                                                              type: 'task',
                                                              item: task,
                                                          }
                                                        : null,
                                                );
                                            }
                                        }}
                                    >
                                        <Background
                                            color="rgba(16, 185, 129, 0.2)"
                                            gap={18}
                                            size={1}
                                        />
                                        <Controls className="rounded-sm border bg-white shadow-sm" />
                                        <MiniMap
                                            pannable
                                            zoomable
                                            className="rounded-sm border bg-white"
                                            maskColor="rgba(16, 185, 129, 0.08)"
                                        />
                                    </ReactFlow>
                                </ReactFlowProvider>
                            </div>
                            <aside className="hidden border-l bg-slate-50/80 p-4 xl:block">
                                <div className="mb-3 flex items-center gap-2 font-medium">
                                    <GitBranch className="size-4 text-emerald-600" />
                                    Detail
                                </div>
                                {selectedNode ? (
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <div className="font-medium">
                                                {selectedNode.item.title}
                                            </div>
                                            <div className="text-muted-foreground">
                                                {selectedNode.type === 'project'
                                                    ? 'Project'
                                                    : 'Task'}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {selectedNode.type === 'project' &&
                                                canUpdateProject && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            openProjectDialog(
                                                                selectedNode.item,
                                                            )
                                                        }
                                                    >
                                                        <Edit />
                                                        Edit
                                                    </Button>
                                                )}
                                            {selectedNode.type === 'task' &&
                                                canUpdateTask && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            openTaskDialog(
                                                                selectedNode.item,
                                                            )
                                                        }
                                                    >
                                                        <Edit />
                                                        Edit
                                                    </Button>
                                                )}
                                            {((selectedNode.type ===
                                                'project' &&
                                                canDeleteProject) ||
                                                (selectedNode.type === 'task' &&
                                                    canDeleteTask)) && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={deleteSelected}
                                                >
                                                    <Trash2 />
                                                    Hapus
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Pilih node pada diagram untuk edit atau
                                        hapus.
                                    </p>
                                )}
                            </aside>
                        </div>
                    </div>
                ) : mode === 'flow2' ? (
                    <div className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-white shadow-sm">
                        <div className="flex h-10 items-center justify-between border-b bg-white px-3 text-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 font-semibold text-slate-700">
                                    <Table2 className="size-4 text-emerald-600" />
                                    Flow Aktivitas 2
                                </div>
                                <div className="hidden h-5 w-px bg-slate-200 md:block" />
                                <div className="hidden text-xs text-slate-500 md:block">
                                    Project diagram dengan daftar task di dalam
                                    node.
                                </div>
                            </div>
                            <div className="text-xs text-slate-500">
                                {projects.length} project
                            </div>
                        </div>
                        <div className="grid h-[680px] min-h-0 grid-cols-[230px_1fr] xl:grid-cols-[230px_1fr_280px]">
                            <aside className="hidden border-r bg-white p-3 md:block">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="font-medium text-slate-700">
                                        Projects
                                    </div>
                                    {canCreateProject && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openProjectDialog()}
                                        >
                                            <Plus />
                                            Add
                                        </Button>
                                    )}
                                </div>
                                <div className="relative mb-3">
                                    <Search className="pointer-events-none absolute top-2.5 left-2.5 size-3.5 text-slate-400" />
                                    <Input
                                        readOnly
                                        value=""
                                        placeholder="Filter"
                                        className="h-9 rounded-sm bg-white pl-8"
                                    />
                                </div>
                                <div className="space-y-1">
                                    {projects.map((project) => (
                                        <button
                                            key={project.id}
                                            type="button"
                                            className="grid w-full grid-cols-[4px_1fr_auto] items-center gap-2 border-b py-2 pr-1 text-left text-sm hover:bg-slate-50"
                                            onClick={() =>
                                                setSelectedNode({
                                                    type: 'project',
                                                    item: project,
                                                })
                                            }
                                        >
                                            <span
                                                className="h-8 rounded-r"
                                                style={{
                                                    backgroundColor:
                                                        project.status
                                                            ?.color ??
                                                        '#10b981',
                                                }}
                                            />
                                            <span className="min-w-0">
                                                <span className="block truncate font-medium text-slate-700">
                                                    {project.title}
                                                </span>
                                                <span className="block truncate text-xs text-slate-400">
                                                    {project.parent_id
                                                        ? 'Sub project'
                                                        : 'Main project'}{' '}
                                                    · {project.code}
                                                </span>
                                            </span>
                                            <MoreVertical className="size-4 text-slate-400" />
                                        </button>
                                    ))}
                                </div>
                            </aside>
                            <div
                                className="relative min-h-0 bg-white"
                                style={{
                                    backgroundImage:
                                        'radial-gradient(circle, rgba(148, 163, 184, 0.26) 1px, transparent 1px)',
                                    backgroundSize: '22px 22px',
                                }}
                            >
                                <ReactFlowProvider>
                                    <ReactFlow
                                        nodes={tableNodes}
                                        edges={tableEdges}
                                        fitView
                                        minZoom={0.35}
                                        proOptions={{ hideAttribution: true }}
                                        onNodeClick={(_, node) => {
                                            const [type, id] =
                                                node.id.split(':');

                                            if (type === 'project') {
                                                const project = projects.find(
                                                    (item) => item.id === id,
                                                );
                                                setSelectedNode(
                                                    project
                                                        ? {
                                                              type: 'project',
                                                              item: project,
                                                          }
                                                        : null,
                                                );
                                            }
                                        }}
                                    >
                                        <Background
                                            color="rgba(16, 185, 129, 0.14)"
                                            gap={22}
                                            size={1}
                                        />
                                        <MiniMap
                                            pannable
                                            zoomable
                                            className="rounded-sm border bg-white"
                                            maskColor="rgba(16, 185, 129, 0.08)"
                                        />
                                    </ReactFlow>
                                </ReactFlowProvider>
                                <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-md border bg-white/95 px-2 py-1 shadow-sm">
                                    {[Save, ZoomOut, ZoomIn, Undo2, Redo2].map(
                                        (Icon, index) => (
                                            <Button
                                                key={index}
                                                size="icon"
                                                variant="ghost"
                                                className="pointer-events-auto size-8 text-slate-500"
                                            >
                                                <Icon className="size-4" />
                                            </Button>
                                        ),
                                    )}
                                </div>
                            </div>
                            <aside className="hidden border-l bg-slate-50/80 p-4 xl:block">
                                <div className="mb-3 flex items-center gap-2 font-medium">
                                    <GitBranch className="size-4 text-emerald-600" />
                                    Detail
                                </div>
                                {selectedNode ? (
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <div className="font-medium">
                                                {selectedNode.item.title}
                                            </div>
                                            <div className="text-muted-foreground">
                                                {selectedNode.type === 'project'
                                                    ? 'Project'
                                                    : 'Task'}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {selectedNode.type === 'project' &&
                                                canUpdateProject && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            openProjectDialog(
                                                                selectedNode.item,
                                                            )
                                                        }
                                                    >
                                                        <Edit />
                                                        Edit
                                                    </Button>
                                                )}
                                            {selectedNode.type === 'task' &&
                                                canUpdateTask && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            openTaskDialog(
                                                                selectedNode.item,
                                                            )
                                                        }
                                                    >
                                                        <Edit />
                                                        Edit
                                                    </Button>
                                                )}
                                            {((selectedNode.type ===
                                                'project' &&
                                                canDeleteProject) ||
                                                (selectedNode.type === 'task' &&
                                                    canDeleteTask)) && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={deleteSelected}
                                                >
                                                    <Trash2 />
                                                    Hapus
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Pilih project atau baris task untuk
                                        edit/hapus.
                                    </p>
                                )}
                            </aside>
                        </div>
                    </div>
                ) : (
                    <div className="min-h-0 flex-1 overflow-auto rounded-lg border">
                        <div className="divide-y">
                            {timelineItems.map((item) => (
                                <div
                                    key={item.key}
                                    className="grid gap-2 p-4 md:grid-cols-[160px_120px_1fr]"
                                >
                                    <div className="text-sm font-medium">
                                        {formatDate(item.date)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {item.type}
                                    </div>
                                    <div>
                                        <div className="font-medium">
                                            {item.title}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {item.meta}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ProjectDialog
                key={editingProject?.id ?? 'create-project'}
                open={projectDialogOpen}
                onOpenChange={setProjectDialogOpen}
                project={editingProject}
                allProjects={allProjects}
                divisions={divisions}
                users={users}
                statuses={statuses}
                priorities={priorities}
            />
            <TaskDialog
                key={editingTask?.id ?? 'create-task'}
                open={taskDialogOpen}
                onOpenChange={setTaskDialogOpen}
                task={editingTask}
                allProjects={allProjects}
                parentTasks={parentTasks}
                divisions={divisions}
                users={users}
                statuses={statuses}
                priorities={priorities}
            />
        </>
    );
}

FlowActivities.layout = {
    breadcrumbs: [{ title: 'Flow Aktivitas', href: flowActivitiesIndex() }],
};
