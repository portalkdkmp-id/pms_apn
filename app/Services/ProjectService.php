<?php

namespace App\Services;

use App\Models\Project;
use App\Models\ProjectStatus;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProjectService
{
    public function __construct(private readonly AttachmentService $attachmentService) {}

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
                'previousProject:id,code,title,status_id',
                'previousProject.status:id,name,slug,color',
                'status:id,name,color',
                'attachments:id,attachable_id,attachable_type,disk,path,original_name,mime_type,size,created_at',
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
    public function create(array $data, User $user): Project
    {
        return DB::transaction(function () use ($data, $user) {
            $files = $data['attachments'] ?? null;
            unset($data['attachments']);

            $data = $this->normalizeDependencyData($data);
            $this->ensureDependencyAllowsDoneStatus($data);

            $project = Project::create($data);
            $this->attachmentService->storeMany($project, $files, $user, 'attachments/projects');

            return $project;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Project $project, array $data, User $user): Project
    {
        $files = $data['attachments'] ?? null;
        unset($data['attachments']);

        $data = $this->normalizeDependencyData($data);
        $this->ensureParentCanBeAssigned($project, $data['parent_id'] ?? null);
        $this->ensurePreviousCanBeAssigned($project, $data['previous_project_id'] ?? null);
        $this->ensureDependencyAllowsDoneStatus($data, $project);

        DB::transaction(function () use ($project, $data, $files, $user) {
            $project->update($data);
            $this->attachmentService->storeMany($project, $files, $user, 'attachments/projects');
        });

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

    private function ensurePreviousCanBeAssigned(Project $project, ?string $previousProjectId): void
    {
        if (! $previousProjectId) {
            return;
        }

        if ($previousProjectId === $project->id) {
            throw ValidationException::withMessages([
                'previous_project_id' => 'Previous project tidak boleh project yang sama.',
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizeDependencyData(array $data): array
    {
        $data['requires_previous_project_done'] = (bool) ($data['requires_previous_project_done'] ?? false);

        if (! $data['requires_previous_project_done']) {
            $data['previous_project_id'] = null;
        }

        return $data;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function ensureDependencyAllowsDoneStatus(array $data, ?Project $project = null): void
    {
        $requiresPrevious = (bool) ($data['requires_previous_project_done'] ?? $project?->requires_previous_project_done);
        $previousProjectId = $data['previous_project_id'] ?? $project?->previous_project_id;
        $statusId = (int) ($data['status_id'] ?? $project?->status_id);

        if (! $requiresPrevious || ! $previousProjectId || ! $this->isDoneStatus($statusId)) {
            return;
        }

        $previousProject = Project::query()
            ->with('status:id,slug,name')
            ->find($previousProjectId);

        if ($previousProject?->status?->slug === 'done') {
            return;
        }

        throw ValidationException::withMessages([
            'status_id' => 'Project ini belum bisa Done karena previous project belum Done.',
        ]);
    }

    private function isDoneStatus(int $statusId): bool
    {
        return ProjectStatus::query()
            ->whereKey($statusId)
            ->where('slug', 'done')
            ->exists();
    }
}
