import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({
    alt = 'Agrinas',
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            {...props}
            src="/logo-agrinas.png"
            alt={alt}
            className={`object-contain bg-transparent ${props.className ?? ''}`}
        />
    );
}
