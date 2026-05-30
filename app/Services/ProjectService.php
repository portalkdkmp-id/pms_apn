<?php

namespace App\Services;

use App\Models\Project;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ProjectService
{
    /**
     * @return LengthAwarePaginator<int, Project>
     */
    public function paginateFor(User $user): LengthAwarePaginator
    {
        $query = Project::query()
            ->with([
                'division:id,name,slug',
                'owner:id,name,email',
                'status:id,name,color',
            ])
            ->latest();

        if (! $user->can('project.view_all')) {
            $canViewDivision = $user->can('project.view_division') && $user->division_id !== null;
            $canViewAssigned = $user->can('project.view_assigned');

            if (! $canViewDivision && ! $canViewAssigned) {
                $query->whereRaw('1 = 0');
            } else {
                $query->where(function ($query) use ($user, $canViewDivision, $canViewAssigned) {
                    if ($canViewDivision) {
                        $query->orWhere('division_id', $user->division_id);
                    }

                    if ($canViewAssigned) {
                        $query->orWhere('owner_id', $user->id);
                    }
                });
            }
        }

        return $query->paginate(10)->withQueryString();
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
}
