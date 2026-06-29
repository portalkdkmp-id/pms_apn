import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-9 items-center justify-center rounded-sm bg-sidebar-primary text-sidebar-primary-foreground shadow-[var(--shadow-subtle)]">
                <AppLogoIcon className="size-5 fill-current text-sidebar-primary-foreground" />
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
