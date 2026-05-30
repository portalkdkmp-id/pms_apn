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
    division_id: string | null;
    division?: Option | null;
    roles: RoleSummary[];
};

export type Division = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    manager_id: string | null;
    manager?: OptionUser | null;
};

export type ManagedRole = {
    id: number;
    name: string;
    permissions: PermissionSummary[];
};

export type ProjectStatus = {
    id: number;
    name: string;
    slug: string;
    color: string;
    sort_order: number;
    is_active: boolean;
};

export type Project = {
    id: string;
    code: string;
    title: string;
    description: string | null;
    division_id: string;
    owner_id: string;
    status_id: number;
    priority: string;
    kpi_value: string | null;
    kpi_target: string | null;
    start_date: string | null;
    end_date: string | null;
    expected_deadline: string | null;
    division?: Option | null;
    owner?: OptionUser | null;
    status?: Pick<ProjectStatus, 'id' | 'name' | 'color'> | null;
};

export type Option = {
    id: string;
    name: string;
};

export type OptionUser = {
    id: string;
    name: string;
    email?: string;
    division_id?: string | null;
};
