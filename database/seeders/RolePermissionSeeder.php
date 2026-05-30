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
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $webPermissions = Permission::query()
            ->where('guard_name', 'web')
            ->whereIn('name', $permissions)
            ->get();

        foreach (['superadmin', 'direktur', 'vice_presiden', 'manager', 'staff'] as $roleName) {
            $role = Role::findOrCreate($roleName, 'web');

            if ($roleName === 'superadmin') {
                $role->syncPermissions($webPermissions);
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
