import { Form, Head, router, usePage } from '@inertiajs/react';
import { Download, Edit, Plus, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import {
    destroy,
    exportMethod,
    importMethod,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/UserController';
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
import type { Auth, ManagedUser, Option, Paginated } from '@/types';

type Props = {
    users: Paginated<ManagedUser>;
    roles: string[];
    divisions: Option[];
    filters: {
        search?: string;
        role?: string;
        division_id?: string;
    };
};

type UserFormDialogProps = {
    roles: string[];
    divisions: Option[];
    user?: ManagedUser;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function UserFormDialog({
    roles,
    divisions,
    user,
    open,
    onOpenChange,
}: UserFormDialogProps) {
    const selectedRoles = user?.roles.map((role) => role.name) ?? [];
    const [divisionId, setDivisionId] = useState(
        formSelectValue(user?.division_id),
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {user ? 'Edit user' : 'Tambah user'}
                    </DialogTitle>
                    <DialogDescription>
                        Kelola identitas user, divisi, dan role aksesnya.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...(user ? update.form(user.id) : store.form())}
                    onSuccess={() => onOpenChange(false)}
                    className="grid gap-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-4 rounded-sm border border-border bg-smoke-50 p-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <div className="text-sm font-medium text-ink">
                                        Profil user
                                    </div>
                                    <p className="text-xs text-graphite">
                                        Data dasar untuk identitas dan akses
                                        aplikasi.
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nama</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        defaultValue={user?.name}
                                        required
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        defaultValue={user?.email}
                                        required
                                    />
                                    <InputError message={errors.email} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="staff_number">
                                        NIK Staff
                                    </Label>
                                    <Input
                                        id="staff_number"
                                        name="staff_number"
                                        defaultValue={user?.staff_number}
                                        required
                                    />
                                    <InputError message={errors.staff_number} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Telepon</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        defaultValue={user?.phone ?? ''}
                                    />
                                    <InputError message={errors.phone} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="division_id">Divisi</Label>
                                    <FormSelect
                                        id="division_id"
                                        name="division_id"
                                        value={divisionId}
                                        onValueChange={setDivisionId}
                                        placeholder="Tanpa divisi"
                                        options={divisions.map((division) => ({
                                            label: division.name,
                                            value: division.id,
                                        }))}
                                    />
                                    <InputError message={errors.division_id} />
                                </div>
                            </div>

                            <div className="grid gap-4 rounded-sm border border-border bg-smoke-50 p-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <div className="text-sm font-medium text-ink">
                                        Keamanan
                                    </div>
                                    <p className="text-xs text-graphite">
                                        Password wajib untuk user baru, opsional
                                        saat edit.
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required={!user}
                                    />
                                    <InputError message={errors.password} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">
                                        Konfirmasi Password
                                    </Label>
                                    <Input
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type="password"
                                        required={!user}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2 rounded-sm border border-border bg-smoke-50 p-4">
                                <Label>Roles</Label>
                                <div className="grid gap-2 rounded-sm border border-border bg-white p-3 sm:grid-cols-2">
                                    {roles.map((role) => (
                                        <label
                                            key={role}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <input
                                                type="checkbox"
                                                name="roles[]"
                                                value={role}
                                                defaultChecked={selectedRoles.includes(
                                                    role,
                                                )}
                                                className="size-4 rounded border-border"
                                            />
                                            <span>{role}</span>
                                        </label>
                                    ))}
                                </div>
                                <InputError message={errors.roles} />
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
                                    {user ? 'Simpan' : 'Tambah'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function UsersIndex({
    users,
    roles,
    divisions,
    filters,
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const permissions = new Set(auth.permissions);
    const canCreate = permissions.has('user.create');
    const canUpdate = permissions.has('user.update');
    const canDelete = permissions.has('user.delete');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
    const [roleFilter, setRoleFilter] = useState(formSelectValue(filters.role));
    const [divisionFilter, setDivisionFilter] = useState(
        formSelectValue(filters.division_id),
    );

    const deleteUser = (user: ManagedUser) => {
        if (window.confirm(`Hapus user ${user.name}?`)) {
            router.delete(destroy.url(user.id), { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title="Users" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto bg-fog p-4 md:p-6">
                <PageHeader
                    eyebrow="Access control"
                    title="Users"
                    description="Kelola siapa yang bisa masuk, divisi asalnya, dan role akses yang dipakai di proses project."
                    meta={
                        <>
                            <span>{users.data.length} user tampil</span>
                            <span>{roles.length} role</span>
                            <span>{divisions.length} divisi</span>
                        </>
                    }
                    actions={
                        <>
                            <Button asChild variant="outline">
                                <a href={exportMethod.url({ query: filters })}>
                                    <Download />
                                    Export
                                </a>
                            </Button>
                            {canCreate && (
                                <Form
                                    {...importMethod.form()}
                                    options={{ preserveScroll: true }}
                                    encType="multipart/form-data"
                                >
                                    {({ processing }) => (
                                        <label>
                                            <input
                                                type="file"
                                                name="file"
                                                accept=".csv,text/csv"
                                                className="sr-only"
                                                onChange={(event) => {
                                                    event.currentTarget.form?.requestSubmit();
                                                }}
                                            />
                                            <Button
                                                asChild
                                                variant="outline"
                                                disabled={processing}
                                            >
                                                <span>
                                                    <Upload />
                                                    Import
                                                </span>
                                            </Button>
                                        </label>
                                    )}
                                </Form>
                            )}
                            {canCreate && (
                                <Button onClick={() => setIsCreateOpen(true)}>
                                    <Plus />
                                    Tambah User
                                </Button>
                            )}
                        </>
                    }
                />

                <Form
                    {...index.form()}
                    className="grid gap-3 rounded-sm border border-border bg-card p-4 md:grid-cols-[1fr_220px_220px_auto]"
                >
                    <Input
                        name="search"
                        defaultValue={filters.search ?? ''}
                        placeholder="Cari nama, email, atau NIK"
                    />
                    <FormSelect
                        name="role"
                        value={roleFilter}
                        onValueChange={setRoleFilter}
                        placeholder="Semua role"
                        options={roles.map((role) => ({
                            label: role,
                            value: role,
                        }))}
                    />
                    <FormSelect
                        name="division_id"
                        value={divisionFilter}
                        onValueChange={setDivisionFilter}
                        placeholder="Semua divisi"
                        options={divisions.map((division) => ({
                            label: division.name,
                            value: division.id,
                        }))}
                    />
                    <Button>Filter</Button>
                </Form>

                <TableCard>
                    {users.data.length === 0 ? (
                        <EmptyTableState
                            title="Tidak ada user"
                            description="Ubah filter pencarian atau tambahkan user baru."
                        />
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-fog text-left text-xs tracking-[0.12em] text-graphite uppercase">
                                <tr>
                                    <th className="px-5 py-4 font-medium">
                                        Nama
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Staff
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Divisi
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Role
                                    </th>
                                    {(canUpdate || canDelete) && (
                                        <th className="w-24 px-5 py-4 text-right font-medium">
                                            Aksi
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="border-t border-border/70 transition hover:bg-fog/70"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="font-medium text-ink">
                                                {user.name}
                                            </div>
                                            <div className="text-graphite">
                                                {user.email}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div>{user.staff_number}</div>
                                            <div className="text-graphite">
                                                {user.phone ?? '-'}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            {user.division?.name ?? '-'}
                                        </td>
                                        <td className="px-5 py-4">
                                            {user.roles
                                                .map((role) => role.name)
                                                .join(', ') || '-'}
                                        </td>
                                        {(canUpdate || canDelete) && (
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    {canUpdate && (
                                                        <Button
                                                            size="icon-sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                setEditingUser(
                                                                    user,
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
                                                                deleteUser(user)
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

                <PaginationLinks links={users.links} />
            </div>

            {canCreate && (
                <UserFormDialog
                    roles={roles}
                    divisions={divisions}
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                />
            )}
            {canUpdate && editingUser && (
                <UserFormDialog
                    roles={roles}
                    divisions={divisions}
                    user={editingUser}
                    open={!!editingUser}
                    onOpenChange={(open) => !open && setEditingUser(null)}
                />
            )}
        </>
    );
}

UsersIndex.layout = {
    breadcrumbs: [{ title: 'Users', href: index() }],
};
