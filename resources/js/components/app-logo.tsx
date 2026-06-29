import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-9 items-center justify-center rounded-sm">
                <AppLogoIcon className="size-18 fill-current text-transparent" />
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="truncate leading-tight font-medium tracking-[-0.009em]">
                    PMS APN
                </span>
                <span className="truncate text-[11px] leading-tight text-graphite">
                    Project Suite
                </span>
            </div>
        </>
    );
}
