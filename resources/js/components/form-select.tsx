import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export type FormSelectOption = {
    label: string;
    value: string;
};

type FormSelectProps = {
    id?: string;
    name: string;
    value: string;
    onValueChange: (value: string) => void;
    options: FormSelectOption[];
    placeholder: string;
    className?: string;
    disabled?: boolean;
};

const EMPTY_VALUE = '__empty__';

export function formSelectValue(value?: string | number | null): string {
    return value === undefined || value === null || value === ''
        ? EMPTY_VALUE
        : String(value);
}

export function formSelectInputValue(value: string): string {
    return value === EMPTY_VALUE ? '' : value;
}

export function FormSelect({
    id,
    name,
    value,
    onValueChange,
    options,
    placeholder,
    className = 'w-full',
    disabled = false,
}: FormSelectProps) {
    return (
        <>
            <input
                type="hidden"
                name={name}
                value={formSelectInputValue(value)}
            />
            <Select
                value={value}
                onValueChange={onValueChange}
                disabled={disabled}
            >
                <SelectTrigger id={id} className={className}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={EMPTY_VALUE}>{placeholder}</SelectItem>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </>
    );
}

type SearchableFormSelectProps = FormSelectProps & {
    searchPlaceholder?: string;
    emptyMessage?: string;
};

export function SearchableFormSelect({
    id,
    name,
    value,
    onValueChange,
    options,
    placeholder,
    className = 'w-full',
    disabled = false,
    searchPlaceholder = 'Cari opsi...',
    emptyMessage = 'Tidak ada opsi.',
}: SearchableFormSelectProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find((option) => option.value === value);
    const filteredOptions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        if (!normalizedQuery) {
            return options;
        }

        return options.filter((option) =>
            option.label.toLowerCase().includes(normalizedQuery),
        );
    }, [options, query]);

    useEffect(() => {
        const closeOnOutsideClick = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', closeOnOutsideClick);

        return () => {
            document.removeEventListener('mousedown', closeOnOutsideClick);
        };
    }, []);

    const selectValue = (nextValue: string) => {
        onValueChange(nextValue);
        setQuery('');
        setOpen(false);
    };

    return (
        <div ref={containerRef} className={cn('relative', className)}>
            <input
                type="hidden"
                name={name}
                value={formSelectInputValue(value)}
            />
            <button
                id={id}
                type="button"
                disabled={disabled}
                className={cn(
                    'flex h-9 w-full items-center justify-between gap-2 rounded-sm border border-input bg-white px-3 py-2 text-left text-sm transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/10 disabled:cursor-not-allowed disabled:opacity-50',
                    !selectedOption && 'text-muted-foreground',
                )}
                onClick={() => setOpen((current) => !current)}
            >
                <span className="truncate">
                    {selectedOption?.label ?? placeholder}
                </span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            </button>
            {open && !disabled && (
                <div className="absolute z-50 mt-1 grid max-h-72 w-full gap-1 overflow-hidden rounded-sm border border-border bg-popover p-1 text-popover-foreground shadow-[var(--shadow-product)]">
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={searchPlaceholder}
                            className="pl-8"
                            autoFocus
                        />
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                        <button
                            type="button"
                            className="flex min-h-8 w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent"
                            onClick={() => selectValue(EMPTY_VALUE)}
                        >
                            <span className="truncate">{placeholder}</span>
                            {value === EMPTY_VALUE && (
                                <Check className="size-4" />
                            )}
                        </button>
                        {filteredOptions.length === 0 ? (
                            <div className="px-2 py-3 text-sm text-muted-foreground">
                                {emptyMessage}
                            </div>
                        ) : (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className="flex min-h-8 w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                                    onClick={() => selectValue(option.value)}
                                >
                                    <span className="truncate">
                                        {option.label}
                                    </span>
                                    {value === option.value && (
                                        <Check className="size-4" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
