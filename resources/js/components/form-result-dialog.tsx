import { CircleCheck, OctagonX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export type FormResult = {
    type: 'success' | 'error';
    title: string;
    message: string;
};

export type FormErrors = Record<string, string | string[] | undefined>;

export function firstErrorMessage(
    errors: FormErrors,
    fallback = 'Data belum bisa disimpan. Periksa kembali field yang ditandai.',
): string {
    const firstError = Object.values(errors)[0];

    if (Array.isArray(firstError)) {
        return firstError[0] ?? fallback;
    }

    return firstError ?? fallback;
}

export function FormResultDialog({
    result,
    onOpenChange,
}: {
    result: FormResult | null;
    onOpenChange: (open: boolean) => void;
}) {
    const isSuccess = result?.type === 'success';
    const Icon = isSuccess ? CircleCheck : OctagonX;

    return (
        <Dialog open={!!result} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                {result && (
                    <>
                        <DialogHeader>
                            <div
                                className={`mb-2 flex size-10 items-center justify-center rounded-sm border ${
                                    isSuccess
                                        ? 'border-pulse-green/20 bg-green-50 text-pulse-green'
                                        : 'border-destructive/20 bg-destructive/10 text-destructive'
                                }`}
                            >
                                <Icon className="size-5" />
                            </div>
                            <DialogTitle>{result.title}</DialogTitle>
                            <DialogDescription>
                                {result.message}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button onClick={() => onOpenChange(false)}>
                                OK
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
