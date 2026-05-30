import { Form, Head, Link, router } from '@inertiajs/react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    destroy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/UserController';
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
import type { ManagedUser, Option, Paginated } from '@/types';

type Props = {
    users: Paginated<ManagedUser>;
    roles: string[];
    divisions: Option[];
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
                            <div className="grid gap-4 sm:grid-cols-2">
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
                                    <select
                                        id="division_id"
                                        name="division_id"
                                        defaultValue={user?.division_id ?? ''}
                                        className="h-8 rounded-2xl bg-input/50 px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                                    >
                                        <option value="">Tanpa divisi</option>
                                        {divisions.map((division) => (
                                            <option
                                                key={division.id}
                                                value={division.id}
                                            >
                                                {division.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.division_id} />
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

                            <div className="grid gap-2">
                                <Label>Roles</Label>
                                <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
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

export default function UsersIndex({ users, roles, divisions }: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

    const deleteUser = (user: ManagedUser) => {
        if (window.confirm(`Hapus user ${user.name}?`)) {
            router.delete(destroy.url(user.id), { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title="Users" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Users</h1>
                        <p className="text-sm text-muted-foreground">
                            Kelola akun, divisi, dan role pengguna aplikasi.
                        </p>
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus />
                        Tambah
                    </Button>
                </div>

                <div className="overflow-hidden rounded-lg border">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/60 text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        Nama
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Staff
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Divisi
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Role
                                    </th>
                                    <th className="w-24 px-4 py-3 text-right font-medium">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.map((user) => (
                                    <tr key={user.id} className="border-t">
                                        <td className="px-4 py-3">
                                            <div className="font-medium">
                                                {user.name}
                                            </div>
                                            <div className="text-muted-foreground">
                                                {user.email}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>{user.staff_number}</div>
                                            <div className="text-muted-foreground">
                                                {user.phone ?? '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {user.division?.name ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {user.roles
                                                .map((role) => role.name)
                                                .join(', ') || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="icon-sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setEditingUser(user)
                                                    }
                                                >
                                                    <Edit />
                                                </Button>
                                                <Button
                                                    size="icon-sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        deleteUser(user)
                                                    }
                                                >
                                                    <Trash2 />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {users.links.map((link) => (
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

            <UserFormDialog
                roles={roles}
                divisions={divisions}
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
            />
            {editingUser && (
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
