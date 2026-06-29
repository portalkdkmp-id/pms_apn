import { Form, Head, router, usePage } from '@inertiajs/react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    destroy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/DivisionController';
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
import type { Auth, Division, OptionUser, Paginated } from '@/types';

type Props = {
    divisions: Paginated<Division>;
    users: OptionUser[];
};

type DivisionFormDialogProps = {
    users: OptionUser[];
    division?: Division;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function DivisionFormDialog({
    users,
    division,
    open,
    onOpenChange,
}: DivisionFormDialogProps) {
    const [managerId, setManagerId] = useState(
        formSelectValue(division?.manager_id),
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {division ? 'Edit division' : 'Tambah division'}
                    </DialogTitle>
                    <DialogDescription>
                        Kelola master division, slug, dan manager.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...(division ? update.form(division.id) : store.form())}
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
                                    defaultValue={division?.name}
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    name="slug"
                                    defaultValue={division?.slug}
                                    required
                                />
                                <InputError message={errors.slug} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="manager_id">Manager</Label>
                                <FormSelect
                                    id="manager_id"
                                    name="manager_id"
                                    value={managerId}
                                    onValueChange={setManagerId}
                                    placeholder="Belum ada manager"
                                    options={users.map((user) => ({
                                        label: user.name,
                                        value: user.id,
                                    }))}
                                />
                                <InputError message={errors.manager_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Input
                                    id="description"
                                    name="description"
                                    defaultValue={division?.description ?? ''}
                                />
                                <InputError message={errors.description} />
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
                                    {division ? 'Simpan' : 'Tambah'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function DivisionsIndex({ divisions, users }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const permissions = new Set(auth.permissions);
    const canCreate = permissions.has('division.create');
    const canUpdate = permissions.has('division.update');
    const canDelete = permissions.has('division.delete');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingDivision, setEditingDivision] = useState<Division | null>(
        null,
    );

    const deleteDivision = (division: Division) => {
        if (window.confirm(`Hapus division ${division.name}?`)) {
            router.delete(destroy.url(division.id), { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title="Divisions" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto bg-fog p-4 md:p-6">
                <PageHeader
                    eyebrow="Organization"
                    title="Divisions"
                    description="Kelola divisi, manager, dan relasi user yang menjadi dasar assignment project dan task."
                    meta={
                        <>
                            <span>{divisions.data.length} divisi tampil</span>
                            <span>{users.length} user tersedia</span>
                        </>
                    }
                    actions={
                        canCreate && (
                            <Button onClick={() => setIsCreateOpen(true)}>
                                <Plus />
                                Divisi baru
                            </Button>
                        )
                    }
                />

                <TableCard>
                    {divisions.data.length === 0 ? (
                        <EmptyTableState
                            title="Belum ada divisi"
                            description="Tambahkan divisi untuk mengelompokkan user dan pekerjaan."
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
                                        Manager
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Deskripsi
                                    </th>
                                    {(canUpdate || canDelete) && (
                                        <th className="w-24 px-5 py-4 text-right font-medium">
                                            Aksi
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {divisions.data.map((division) => (
                                    <tr
                                        key={division.id}
                                        className="border-t border-border/70 transition hover:bg-fog/70"
                                    >
                                        <td className="px-5 py-4 font-medium text-ink">
                                            {division.name}
                                        </td>
                                        <td className="px-5 py-4 font-mono text-xs text-graphite">
                                            {division.slug}
                                        </td>
                                        <td className="px-5 py-4">
                                            {division.manager?.name ?? '-'}
                                        </td>
                                        <td className="px-5 py-4 text-graphite">
                                            {division.description ?? '-'}
                                        </td>
                                        {(canUpdate || canDelete) && (
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    {canUpdate && (
                                                        <Button
                                                            size="icon-sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                setEditingDivision(
                                                                    division,
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
                                                                deleteDivision(
                                                                    division,
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

                <PaginationLinks links={divisions.links} />
            </div>

            {canCreate && (
                <DivisionFormDialog
                    users={users}
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                />
            )}
            {canUpdate && editingDivision && (
                <DivisionFormDialog
                    users={users}
                    division={editingDivision}
                    open={!!editingDivision}
                    onOpenChange={(open) => !open && setEditingDivision(null)}
                />
            )}
        </>
    );
}

DivisionsIndex.layout = {
    breadcrumbs: [{ title: 'Divisions', href: index() }],
};
