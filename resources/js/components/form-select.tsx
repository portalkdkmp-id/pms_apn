import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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
