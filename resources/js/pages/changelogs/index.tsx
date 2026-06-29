import { Form, Head, router, usePage } from '@inertiajs/react';
import { CheckCircle2, Edit, Plus, Rocket, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    destroy,
    index,
    publish,
    store,
    update,
} from '@/actions/App/Http/Controllers/ChangelogController';
import {
    EmptyTableState,
    PageHeader,
    PaginationLinks,
} from '@/components/app-page';
import { FormSelect, formSelectValue } from '@/components/form-select';
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
import { Textarea } from '@/components/ui/textarea';
import type { Auth, Changelog, Paginated } from '@/types';

type Props = {
    changelogs: Paginated<Changelog>;
    types: Changelog['type'][];
};

type ChangelogFormDialogProps = {
    changelog?: Changelog;
    types: Changelog['type'][];
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function dateValue(value?: string | null): string {
    return value?.slice(0, 10) ?? '';
}

function formatDate(value?: string | null): string {
    const date = value ? new Date(value) : null;

    if (!date || Number.isNaN(date.getTime())) {
        return 'Draft';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

function changesText(changelog?: Changelog): string {
    return changelog?.changes.join('\n') ?? '';
}

function ChangelogFormDialog({
    changelog,
    types,
    open,
    onOpenChange,
}: ChangelogFormDialogProps) {
    const [type, setType] = useState(
        formSelectValue(changelog?.type ?? 'beta'),
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        {changelog ? 'Edit changelog' : 'Tambah changelog'}
                    </DialogTitle>
                    <DialogDescription>
                        Catat versi aplikasi dan perubahan yang akan dilihat
                        user.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...(changelog ? update.form(changelog.id) : store.form())}
                    onSuccess={() => onOpenChange(false)}
                    className="grid gap-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="version">Version</Label>
                                    <Input
                                        id="version"
                                        name="version"
                                        defaultValue={
                                            changelog?.version ?? '0.1b'
                                        }
                                        placeholder="0.1b"
                                        required
                                    />
                                    <InputError message={errors.version} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="type">Type</Label>
                                    <FormSelect
                                        id="type"
                                        name="type"
                                        value={type}
                                        onValueChange={setType}
                                        placeholder="Pilih type"
                                        options={types.map((item) => ({
                                            label: item,
                                            value: item,
                                        }))}
                                    />
                                    <InputError message={errors.type} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    defaultValue={changelog?.title}
                                    required
                                />
                                <InputError message={errors.title} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="summary">Summary</Label>
                                <Textarea
                                    id="summary"
                                    name="summary"
                                    defaultValue={changelog?.summary ?? ''}
                                    className="min-h-20"
                                />
                                <InputError message={errors.summary} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="changes_text">Changes</Label>
                                <Textarea
                                    id="changes_text"
                                    name="changes_text"
                                    defaultValue={changesText(changelog)}
                                    className="min-h-40"
                                    placeholder={
                                        'Tambah menu Changelog\nFix bug sorting task\nImprove UI approval'
                                    }
                                    required
                                />
                                <p className="text-xs text-graphite">
                                    Tulis satu perubahan per baris.
                                </p>
                                <InputError message={errors.changes} />
                            </div>

                            <div className="grid gap-4 rounded-sm border border-border bg-smoke-50 p-3 sm:grid-cols-2">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        name="is_published"
                                        value="1"
                                        defaultChecked={
                                            changelog?.is_published ?? false
                                        }
                                        className="size-4 rounded border-border"
                                    />
                                    <span>Publish sekarang</span>
                                </label>
                                <div className="grid gap-2">
                                    <Label htmlFor="released_at">
                                        Release date
                                    </Label>
                                    <Input
                                        id="released_at"
                                        name="released_at"
                                        type="date"
                                        defaultValue={dateValue(
                                            changelog?.released_at,
                                        )}
                                    />
                                    <InputError message={errors.released_at} />
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
                                    {changelog ? 'Simpan' : 'Tambah'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function ChangelogsIndex({ changelogs, types }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const permissions = new Set(auth.permissions);
    const canCreate = permissions.has('changelog.create');
    const canUpdate = permissions.has('changelog.update');
    const canDelete = permissions.has('changelog.delete');
    const canPublish = permissions.has('changelog.publish');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingChangelog, setEditingChangelog] = useState<Changelog | null>(
        null,
    );

    const deleteChangelog = (changelog: Changelog) => {
        if (window.confirm(`Hapus changelog ${changelog.version}?`)) {
            router.delete(destroy.url(changelog.id), {
                preserveScroll: true,
            });
        }
    };

    const publishChangelog = (changelog: Changelog) => {
        router.post(publish.url(changelog.id), undefined, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Changelog" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto bg-fog p-4 md:p-6">
                <PageHeader
                    eyebrow="Release notes"
                    title="Changelog"
                    description="Riwayat versi dan perubahan aplikasi yang sudah dirilis untuk user."
                    meta={
                        <>
                            <span>{changelogs.data.length} versi tampil</span>
                        </>
                    }
                    actions={
                        canCreate && (
                            <Button onClick={() => setIsCreateOpen(true)}>
                                <Plus />
                                Changelog baru
                            </Button>
                        )
                    }
                />

                {changelogs.data.length === 0 ? (
                    <div className="bg-white">
                        <EmptyTableState
                            title="Belum ada changelog"
                            description="Changelog yang dipublish akan muncul di sini."
                        />
                    </div>
                ) : (
                    <div className="divide-y divide-border bg-white">
                        {changelogs.data.map((changelog) => (
                            <article
                                key={changelog.id}
                                className="grid gap-4 px-5 py-5"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="grid gap-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-heading text-2xl font-medium text-ink">
                                                {changelog.version}
                                            </span>
                                            <Badge variant="outline">
                                                {changelog.type}
                                            </Badge>
                                            <Badge
                                                variant={
                                                    changelog.is_published
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                            >
                                                {changelog.is_published
                                                    ? 'Published'
                                                    : 'Draft'}
                                            </Badge>
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-medium text-ink">
                                                {changelog.title}
                                            </h2>
                                            <p className="text-sm text-graphite">
                                                {formatDate(
                                                    changelog.released_at,
                                                )}
                                                {changelog.creator
                                                    ? ` · ${changelog.creator.name}`
                                                    : ''}
                                            </p>
                                        </div>
                                    </div>

                                    {(canUpdate || canPublish || canDelete) && (
                                        <div className="flex gap-2">
                                            {canPublish &&
                                                !changelog.is_published && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            publishChangelog(
                                                                changelog,
                                                            )
                                                        }
                                                    >
                                                        <Rocket />
                                                        Publish
                                                    </Button>
                                                )}
                                            {canUpdate && (
                                                <Button
                                                    size="icon-sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setEditingChangelog(
                                                            changelog,
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
                                                        deleteChangelog(
                                                            changelog,
                                                        )
                                                    }
                                                >
                                                    <Trash2 />
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {changelog.summary && (
                                    <p className="max-w-3xl text-sm text-graphite">
                                        {changelog.summary}
                                    </p>
                                )}

                                <ul className="grid gap-2">
                                    {changelog.changes.map((change) => (
                                        <li
                                            key={change}
                                            className="flex gap-2 text-sm text-ink"
                                        >
                                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-pulse-green" />
                                            <span>{change}</span>
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                )}

                <PaginationLinks links={changelogs.links} />
            </div>

            {canCreate && (
                <ChangelogFormDialog
                    types={types}
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                />
            )}
            {canUpdate && editingChangelog && (
                <ChangelogFormDialog
                    types={types}
                    changelog={editingChangelog}
                    open={!!editingChangelog}
                    onOpenChange={(open) => !open && setEditingChangelog(null)}
                />
            )}
        </>
    );
}

ChangelogsIndex.layout = {
    breadcrumbs: [{ title: 'Changelog', href: index() }],
};
