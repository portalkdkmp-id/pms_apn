<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Seed default roles and permissions.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            'dashboard.view',
            'user.view',
            'user.create',
            'user.update',
            'user.delete',
            'role.view',
            'role.create',
            'role.update',
            'role.delete',
            'permission.view',
            'permission.create',
            'permission.update',
            'permission.delete',
            'division.view',
            'division.create',
            'division.update',
            'division.delete',
            'project_status.view',
            'project_status.create',
            'project_status.update',
            'project_status.delete',
            'project.view',
            'project.create',
            'project.update',
            'project.delete',
            'project.view_all',
            'project.view_division',
            'project.view_assigned',
            'team.view',
            'team.create',
            'team.update',
            'team.delete',
            'task.view',
            'task.create',
            'task.update',
            'task.delete',
            'task.view_all',
            'task.view_division',
            'task.view_assigned',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $webPermissions = Permission::query()
            ->where('guard_name', 'web')
            ->whereIn('name', $permissions)
            ->get();

        $rolePermissions = [
            'superadmin' => $permissions,
            'direktur' => [
                'dashboard.view',
                'user.view',
                'division.view',
                'project_status.view',
                'project.view',
                'project.view_all',
                'team.view',
                'task.view',
                'task.view_all',
            ],
            'vice_presiden' => [
                'dashboard.view',
                'user.view',
                'division.view',
                'project_status.view',
                'project.view',
                'project.view_all',
                'team.view',
                'task.view',
                'task.create',
                'task.update',
                'task.delete',
                'task.view_all',
            ],
            'manager' => [
                'dashboard.view',
                'division.view',
                'project_status.view',
                'project.view',
                'project.create',
                'project.update',
                'project.delete',
                'project.view_division',
                'team.view',
                'team.create',
                'team.update',
                'team.delete',
                'task.view',
                'task.create',
                'task.update',
                'task.delete',
                'task.view_division',
            ],
            'staff' => [
                'dashboard.view',
                'project.view',
                'project.update',
                'project.view_assigned',
                'team.view',
                'task.view',
                'task.update',
                'task.view_assigned',
            ],
        ];

        foreach (array_keys($rolePermissions) as $roleName) {
            $role = Role::findOrCreate($roleName, 'web');
            $role->syncPermissions($webPermissions->whereIn('name', $rolePermissions[$roleName]));
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
