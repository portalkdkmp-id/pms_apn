import { Form, Head, router, usePage } from '@inertiajs/react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    destroy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/RoleController';
import {
    EmptyTableState,
    PageHeader,
    PaginationLinks,
    TableCard,
} from '@/components/app-page';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
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
import type { Auth, ManagedRole, Paginated } from '@/types';

type Props = {
    roles: Paginated<ManagedRole>;
    permissions: string[];
};

type RoleFormDialogProps = {
    permissions: string[];
    role?: ManagedRole;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function RoleFormDialog({
    permissions,
    role,
    open,
    onOpenChange,
}: RoleFormDialogProps) {
    const selectedPermissions =
        role?.permissions.map((permission) => permission.name) ?? [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        {role ? 'Edit role' : 'Tambah role'}
                    </DialogTitle>
                    <DialogDescription>
                        Kelola role dan permission yang melekat pada role
                        tersebut.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...(role ? update.form(String(role.id)) : store.form())}
                    onSuccess={() => onOpenChange(false)}
                    className="grid gap-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama role</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={role?.name}
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Permissions</Label>
                                <div className="grid max-h-72 gap-2 overflow-y-auto rounded-sm border border-border bg-smoke-50 p-3 sm:grid-cols-2">
                                    {permissions.map((permission) => (
                                        <label
                                            key={permission}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <input
                                                type="checkbox"
                                                name="permissions[]"
                                                value={permission}
                                                defaultChecked={selectedPermissions.includes(
                                                    permission,
                                                )}
                                                className="size-4 rounded border-border"
                                            />
                                            <span>{permission}</span>
                                        </label>
                                    ))}
                                </div>
                                <InputError message={errors.permissions} />
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
                                    {role ? 'Simpan' : 'Tambah'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function RolesIndex({ roles, permissions }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const permissionSet = new Set(auth.permissions);
    const canCreate = permissionSet.has('role.create');
    const canUpdate = permissionSet.has('role.update');
    const canDelete = permissionSet.has('role.delete');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<ManagedRole | null>(null);

    const deleteRole = (role: ManagedRole) => {
        if (window.confirm(`Hapus role ${role.name}?`)) {
            router.delete(destroy.url(String(role.id)), {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title="Roles" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto bg-fog p-4 md:p-6">
                <PageHeader
                    eyebrow="Access policy"
                    title="Roles & Permissions"
                    description="Kelola role dan permission agar akses aplikasi tetap jelas, terbatas, dan mudah diaudit."
                    meta={
                        <>
                            <span>{roles.data.length} role tampil</span>
                            <span>{permissions.length} permission</span>
                        </>
                    }
                    actions={
                        canCreate && (
                            <Button onClick={() => setIsCreateOpen(true)}>
                                <Plus />
                                Role baru
                            </Button>
                        )
                    }
                />

                <TableCard>
                    {roles.data.length === 0 ? (
                        <EmptyTableState
                            title="Belum ada role"
                            description="Tambahkan role untuk mengatur paket permission user."
                        />
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-fog text-left text-xs tracking-[0.12em] text-graphite uppercase">
                                <tr>
                                    <th className="px-5 py-4 font-medium">
                                        Role
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Permissions
                                    </th>
                                    {(canUpdate || canDelete) && (
                                        <th className="w-24 px-5 py-4 text-right font-medium">
                                            Aksi
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {roles.data.map((role) => (
                                    <tr
                                        key={role.id}
                                        className="border-t border-border/70 transition hover:bg-fog/70"
                                    >
                                        <td className="px-5 py-4 font-medium text-ink">
                                            {role.name}
                                        </td>
                                        <td className="px-5 py-4 text-graphite">
                                            <div className="flex flex-wrap gap-2">
                                                {role.permissions.length > 0 ? (
                                                    role.permissions.map(
                                                        (permission) => (
                                                            <Badge
                                                                key={
                                                                    permission.id
                                                                }
                                                                variant={
                                                                    'outline'
                                                                }
                                                            >
                                                                {
                                                                    permission.name
                                                                }
                                                            </Badge>
                                                        ),
                                                    )
                                                ) : (
                                                    <span>-</span>
                                                )}
                                            </div>
                                        </td>
                                        {(canUpdate || canDelete) && (
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    {canUpdate && (
                                                        <Button
                                                            size="icon-sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                setEditingRole(
                                                                    role,
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
                                                                deleteRole(role)
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

                <PaginationLinks links={roles.links} />
            </div>

            {canCreate && (
                <RoleFormDialog
                    permissions={permissions}
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                />
            )}
            {canUpdate && editingRole && (
                <RoleFormDialog
                    permissions={permissions}
                    role={editingRole}
                    open={!!editingRole}
                    onOpenChange={(open) => !open && setEditingRole(null)}
                />
            )}
        </>
    );
}

RolesIndex.layout = {
    breadcrumbs: [{ title: 'Roles', href: index() }],
};
