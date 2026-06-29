import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export function PageHeader({
    eyebrow,
    title,
    description,
    meta,
    actions,
}: {
    eyebrow?: string;
    title: string;
    description?: string;
    meta?: ReactNode;
    actions?: ReactNode;
}) {
    return (
        <div className="rounded-sm border border-border bg-card p-5 shadow-[var(--shadow-subtle)] md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="max-w-2xl">
                    {eyebrow && (
                        <div className="mb-3 inline-flex items-center gap-2 rounded-sm border border-border bg-white px-2.5 py-1 text-xs font-medium text-graphite">
                            <span className="size-1.5 rounded-full bg-ember-orange" />
                            {eyebrow}
                        </div>
                    )}
                    <h1 className="font-heading text-3xl leading-[1.15] font-medium tracking-[-0.02em] text-ink md:text-5xl">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-2 text-sm leading-6 text-ash md:text-base">
                            {description}
                        </p>
                    )}
                    {meta && (
                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-graphite [&>span]:rounded-sm [&>span]:border [&>span]:border-border [&>span]:bg-smoke-50 [&>span]:px-2.5 [&>span]:py-1">
                            {meta}
                        </div>
                    )}
                </div>
                {actions && (
                    <div className="flex flex-wrap items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}

export function TableCard({ children }: { children: ReactNode }) {
    return <div className="overflow-x-auto bg-background">{children}</div>;
}

export function EmptyTableState({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="grid place-items-center border-b border-border px-4 py-14 text-center">
            <div>
                <div className="text-base font-medium text-ink">{title}</div>
                <p className="mt-1 text-sm text-graphite">{description}</p>
            </div>
        </div>
    );
}

export function PaginationLinks({ links }: { links: PaginationLink[] }) {
    if (links.length <= 3) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {links.map((link) => (
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
    );
}
