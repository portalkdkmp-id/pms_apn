<?php

namespace App\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleService
{
    /**
     * @return LengthAwarePaginator<int, Role>
     */
    public function paginate(): LengthAwarePaginator
    {
        return Role::query()
            ->with('permissions:id,name')
            ->where('guard_name', 'web')
            ->latest()
            ->paginate(10)
            ->withQueryString();
    }

    /**
     * @return array<int, string>
     */
    public function permissions(): array
    {
        return Permission::query()
            ->where('guard_name', 'web')
            ->orderBy('name')
            ->pluck('name')
            ->all();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Role
    {
        return DB::transaction(function () use ($data) {
            $role = Role::create([
                'name' => $data['name'],
                'guard_name' => 'web',
            ]);

            $role->syncPermissions($data['permissions'] ?? []);
            app(PermissionRegistrar::class)->forgetCachedPermissions();

            return $role;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Role $role, array $data): Role
    {
        return DB::transaction(function () use ($role, $data) {
            $role->update(['name' => $data['name']]);
            $role->syncPermissions($data['permissions'] ?? []);
            app(PermissionRegistrar::class)->forgetCachedPermissions();

            return $role->refresh();
        });
    }

    public function delete(Role $role): void
    {
        DB::transaction(function () use ($role) {
            $role->delete();
            app(PermissionRegistrar::class)->forgetCachedPermissions();
        });
    }
}
