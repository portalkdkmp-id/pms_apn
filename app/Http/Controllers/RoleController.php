<?php

namespace App\Http\Controllers;

use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Requests\Role\UpdateRoleRequest;
use App\Services\RoleService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function __construct(private readonly RoleService $roleService) {}

    public function index(): Response
    {
        abort_unless(request()->user()?->hasRole('superadmin'), 403);

        return Inertia::render('roles/index', [
            'roles' => $this->roleService->paginate(),
            'permissions' => $this->roleService->permissions(),
        ]);
    }

    public function store(StoreRoleRequest $request): RedirectResponse
    {
        $this->roleService->create($request->validated());

        return to_route('roles.index')->with('success', 'Role berhasil dibuat.');
    }

    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        $this->roleService->update($role, $request->validated());

        return to_route('roles.index')->with('success', 'Role berhasil diperbarui.');
    }

    public function destroy(Role $role): RedirectResponse
    {
        abort_unless(request()->user()?->hasRole('superadmin'), 403);
        abort_if($role->name === 'superadmin', 422, 'Role superadmin tidak boleh dihapus.');

        $this->roleService->delete($role);

        return to_route('roles.index')->with('success', 'Role berhasil dihapus.');
    }
}
