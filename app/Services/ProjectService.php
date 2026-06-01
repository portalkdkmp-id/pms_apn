<?php

namespace App\Services;

use App\Models\Project;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProjectService
{
    /**
     * @return LengthAwarePaginator<int, Project>
     */
    public function paginateFor(User $user): LengthAwarePaginator
    {
        return $this->visibleQuery($user)
            ->with([
                'division:id,name,slug',
                'owner:id,name,email',
                'parent:id,code,title,division_id',
                'status:id,name,color',
            ])
            ->withCount('children')
            ->latest()
            ->paginate(10)
            ->withQueryString();
    }

    /**
     * @return Collection<int, Project>
     */
    public function parentOptionsFor(User $user): Collection
    {
        return $this->visibleQuery($user)
            ->orderBy('code')
            ->get(['id', 'code', 'title', 'division_id']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Project
    {
        return Project::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Project $project, array $data): Project
    {
        $this->ensureParentCanBeAssigned($project, $data['parent_id'] ?? null);

        $project->update($data);

        return $project->refresh();
    }

    public function delete(Project $project, User $deletedBy): void
    {
        DB::transaction(function () use ($project, $deletedBy) {
            $project->forceFill(['deleted_by' => $deletedBy->id])->save();
            $project->delete();
        });
    }

    private function visibleQuery(User $user): Builder
    {
        $query = Project::query();

        if ($user->can('project.view_all')) {
            return $query;
        }

        $canViewDivision = $user->can('project.view_division') && $user->division_id !== null;
        $canViewAssigned = $user->can('project.view_assigned');

        if (! $canViewDivision && ! $canViewAssigned) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where(function ($query) use ($user, $canViewDivision, $canViewAssigned) {
            if ($canViewDivision) {
                $query->orWhere('division_id', $user->division_id);
            }

            if ($canViewAssigned) {
                $query->orWhere('owner_id', $user->id);
            }
        });
    }

    private function ensureParentCanBeAssigned(Project $project, ?string $parentId): void
    {
        if (! $parentId) {
            return;
        }

        $ancestor = Project::query()->find($parentId, ['id', 'parent_id']);

        while ($ancestor) {
            if ($ancestor->id === $project->id) {
                throw ValidationException::withMessages([
                    'parent_id' => 'Parent project tidak boleh berasal dari child project sendiri.',
                ]);
            }

            $ancestor = $ancestor->parent_id
                ? Project::query()->find($ancestor->parent_id, ['id', 'parent_id'])
                : null;
        }
    }
}
