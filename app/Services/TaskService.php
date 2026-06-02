<?php

namespace App\Services;

use App\Models\Project;
use App\Models\ProjectStatus;
use App\Models\Task;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TaskService
{
    public function __construct(private readonly AttachmentService $attachmentService) {}

    /**
     * @return LengthAwarePaginator<int, Task>
     */
    public function paginateFor(User $user): LengthAwarePaginator
    {
        $query = Task::query()
            ->with([
                'project:id,code,title,division_id',
                'parent:id,title',
                'previousTask:id,title,status_id',
                'previousTask.status:id,name,slug,color',
                'division:id,name',
                'assignee:id,name,email',
                'status:id,name,color',
                'subtasks:id,parent_id,title,status_id,assignee_id,kpi_point',
                'attachments:id,attachable_id,attachable_type,disk,path,original_name,mime_type,size,created_at',
            ])
            ->latest();

        if (! $user->can('task.view_all')) {
            $canViewDivision = $user->can('task.view_division') && $user->division_id !== null;
            $canViewAssigned = $user->can('task.view_assigned');

            if (! $canViewDivision && ! $canViewAssigned) {
                $query->whereRaw('1 = 0');
            } else {
                $query->where(function ($query) use ($user, $canViewDivision, $canViewAssigned) {
                    if ($canViewDivision) {
                        $query
                            ->orWhere('division_id', $user->division_id)
                            ->orWhereHas('project', fn ($query) => $query->where('division_id', $user->division_id));
                    }

                    if ($canViewAssigned) {
                        $query->orWhere('assignee_id', $user->id);
                    }
                });
            }
        }

        return $query->paginate(10)->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, User $user): Task
    {
        return DB::transaction(function () use ($data, $user) {
            $files = $data['attachments'] ?? null;
            unset($data['attachments']);

            $data = $this->normalizeDependencyData($this->withFallbackDivision($data));
            $this->ensureDependencyAllowsDoneStatus($data);

            $task = Task::create($data);
            $this->attachmentService->storeMany($task, $files, $user, 'attachments/tasks');

            return $task;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Task $task, array $data, User $user): Task
    {
        $files = $data['attachments'] ?? null;
        unset($data['attachments']);

        $data = $this->normalizeDependencyData($this->withFallbackDivision($data));
        $this->ensurePreviousCanBeAssigned($task, $data['previous_task_id'] ?? null, $data['project_id'] ?? null);
        $this->ensureDependencyAllowsDoneStatus($data, $task);

        DB::transaction(function () use ($task, $data, $files, $user) {
            $task->update($data);
            $this->attachmentService->storeMany($task, $files, $user, 'attachments/tasks');
        });

        return $task->refresh();
    }

    public function delete(Task $task): void
    {
        $task->delete();
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function withFallbackDivision(array $data): array
    {
        if (! empty($data['division_id'])) {
            return $data;
        }

        $projectId = $data['project_id'] ?? null;
        if ($projectId) {
            $data['division_id'] = Project::query()->whereKey($projectId)->value('division_id');
        }

        return $data;
    }

    private function ensurePreviousCanBeAssigned(Task $task, ?string $previousTaskId, ?string $projectId): void
    {
        if (! $previousTaskId) {
            return;
        }

        if ($previousTaskId === $task->id) {
            throw ValidationException::withMessages([
                'previous_task_id' => 'Previous task tidak boleh task yang sama.',
            ]);
        }

        if (
            $projectId &&
            Task::query()
                ->whereKey($previousTaskId)
                ->where('project_id', '!=', $projectId)
                ->exists()
        ) {
            throw ValidationException::withMessages([
                'previous_task_id' => 'Previous task harus berada pada project yang sama.',
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizeDependencyData(array $data): array
    {
        $data['requires_previous_task_done'] = (bool) ($data['requires_previous_task_done'] ?? false);

        if (! $data['requires_previous_task_done']) {
            $data['previous_task_id'] = null;
        }

        return $data;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function ensureDependencyAllowsDoneStatus(array $data, ?Task $task = null): void
    {
        $requiresPrevious = (bool) ($data['requires_previous_task_done'] ?? $task?->requires_previous_task_done);
        $previousTaskId = $data['previous_task_id'] ?? $task?->previous_task_id;
        $statusId = (int) ($data['status_id'] ?? $task?->status_id);

        if (! $requiresPrevious || ! $previousTaskId || ! $this->isDoneStatus($statusId)) {
            return;
        }

        $previousTask = Task::query()
            ->with('status:id,slug,name')
            ->find($previousTaskId);

        if ($previousTask?->status?->slug === 'done') {
            return;
        }

        throw ValidationException::withMessages([
            'status_id' => 'Task ini belum bisa Done karena previous task belum Done.',
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
