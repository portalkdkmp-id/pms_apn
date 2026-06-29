import { Form, Head, router, usePage } from '@inertiajs/react';
import { Clock, Edit, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    destroy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/ProjectController';
import {
    EmptyTableState,
    PageHeader,
    PaginationLinks,
    TableCard,
} from '@/components/app-page';
import {
    FormSelect,
    formSelectValue,
    SearchableFormSelect,
} from '@/components/form-select';
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
    Option,
    OptionUser,
    Paginated,
    Project,
    ProjectStatus,
    Auth,
    OptionProject,
} from '@/types';

type Props = {
    projects: Paginated<Project>;
    parentProjects: OptionProject[];
    divisions: Option[];
    owners: OptionUser[];
    statuses: Pick<ProjectStatus, 'id' | 'name' | 'slug' | 'color'>[];
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

function isOverdueProject(project: Project): boolean {
    const deadline = dateValue(project.expected_deadline);

    return (
        !!deadline &&
        deadline < new Date().toISOString().slice(0, 10) &&
        project.status?.slug !== 'done'
    );
}

function ProjectFormDialog({
    parentProjects,
    divisions,
    owners,
    statuses,
    priorities,
    project,
    open,
    onOpenChange,
}: ProjectFormDialogProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const availableParentProjects = parentProjects.filter(
        (parentProject) => parentProject.id !== project?.id,
    );
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
    const [requiresPrevious, setRequiresPrevious] = useState(
        project?.requires_previous_project_done ?? false,
    );
    const [previousProjectId, setPreviousProjectId] = useState(
        formSelectValue(project?.previous_project_id),
    );

    useEffect(() => {
        if (!open) {
            return;
        }

        setParentId(formSelectValue(project?.parent_id));
        setDivisionId(
            project
                ? formSelectValue(project.division_id)
                : divisions.length === 1
                  ? formSelectValue(divisions[0]?.id)
                  : formSelectValue(),
        );
        const currentUserOwner = owners.find(
            (owner) => owner.id === auth.user?.id,
        );

        setOwnerId(
            project
                ? formSelectValue(project.owner_id)
                : currentUserOwner
                  ? formSelectValue(currentUserOwner.id)
                  : owners.length === 1
                    ? formSelectValue(owners[0]?.id)
                    : formSelectValue(),
        );
        setStatusId(
            project
                ? formSelectValue(project.status_id)
                : statuses.length > 0
                  ? formSelectValue(statuses[0]?.id)
                  : formSelectValue(),
        );
        setPriority(formSelectValue(project?.priority ?? 'medium'));
        setRequiresPrevious(project?.requires_previous_project_done ?? false);
        setPreviousProjectId(formSelectValue(project?.previous_project_id));
    }, [auth.user?.id, divisions, open, owners, project, statuses]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>
                        {project ? 'Edit project' : 'Tambah project'}
                    </DialogTitle>
                    <DialogDescription>
                        Isi data utama dulu, lalu lengkapi jadwal dan dependensi
                        bila diperlukan.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...(project ? update.form(project.id) : store.form())}
                    encType="multipart/form-data"
                    onSuccess={() => onOpenChange(false)}
                    className="grid gap-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-4 rounded-sm border border-border bg-smoke-50 p-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <div className="text-sm font-medium text-ink">
                                        Informasi utama
                                    </div>
                                    <p className="text-xs text-graphite">
                                        Data minimum agar project bisa mulai
                                        dikerjakan.
                                    </p>
                                </div>
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
                                    <SearchableFormSelect
                                        id="parent_id"
                                        name="parent_id"
                                        value={parentId}
                                        onValueChange={setParentId}
                                        placeholder="Tanpa parent project"
                                        searchPlaceholder="Cari kode atau judul project..."
                                        options={availableParentProjects.map(
                                            (parentProject) => ({
                                                label: `${parentProject.code} - ${parentProject.title}`,
                                                value: parentProject.id,
                                            }),
                                        )}
                                    />
                                    <InputError message={errors.parent_id} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="division_id">Divisi</Label>
                                    <SearchableFormSelect
                                        id="division_id"
                                        name="division_id"
                                        value={divisionId}
                                        onValueChange={setDivisionId}
                                        placeholder="Pilih divisi"
                                        searchPlaceholder="Cari divisi..."
                                        options={divisions.map((division) => ({
                                            label: division.name,
                                            value: division.id,
                                        }))}
                                    />
                                    <InputError message={errors.division_id} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="owner_id">Owner</Label>
                                    <SearchableFormSelect
                                        id="owner_id"
                                        name="owner_id"
                                        value={ownerId}
                                        onValueChange={setOwnerId}
                                        placeholder="Pilih owner"
                                        searchPlaceholder="Cari owner..."
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
                            </div>

                            <div className="grid gap-4 rounded-sm border border-border bg-smoke-50 p-4 sm:grid-cols-3">
                                <div className="sm:col-span-3">
                                    <div className="text-sm font-medium text-ink">
                                        Jadwal
                                    </div>
                                    <p className="text-xs text-graphite">
                                        Tanggal boleh dikosongkan jika belum
                                        final.
                                    </p>
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
                                <div className="grid gap-2">
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
                            </div>

                            <div className="grid gap-4 rounded-sm border border-border bg-smoke-50 p-4">
                                <div>
                                    <div className="text-sm font-medium text-ink">
                                        Catatan dan dokumen
                                    </div>
                                    <p className="text-xs text-graphite">
                                        Tambahkan konteks hanya bila membantu
                                        tim memahami pekerjaan.
                                    </p>
                                </div>
                                <div className="grid gap-2">
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
                                <div className="grid gap-3 rounded-sm border border-border bg-white p-3">
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="hidden"
                                            name="requires_previous_project_done"
                                            value="0"
                                        />
                                        <input
                                            id="requires_previous_project_done"
                                            name="requires_previous_project_done"
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
                                            <Label htmlFor="requires_previous_project_done">
                                                Project ini menunggu project
                                                sebelumnya Done
                                            </Label>
                                            <FormSelect
                                                id="previous_project_id"
                                                name="previous_project_id"
                                                value={previousProjectId}
                                                onValueChange={
                                                    setPreviousProjectId
                                                }
                                                placeholder="Pilih previous project"
                                                disabled={!requiresPrevious}
                                                options={availableParentProjects.map(
                                                    (parentProject) => ({
                                                        label: `${parentProject.code} - ${parentProject.title}`,
                                                        value: parentProject.id,
                                                    }),
                                                )}
                                            />
                                            <InputError
                                                message={
                                                    errors.previous_project_id
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
    parentProjects,
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

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto bg-fog p-4 md:p-6">
                <PageHeader
                    eyebrow="PMS workflow"
                    title="Projects"
                    description="Mulai dari project, tentukan owner dan status, lalu pecah pekerjaan menjadi task yang bisa dipantau harian."
                    meta={
                        <>
                            <span>{projects.data.length} project tampil</span>
                            <span>{parentProjects.length} opsi parent</span>
                            <span>{divisions.length} divisi</span>
                        </>
                    }
                    actions={
                        canCreate && (
                            <Button onClick={() => setIsCreateOpen(true)}>
                                <Plus />
                                Project baru
                            </Button>
                        )
                    }
                />

                <TableCard>
                    {projects.data.length === 0 ? (
                        <EmptyTableState
                            title="Belum ada project"
                            description="Buat project pertama untuk mulai menyusun task dan KPI."
                        />
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-fog text-left text-xs tracking-[0.12em] text-graphite uppercase">
                                <tr>
                                    <th className="px-5 py-4 font-medium">
                                        Project
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Divisi
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Owner
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Status
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Deadline
                                    </th>
                                    {(canUpdate || canDelete) && (
                                        <th className="w-24 px-5 py-4 text-right font-medium">
                                            Aksi
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {projects.data.map((project) => {
                                    const overdue = isOverdueProject(project);

                                    return (
                                        <tr
                                            key={project.id}
                                            className={`border-t border-border/70 transition hover:bg-fog/70 ${
                                                overdue ? 'bg-red-50/70' : ''
                                            }`}
                                        >
                                            <td className="px-5 py-4">
                                                <div className="font-medium text-ink">
                                                    {project.title}
                                                </div>
                                                <div className="text-graphite">
                                                    {project.code} ·{' '}
                                                    {project.priority}
                                                </div>
                                                <div className="text-xs text-graphite">
                                                    {project.parent
                                                        ? `Sub-project dari ${project.parent.code}`
                                                        : `${project.children_count ?? 0} sub-project`}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                {project.division?.name ?? '-'}
                                            </td>
                                            <td className="px-5 py-4">
                                                {project.owner?.name ?? '-'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="inline-flex items-center gap-2 rounded-full bg-fog px-3 py-1">
                                                    <span
                                                        className="size-2.5 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                project.status
                                                                    ?.color ??
                                                                '#64748b',
                                                        }}
                                                    />
                                                    {project.status?.name ??
                                                        '-'}
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
                                                            project.expected_deadline,
                                                        ) || '-'}
                                                    </span>
                                                </div>
                                                {overdue && (
                                                    <div className="text-xs font-medium text-red-600">
                                                        Overdue
                                                    </div>
                                                )}
                                            </td>
                                            {(canUpdate || canDelete) && (
                                                <td className="px-5 py-4">
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
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </TableCard>

                <PaginationLinks links={projects.links} />
            </div>

            {canCreate && (
                <ProjectFormDialog
                    parentProjects={parentProjects}
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
                    parentProjects={parentProjects}
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
