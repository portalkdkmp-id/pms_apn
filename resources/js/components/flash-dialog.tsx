import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    firstErrorMessage,
    type FormErrors,
} from '@/components/form-result-dialog';

type FlashProps = {
    flash?: {
        success?: string | null;
        error?: string | null;
    };
    errors?: FormErrors;
};

export function FlashDialog() {
    const { flash, errors } = usePage<FlashProps>().props;
    const [lastMessage, setLastMessage] = useState<string | null>(null);

    useEffect(() => {
        if (flash?.success) {
            setLastMessage(flash.success);
            toast.success('Berhasil', {
                description: flash.success,
            });
        }
    }, [flash?.success]);

    useEffect(() => {
        if (flash?.error) {
            setLastMessage(flash.error);
            toast.error('Gagal', {
                description: flash.error,
            });
        }
    }, [flash?.error]);

    useEffect(() => {
        if (errors && Object.keys(errors).length > 0) {
            const message = firstErrorMessage(errors);

            if (message === lastMessage) {
                return;
            }

            setLastMessage(message);
            toast.error('Form gagal disimpan', {
                description: message,
            });
        }
    }, [errors, lastMessage]);

    return null;
}
