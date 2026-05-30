<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class UserService
{
    /**
     * @return LengthAwarePaginator<int, User>
     */
    public function paginate(): LengthAwarePaginator
    {
        return User::query()
            ->with(['division:id,name,slug', 'roles:id,name'])
            ->latest()
            ->paginate(10)
            ->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = User::create(Arr::except($data, ['roles', 'password_confirmation']));
            $user->syncRoles($data['roles'] ?? []);

            return $user;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            $attributes = Arr::except($data, ['roles', 'password_confirmation']);

            if (blank($attributes['password'] ?? null)) {
                unset($attributes['password']);
            }

            $user->update($attributes);
            $user->syncRoles($data['roles'] ?? []);

            return $user->refresh();
        });
    }

    public function delete(User $user): void
    {
        DB::transaction(function () use ($user) {
            $user->syncRoles([]);
            $user->delete();
        });
    }
}
