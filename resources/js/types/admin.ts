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

export type Attachment = {
    id: string;
    original_name: string;
    mime_type: string | null;
    size: number;
    url: string;
    created_at: string;
};

export type Project = {
    id: string;
    code: string;
    parent_id: string | null;
    title: string;
    description: string | null;
    division_id: string;
    owner_id: string;
    status_id: number;
    priority: string;
    kpi_target: string | null;
    start_date: string | null;
    end_date: string | null;
    expected_deadline: string | null;
    requires_previous_project_done: boolean;
    previous_project_id: string | null;
    division?: Option | null;
    parent?: Pick<Project, 'id' | 'code' | 'title' | 'division_id'> | null;
    previous_project?: Pick<Project, 'id' | 'code' | 'title' | 'status_id'> & {
        status?: Pick<ProjectStatus, 'id' | 'name' | 'slug' | 'color'> | null;
    };
    owner?: OptionUser | null;
    status?: Pick<ProjectStatus, 'id' | 'name' | 'slug' | 'color'> | null;
    attachments?: Attachment[];
    children_count?: number;
};

export type Team = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    project_id: string;
    leader_id: string | null;
    project?: Pick<Project, 'id' | 'code' | 'title'> | null;
    leader?: OptionUser | null;
    members: OptionUser[];
};

export type Task = {
    id: string;
    project_id: string;
    parent_id: string | null;
    division_id: string | null;
    assignee_id: string | null;
    status_id: number;
    title: string;
    description: string | null;
    priority: string;
    kpi_point: string;
    start_date: string | null;
    due_date: string | null;
    completed_at: string | null;
    approved_at: string | null;
    requires_previous_task_done: boolean;
    previous_task_id: string | null;
    project?:
        | (Pick<
              Project,
              | 'id'
              | 'code'
              | 'title'
              | 'description'
              | 'division_id'
              | 'owner_id'
              | 'status_id'
              | 'priority'
              | 'start_date'
              | 'end_date'
              | 'expected_deadline'
          > & {
              division?: Option | null;
              owner?: OptionUser | null;
              status?: Pick<
                  ProjectStatus,
                  'id' | 'name' | 'slug' | 'color'
              > | null;
          })
        | null;
    parent?: Pick<Task, 'id' | 'title'> | null;
    previous_task?: Pick<Task, 'id' | 'title' | 'status_id'> & {
        status?: Pick<ProjectStatus, 'id' | 'name' | 'slug' | 'color'> | null;
    };
    division?: Option | null;
    assignee?: OptionUser | null;
    status?: Pick<ProjectStatus, 'id' | 'name' | 'slug' | 'color'> | null;
    attachments?: Attachment[];
    subtasks?: Task[];
};

export type TaskProject = OptionProject & {
    division_id: string;
    teams: Array<{
        id: string;
        members: OptionUser[];
    }>;
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

export type OptionProject = {
    id: string;
    code: string;
    title: string;
};
