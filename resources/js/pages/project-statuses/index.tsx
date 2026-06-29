import { Form, Head, router, usePage } from '@inertiajs/react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    destroy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/ProjectStatusController';
import {
    EmptyTableState,
    PageHeader,
    PaginationLinks,
    TableCard,
} from '@/components/app-page';
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
import type { Auth, Paginated, ProjectStatus } from '@/types';

type Props = {
    projectStatuses: Paginated<ProjectStatus>;
};

type StatusFormDialogProps = {
    projectStatus?: ProjectStatus;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function StatusFormDialog({
    projectStatus,
    open,
    onOpenChange,
}: StatusFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {projectStatus ? 'Edit status' : 'Tambah status'}
                    </DialogTitle>
                    <DialogDescription>
                        Kelola tahapan status untuk project dan task.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...(projectStatus
                        ? update.form(projectStatus.id)
                        : store.form())}
                    onSuccess={() => onOpenChange(false)}
                    className="grid gap-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={projectStatus?.name}
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    name="slug"
                                    defaultValue={projectStatus?.slug}
                                    required
                                />
                                <InputError message={errors.slug} />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="color">Color</Label>
                                    <Input
                                        id="color"
                                        name="color"
                                        type="color"
                                        defaultValue={
                                            projectStatus?.color ?? '#2563eb'
                                        }
                                        required
                                        className="p-1"
                                    />
                                    <InputError message={errors.color} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="sort_order">
                                        Sort order
                                    </Label>
                                    <Input
                                        id="sort_order"
                                        name="sort_order"
                                        type="number"
                                        min="0"
                                        defaultValue={
                                            projectStatus?.sort_order ?? 0
                                        }
                                        required
                                    />
                                    <InputError message={errors.sort_order} />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    value="1"
                                    defaultChecked={
                                        projectStatus?.is_active ?? true
                                    }
                                    className="size-4 rounded border-border"
                                />
                                <span>Aktif</span>
                            </label>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Batal
                                </Button>
                                <Button disabled={processing}>
                                    {projectStatus ? 'Simpan' : 'Tambah'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function ProjectStatusesIndex({ projectStatuses }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const permissions = new Set(auth.permissions);
    const canCreate = permissions.has('project_status.create');
    const canUpdate = permissions.has('project_status.update');
    const canDelete = permissions.has('project_status.delete');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingStatus, setEditingStatus] = useState<ProjectStatus | null>(
        null,
    );

    const deleteStatus = (projectStatus: ProjectStatus) => {
        if (window.confirm(`Hapus status ${projectStatus.name}?`)) {
            router.delete(destroy.url(projectStatus.id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title="Status" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto bg-fog p-4 md:p-6">
                <PageHeader
                    eyebrow="Workflow tags"
                    title="Status"
                    description="Kelola alur status project dan task agar progres terbaca konsisten di dashboard, flow, dan gantt."
                    meta={
                        <>
                            <span>
                                {projectStatuses.data.length} status tampil
                            </span>
                        </>
                    }
                    actions={
                        canCreate && (
                            <Button onClick={() => setIsCreateOpen(true)}>
                                <Plus />
                                Status baru
                            </Button>
                        )
                    }
                />

                <TableCard>
                    {projectStatuses.data.length === 0 ? (
                        <EmptyTableState
                            title="Belum ada status"
                            description="Tambahkan status untuk memetakan workflow project dan task."
                        />
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-fog text-left text-xs tracking-[0.12em] text-graphite uppercase">
                                <tr>
                                    <th className="px-5 py-4 font-medium">
                                        Nama
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Slug
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Urutan
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Status
                                    </th>
                                    {(canUpdate || canDelete) && (
                                        <th className="w-24 px-5 py-4 text-right font-medium">
                                            Aksi
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {projectStatuses.data.map((projectStatus) => (
                                    <tr
                                        key={projectStatus.id}
                                        className="border-t border-border/70 transition hover:bg-fog/70"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2 font-medium">
                                                <span
                                                    className="size-2.5 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            projectStatus.color,
                                                    }}
                                                />
                                                {projectStatus.name}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 font-mono text-xs text-graphite">
                                            {projectStatus.slug}
                                        </td>
                                        <td className="px-5 py-4">
                                            {projectStatus.sort_order}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex rounded-full border border-border bg-smoke-50 px-2.5 py-1 text-xs font-medium">
                                                {projectStatus.is_active
                                                    ? 'Aktif'
                                                    : 'Nonaktif'}
                                            </span>
                                        </td>
                                        {(canUpdate || canDelete) && (
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    {canUpdate && (
                                                        <Button
                                                            size="icon-sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                setEditingStatus(
                                                                    projectStatus,
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
                                                                deleteStatus(
                                                                    projectStatus,
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
                    )}
                </TableCard>

                <PaginationLinks links={projectStatuses.links} />
            </div>

            {canCreate && (
                <StatusFormDialog
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                />
            )}
            {canUpdate && editingStatus && (
                <StatusFormDialog
                    projectStatus={editingStatus}
                    open={!!editingStatus}
                    onOpenChange={(open) => !open && setEditingStatus(null)}
                />
            )}
        </>
    );
}

ProjectStatusesIndex.layout = {
    breadcrumbs: [{ title: 'Status', href: index() }],
};
