import { Form, Head, router, usePage } from '@inertiajs/react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    destroy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/TeamController';
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
import { slugify } from '@/lib/slug';
import type { Auth, OptionProject, OptionUser, Paginated, Team } from '@/types';

type Props = {
    teams: Paginated<Team>;
    teamOptions: Pick<Team, 'id' | 'name' | 'slug'>[];
    projects: OptionProject[];
    users: OptionUser[];
};

type TeamFormDialogProps = {
    projects: OptionProject[];
    users: OptionUser[];
    teamOptions: Pick<Team, 'id' | 'name' | 'slug'>[];
    team?: Team;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function TeamFormDialog({
    projects,
    users,
    teamOptions,
    team,
    open,
    onOpenChange,
}: TeamFormDialogProps) {
    const selectedMemberIds = team?.members.map((member) => member.id) ?? [];
    const [name, setName] = useState(team?.name ?? '');
    const [projectId, setProjectId] = useState(
        formSelectValue(team?.project_id),
    );
    const [leaderId, setLeaderId] = useState(formSelectValue(team?.leader_id));
    const slug = slugify(name);
    const duplicateName = teamOptions.some(
        (option) =>
            option.id !== team?.id &&
            option.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );

    useEffect(() => {
        if (!open) {
            return;
        }

        setName(team?.name ?? '');
        setProjectId(formSelectValue(team?.project_id));
        setLeaderId(formSelectValue(team?.leader_id));
    }, [open, team]);

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
                            <div className="grid gap-4 rounded-sm border border-border bg-smoke-50 p-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <div className="text-sm font-medium text-ink">
                                        Informasi team
                                    </div>
                                    <p className="text-xs text-graphite">
                                        Hubungkan team ke project dan leader
                                        agar assignment lebih jelas.
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nama</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={name}
                                        onChange={(event) =>
                                            setName(event.target.value)
                                        }
                                        required
                                    />
                                    <InputError
                                        message={
                                            duplicateName
                                                ? 'Nama team sudah ada di database.'
                                                : errors.name
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="slug">Slug</Label>
                                    <Input
                                        id="slug"
                                        name="slug"
                                        value={slug}
                                        readOnly
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

                            <div className="grid gap-2 rounded-sm border border-border bg-smoke-50 p-4">
                                <Label>Members</Label>
                                <div className="grid max-h-56 gap-2 overflow-y-auto rounded-sm border border-border bg-white p-3 sm:grid-cols-2">
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
                                <Button disabled={processing || duplicateName}>
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

export default function TeamsIndex({
    teams,
    teamOptions,
    projects,
    users,
}: Props) {
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

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto bg-fog p-4 md:p-6">
                <PageHeader
                    eyebrow="People assignment"
                    title="Teams"
                    description="Susun team per project agar leader, member, dan tanggung jawab pekerjaan mudah ditemukan."
                    meta={
                        <>
                            <span>{teams.data.length} team tampil</span>
                            <span>{projects.length} project</span>
                            <span>{users.length} user tersedia</span>
                        </>
                    }
                    actions={
                        canCreate && (
                            <Button onClick={() => setIsCreateOpen(true)}>
                                <Plus />
                                Team baru
                            </Button>
                        )
                    }
                />

                <TableCard>
                    {teams.data.length === 0 ? (
                        <EmptyTableState
                            title="Belum ada team"
                            description="Buat team untuk mengelompokkan member berdasarkan project."
                        />
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-fog text-left text-xs tracking-[0.12em] text-graphite uppercase">
                                <tr>
                                    <th className="px-5 py-4 font-medium">
                                        Team
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Project
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Leader
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Members
                                    </th>
                                    {(canUpdate || canDelete) && (
                                        <th className="w-24 px-5 py-4 text-right font-medium">
                                            Aksi
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {teams.data.map((team) => (
                                    <tr
                                        key={team.id}
                                        className="border-t border-border/70 transition hover:bg-fog/70"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="font-medium text-ink">
                                                {team.name}
                                            </div>
                                            <div className="text-graphite">
                                                {team.slug}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            {team.project
                                                ? `${team.project.code} - ${team.project.title}`
                                                : '-'}
                                        </td>
                                        <td className="px-5 py-4">
                                            {team.leader?.name ?? '-'}
                                        </td>
                                        <td className="px-5 py-4">
                                            {team.members
                                                .map((member) => member.name)
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
                    )}
                </TableCard>

                <PaginationLinks links={teams.links} />
            </div>

            {canCreate && (
                <TeamFormDialog
                    projects={projects}
                    users={users}
                    teamOptions={teamOptions}
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                />
            )}
            {canUpdate && editingTeam && (
                <TeamFormDialog
                    projects={projects}
                    users={users}
                    teamOptions={teamOptions}
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
