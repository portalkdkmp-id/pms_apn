import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    destroy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/TeamController';
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
import type { Auth, OptionProject, OptionUser, Paginated, Team } from '@/types';

type Props = {
    teams: Paginated<Team>;
    projects: OptionProject[];
    users: OptionUser[];
};

type TeamFormDialogProps = {
    projects: OptionProject[];
    users: OptionUser[];
    team?: Team;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function TeamFormDialog({
    projects,
    users,
    team,
    open,
    onOpenChange,
}: TeamFormDialogProps) {
    const selectedMemberIds = team?.members.map((member) => member.id) ?? [];
    const [projectId, setProjectId] = useState(
        formSelectValue(team?.project_id),
    );
    const [leaderId, setLeaderId] = useState(formSelectValue(team?.leader_id));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        {team ? 'Edit team' : 'Tambah team'}
                    </DialogTitle>
                    <DialogDescription>
                        Kelola team yang menangani project.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...(team ? update.form(team.id) : store.form())}
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
                                        defaultValue={team?.name}
                                        required
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="slug">Slug</Label>
                                    <Input
                                        id="slug"
                                        name="slug"
                                        defaultValue={team?.slug}
                                        required
                                    />
                                    <InputError message={errors.slug} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="project_id">Project</Label>
                                    <FormSelect
                                        id="project_id"
                                        name="project_id"
                                        value={projectId}
                                        onValueChange={setProjectId}
                                        placeholder="Pilih project"
                                        options={projects.map((project) => ({
                                            label: `${project.code} - ${project.title}`,
                                            value: project.id,
                                        }))}
                                    />
                                    <InputError message={errors.project_id} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="leader_id">Leader</Label>
                                    <FormSelect
                                        id="leader_id"
                                        name="leader_id"
                                        value={leaderId}
                                        onValueChange={setLeaderId}
                                        placeholder="Tanpa leader"
                                        options={users.map((user) => ({
                                            label: user.name,
                                            value: user.id,
                                        }))}
                                    />
                                    <InputError message={errors.leader_id} />
                                </div>
                                <div className="grid gap-2 sm:col-span-2">
                                    <Label htmlFor="description">
                                        Deskripsi
                                    </Label>
                                    <Input
                                        id="description"
                                        name="description"
                                        defaultValue={team?.description ?? ''}
                                    />
                                    <InputError message={errors.description} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Members</Label>
                                <div className="grid max-h-56 gap-2 overflow-y-auto rounded-lg border p-3 sm:grid-cols-2">
                                    {users.map((user) => (
                                        <label
                                            key={user.id}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <input
                                                type="checkbox"
                                                name="member_ids[]"
                                                value={user.id}
                                                defaultChecked={selectedMemberIds.includes(
                                                    user.id,
                                                )}
                                                className="size-4 rounded border-border"
                                            />
                                            <span>{user.name}</span>
                                        </label>
                                    ))}
                                </div>
                                <InputError message={errors.member_ids} />
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
                                    {team ? 'Simpan' : 'Tambah'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function TeamsIndex({ teams, projects, users }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const permissions = new Set(auth.permissions);
    const canCreate = permissions.has('team.create');
    const canUpdate = permissions.has('team.update');
    const canDelete = permissions.has('team.delete');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);

    const deleteTeam = (team: Team) => {
        if (window.confirm(`Hapus team ${team.name}?`)) {
            router.delete(destroy.url(team.id), { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title="Teams" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Teams</h1>
                        <p className="text-sm text-muted-foreground">
                            Kelola team yang menangani project.
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
                                        Team
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Project
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Leader
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Members
                                    </th>
                                    {(canUpdate || canDelete) && (
                                        <th className="w-24 px-4 py-3 text-right font-medium">
                                            Aksi
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {teams.data.map((team) => (
                                    <tr key={team.id} className="border-t">
                                        <td className="px-4 py-3">
                                            <div className="font-medium">
                                                {team.name}
                                            </div>
                                            <div className="text-muted-foreground">
                                                {team.slug}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {team.project
                                                ? `${team.project.code} - ${team.project.title}`
                                                : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {team.leader?.name ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {team.members
                                                .map((member) => member.name)
                                                .join(', ') || '-'}
                                        </td>
                                        {(canUpdate || canDelete) && (
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    {canUpdate && (
                                                        <Button
                                                            size="icon-sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                setEditingTeam(
                                                                    team,
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
                                                                deleteTeam(team)
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
                    {teams.links.map((link) => (
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
                <TeamFormDialog
                    projects={projects}
                    users={users}
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                />
            )}
            {canUpdate && editingTeam && (
                <TeamFormDialog
                    projects={projects}
                    users={users}
                    team={editingTeam}
                    open={!!editingTeam}
                    onOpenChange={(open) => !open && setEditingTeam(null)}
                />
            )}
        </>
    );
}

TeamsIndex.layout = {
    breadcrumbs: [{ title: 'Teams', href: index() }],
};
