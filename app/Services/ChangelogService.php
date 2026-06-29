<?php

namespace App\Services;

use App\Models\Changelog;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ChangelogService
{
    /**
     * @return LengthAwarePaginator<int, Changelog>
     */
    public function paginateFor(User $user): LengthAwarePaginator
    {
        $query = Changelog::query()
            ->with('creator:id,name,email')
            ->latest('released_at')
            ->latest();

        if (! $user->can('changelog.manage')) {
            $query->where('is_published', true);
        }

        return $query->paginate(10)->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, User $user): Changelog
    {
        $data['created_by'] = $user->id;

        return Changelog::create($this->normalizePublication($data));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Changelog $changelog, array $data): Changelog
    {
        $changelog->update($this->normalizePublication($data, $changelog));

        return $changelog->refresh();
    }

    public function delete(Changelog $changelog): void
    {
        $changelog->delete();
    }

    public function publish(Changelog $changelog): Changelog
    {
        $changelog->forceFill([
            'is_published' => true,
            'released_at' => $changelog->released_at ?? now(),
        ])->save();

        return $changelog->refresh();
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizePublication(array $data, ?Changelog $changelog = null): array
    {
        if (($data['is_published'] ?? false) && empty($data['released_at'])) {
            $data['released_at'] = $changelog?->released_at ?? now();
        }

        if (! ($data['is_published'] ?? false)) {
            $data['released_at'] = $data['released_at'] ?? null;
        }

        return $data;
    }
}
