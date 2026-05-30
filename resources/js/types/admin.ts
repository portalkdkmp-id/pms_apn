export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type Paginated<T> = {
    data: T[];
    links: PaginationLink[];
};

export type RoleSummary = {
    id: number;
    name: string;
};

export type PermissionSummary = {
    id: number;
    name: string;
};

export type ManagedUser = {
    id: string;
    name: string;
    email: string;
    staff_number: string;
    phone: string | null;
    roles: RoleSummary[];
};

export type Division = {
    id: string;
    name: string;
    code: string;
    description: string | null;
};

export type ManagedRole = {
    id: number;
    name: string;
    permissions: PermissionSummary[];
};
