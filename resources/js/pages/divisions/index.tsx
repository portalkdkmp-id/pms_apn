import { Form, Head, Link, router } from '@inertiajs/react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    destroy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/DivisionController';
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
import type { Division, Paginated } from '@/types';

type Props = {
    divisions: Paginated<Division>;
};

type DivisionFormDialogProps = {
    division?: Division;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function DivisionFormDialog({
    division,
    open,
    onOpenChange,
}: DivisionFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {division ? 'Edit division' : 'Tambah division'}
                    </DialogTitle>
                    <DialogDescription>
                        Kelola master division untuk struktur PMS.
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
                                <Label htmlFor="code">Kode</Label>
                                <Input
                                    id="code"
                                    name="code"
                                    defaultValue={division?.code}
                                    required
                                />
                                <InputError message={errors.code} />
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

export default function DivisionsIndex({ divisions }: Props) {
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

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Divisions</h1>
                        <p className="text-sm text-muted-foreground">
                            Kelola master division perusahaan.
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
                                        Kode
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Deskripsi
                                    </th>
                                    <th className="w-24 px-4 py-3 text-right font-medium">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {divisions.data.map((division) => (
                                    <tr key={division.id} className="border-t">
                                        <td className="px-4 py-3 font-medium">
                                            {division.name}
                                        </td>
                                        <td className="px-4 py-3">
                                            {division.code}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {division.description ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
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
                                                <Button
                                                    size="icon-sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        deleteDivision(division)
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
                    {divisions.links.map((link) => (
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

            <DivisionFormDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
            />
            {editingDivision && (
                <DivisionFormDialog
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
