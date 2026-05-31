import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    destroy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/ProjectController';
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
import type {
    Option,
    OptionUser,
    Paginated,
    Project,
    ProjectStatus,
    Auth,
} from '@/types';
import { Textarea } from '@/components/ui/textarea';

type Props = {
    projects: Paginated<Project>;
    divisions: Option[];
    owners: OptionUser[];
    statuses: Pick<ProjectStatus, 'id' | 'name' | 'color'>[];
    priorities: string[];
};

type ProjectFormDialogProps = Omit<Props, 'projects'> & {
    project?: Project;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function dateValue(value?: string | null): string {
    return value?.slice(0, 10) ?? '';
}

function ProjectFormDialog({
    divisions,
    owners,
    statuses,
    priorities,
    project,
    open,
    onOpenChange,
}: ProjectFormDialogProps) {
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
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>
                        {project ? 'Edit project' : 'Tambah project'}
                    </DialogTitle>
                    <DialogDescription>
                        Kelola project, owner, status, jadwal, dan KPI.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...(project ? update.form(project.id) : store.form())}
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
                                        options={owners.map((owner) => ({
                                            label: owner.name,
                                            value: owner.id,
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
                                        options={priorities.map((priority) => ({
                                            label: priority,
                                            value: priority,
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
                                    <Label htmlFor="start_date">
                                        Start date
                                    </Label>
                                    <Input
                                        id="start_date"
                                        name="start_date"
                                        type="date"
                                        defaultValue={dateValue(
                                            project?.start_date,
                                        )}
                                    />
                                    <InputError message={errors.start_date} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="end_date">End date</Label>
                                    <Input
                                        id="end_date"
                                        name="end_date"
                                        type="date"
                                        defaultValue={dateValue(
                                            project?.end_date,
                                        )}
                                    />
                                    <InputError message={errors.end_date} />
                                </div>
                                <div className="grid gap-2 sm:col-span-2">
                                    <Label htmlFor="expected_deadline">
                                        Expected deadline
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
                                <Button disabled={processing}>
                                    {project ? 'Simpan' : 'Tambah'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function ProjectsIndex({
    projects,
    divisions,
    owners,
    statuses,
    priorities,
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const permissions = new Set(auth.permissions);
    const canCreate = permissions.has('project.create');
    const canUpdate = permissions.has('project.update');
    const canDelete = permissions.has('project.delete');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    const deleteProject = (project: Project) => {
        if (window.confirm(`Hapus project ${project.title}?`)) {
            router.delete(destroy.url(project.id), { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title="Projects" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Projects</h1>
                        <p className="text-sm text-muted-foreground">
                            Kelola project lintas divisi dan progres KPI.
                        </p>
                    </div>
                    {canCreate && (
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus />
                            Tambah
                        </Button>
                    )}
                </div>

                <div className="overflow-hidden rounded-lg border">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/60 text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        Project
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Divisi
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Owner
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Deadline
                                    </th>
                                    {(canUpdate || canDelete) && (
                                        <th className="w-24 px-4 py-3 text-right font-medium">
                                            Aksi
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {projects.data.map((project) => (
                                    <tr key={project.id} className="border-t">
                                        <td className="px-4 py-3">
                                            <div className="font-medium">
                                                {project.title}
                                            </div>
                                            <div className="text-muted-foreground">
                                                {project.code} ·{' '}
                                                {project.priority}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {project.division?.name ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {project.owner?.name ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="size-3 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            project.status
                                                                ?.color ??
                                                            '#64748b',
                                                    }}
                                                />
                                                {project.status?.name ?? '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {dateValue(
                                                project.expected_deadline,
                                            ) || '-'}
                                        </td>
                                        {(canUpdate || canDelete) && (
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    {canUpdate && (
                                                        <Button
                                                            size="icon-sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                setEditingProject(
                                                                    project,
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
                                                                deleteProject(
                                                                    project,
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {projects.links.map((link) => (
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
                <ProjectFormDialog
                    divisions={divisions}
                    owners={owners}
                    statuses={statuses}
                    priorities={priorities}
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                />
            )}
            {canUpdate && editingProject && (
                <ProjectFormDialog
                    divisions={divisions}
                    owners={owners}
                    statuses={statuses}
                    priorities={priorities}
                    project={editingProject}
                    open={!!editingProject}
                    onOpenChange={(open) => !open && setEditingProject(null)}
                />
            )}
        </>
    );
}

ProjectsIndex.layout = {
    breadcrumbs: [{ title: 'Projects', href: index() }],
};
