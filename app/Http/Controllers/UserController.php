<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\ImportUsersRequest;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\Division;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpFoundation\StreamedResponse;

class UserController extends Controller
{
    public function __construct(private readonly UserService $userService) {}

    public function index(Request $request): Response
    {
        abort_unless(request()->user()?->can('user.view'), 403);

        return Inertia::render('users/index', [
            'users' => $this->userService->paginate($request->only(['search', 'role', 'division_id'])),
            'roles' => Role::query()
                ->where('guard_name', 'web')
                ->orderBy('name')
                ->pluck('name'),
            'divisions' => Division::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'filters' => $request->only(['search', 'role', 'division_id']),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->userService->create($request->validated());

        return to_route('users.index')->with('success', 'User berhasil dibuat.');
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->userService->update($user, $request->validated());

        return to_route('users.index')->with('success', 'User berhasil diperbarui.');
    }

    public function destroy(User $user): RedirectResponse
    {
        abort_unless(request()->user()?->can('user.delete'), 403);
        abort_if(request()->user()?->is($user), 422, 'Kamu tidak bisa menghapus user yang sedang login.');

        $this->userService->delete($user);

        return to_route('users.index')->with('success', 'User berhasil dihapus.');
    }

    public function export(Request $request): StreamedResponse
    {
        abort_unless($request->user()?->can('user.view'), 403);

        return $this->userService->export($request->only(['search', 'role', 'division_id']));
    }

    public function import(ImportUsersRequest $request): RedirectResponse
    {
        $count = $this->userService->import($request->file('file'));

        return to_route('users.index')->with('success', "{$count} user berhasil diimport.");
    }
}
