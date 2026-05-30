<?php

namespace App\Services;

use App\Models\Division;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\StreamedResponse;

class UserService
{
    /**
     * @return LengthAwarePaginator<int, User>
     */
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        return User::query()
            ->with(['division:id,name,slug', 'roles:id,name'])
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('staff_number', 'like', "%{$search}%");
                });
            })
            ->when($filters['role'] ?? null, fn ($query, string $role) => $query->role($role))
            ->when($filters['division_id'] ?? null, fn ($query, string $divisionId) => $query->where('division_id', $divisionId))
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

    public function export(array $filters = []): StreamedResponse
    {
        $users = User::query()
            ->with(['division:id,name', 'roles:id,name'])
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('staff_number', 'like', "%{$search}%");
                });
            })
            ->when($filters['role'] ?? null, fn ($query, string $role) => $query->role($role))
            ->when($filters['division_id'] ?? null, fn ($query, string $divisionId) => $query->where('division_id', $divisionId))
            ->orderBy('name')
            ->get();

        return response()->streamDownload(function () use ($users) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['name', 'email', 'staff_number', 'phone', 'division', 'roles']);

            foreach ($users as $user) {
                fputcsv($handle, [
                    $user->name,
                    $user->email,
                    $user->staff_number,
                    $user->phone,
                    $user->division?->name,
                    $user->roles->pluck('name')->implode('|'),
                ]);
            }

            fclose($handle);
        }, 'users.csv', ['Content-Type' => 'text/csv']);
    }

    public function import(UploadedFile $file): int
    {
        $handle = fopen($file->getRealPath(), 'r');
        $header = fgetcsv($handle);
        $count = 0;

        if ($header === false) {
            return 0;
        }

        while (($row = fgetcsv($handle)) !== false) {
            $data = array_combine($header, $row);

            if (! is_array($data) || blank($data['email'] ?? null)) {
                continue;
            }

            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'] ?? $data['email'],
                    'staff_number' => $data['staff_number'] ?? $data['email'],
                    'phone' => blank($data['phone'] ?? null) ? null : $data['phone'],
                    'division_id' => $this->resolveDivisionId($data['division'] ?? null),
                    'password' => Hash::make($data['password'] ?? 'password'),
                ],
            );

            if (! blank($data['roles'] ?? null)) {
                $user->syncRoles(explode('|', $data['roles']));
            }

            $count++;
        }

        fclose($handle);

        return $count;
    }

    private function resolveDivisionId(?string $division): ?string
    {
        if (blank($division)) {
            return null;
        }

        return Division::query()
            ->where('name', $division)
            ->orWhere('slug', $division)
            ->value('id');
    }
}
