<?php

namespace App\Services;

use App\Models\ProjectStatus;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProjectStatusService
{
    /**
     * @return LengthAwarePaginator<int, ProjectStatus>
     */
    public function paginate(): LengthAwarePaginator
    {
        return ProjectStatus::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ProjectStatus
    {
        return ProjectStatus::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ProjectStatus $projectStatus, array $data): ProjectStatus
    {
        $projectStatus->update($data);

        return $projectStatus->refresh();
    }

    public function delete(ProjectStatus $projectStatus): void
    {
        $projectStatus->delete();
    }
}
