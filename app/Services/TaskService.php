<?php

namespace App\Services;

use App\Models\Project;
use App\Models\ProjectStatus;
use App\Models\Task;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TaskService
{
    public function __construct(private readonly AttachmentService $attachmentService) {}

    /**
     * @return LengthAwarePaginator<int, Task>
     */
    public function paginateFor(User $user, ?string $sort = null, ?string $direction = null): LengthAwarePaginator
    {
        $query = $this->visibleQuery($user)
            ->with([
                'project:id,code,title,description,division_id,owner_id,status_id,priority,start_date,end_date,expected_deadline',
                'project.division:id,name',
                'project.owner:id,name,email',
                'project.status:id,name,slug,color',
                'parent:id,title',
                'previousTask:id,title,status_id',
                'previousTask.status:id,name,slug,color',
                'division:id,name',
                'assignee:id,name,email',
                'status:id,name,slug,color',
                'subtasks' => fn ($query) => $query
                    ->with([
                        'project:id,code,title,description,division_id,owner_id,status_id,priority,start_date,end_date,expected_deadline',
                        'project.division:id,name',
                        'project.owner:id,name,email',
                        'project.status:id,name,slug,color',
                        'parent:id,title',
                        'division:id,name',
                        'assignee:id,name,email',
                        'status:id,name,slug,color',
                    ])
                    ->orderBy('due_date')
                    ->orderBy('title'),
                'attachments:id,attachable_id,attachable_type,disk,path,original_name,mime_type,size,created_at',
            ]);

        $this->applySorting($query, $sort, $direction);

        return $query
            ->paginate(10)
            ->withQueryString();
    }

    /**
     * @return LengthAwarePaginator<int, Task>
     */
    public function pendingApprovalFor(User $user): LengthAwarePaginator
    {
        $waitingApprovalStatusId = $this->statusId('waiting-approval');

        return $this->approvalQuery($user)
            ->where('status_id', $waitingApprovalStatusId ?? 0)
            ->with([
                'project:id,code,title,division_id',
                'division:id,name',
                'assignee:id,name,email',
                'status:id,name,slug,color',
            ])
            ->orderBy('due_date')
            ->orderBy('title')
            ->paginate(10)
            ->withQueryString();
    }

    public function approve(Task $task, User $user): Task
    {
        $doneStatusId = $this->statusId('done');

        if (! $doneStatusId) {
            throw ValidationException::withMessages([
                'status_id' => 'Status Done belum tersedia.',
            ]);
        }

        $this->ensureCanApprove($task, $user);

        $task->forceFill([
            'status_id' => $doneStatusId,
            'completed_at' => $task->completed_at ?? now(),
            'approved_at' => now(),
        ])->save();

        return $task->refresh();
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
            $data = $this->normalizeApprovalData($data, $user);

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
        $data = $this->normalizeApprovalData($data, $user, $task);

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

    private function visibleQuery(User $user): Builder
    {
        $query = Task::query();

        if ($user->can('task.view_all')) {
            return $query;
        }

        $assignedOnly = $user->can('task.view_assigned')
            && ! $user->can('task.update_division')
            && ! $user->can('task.view_all');
        $canViewDivision = ! $assignedOnly && $user->can('task.view_division') && $user->division_id !== null;
        $canViewAssigned = $user->can('task.view_assigned');

        if (! $canViewDivision && ! $canViewAssigned) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where(function (Builder $query) use ($user, $canViewDivision, $canViewAssigned) {
            if ($canViewDivision) {
                $query
                    ->orWhere('division_id', $user->division_id)
                    ->orWhereHas('project', fn (Builder $query) => $query->where('division_id', $user->division_id));
            }

            if ($canViewAssigned) {
                $query->orWhere('assignee_id', $user->id);
            }
        });
    }

    private function approvalQuery(User $user): Builder
    {
        $query = Task::query();

        if ($user->can('task.view_all')) {
            return $query;
        }

        if ($user->division_id === null) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where(function (Builder $query) use ($user) {
            $query
                ->where('division_id', $user->division_id)
                ->orWhereHas('project', fn (Builder $query) => $query->where('division_id', $user->division_id));
        });
    }

    private function ensureCanApprove(Task $task, User $user): void
    {
        if (! $user->can('task.approve')) {
            abort(403);
        }

        if ($user->can('task.view_all')) {
            return;
        }

        $taskDivisionId = $task->division_id ?? $task->project()->value('division_id');

        abort_unless($user->division_id !== null && $taskDivisionId === $user->division_id, 403);
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

    private function applySorting(Builder $query, ?string $sort, ?string $direction): void
    {
        $direction = $direction === 'asc' ? 'asc' : 'desc';

        match ($sort) {
            'title' => $query->orderBy('title', $direction),
            'project' => $query->orderBy(
                Project::query()
                    ->select('code')
                    ->whereColumn('projects.id', 'tasks.project_id'),
                $direction,
            ),
            'status' => $query->orderBy(
                ProjectStatus::query()
                    ->select('name')
                    ->whereColumn('project_statuses.id', 'tasks.status_id'),
                $direction,
            ),
            'kpi' => $query->orderBy('kpi_point', $direction),
            'due' => $query->orderBy('due_date', $direction),
            'approved' => $query->orderBy('approved_at', $direction),
            default => $query->latest(),
        };
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizeApprovalData(array $data, User $user, ?Task $task = null): array
    {
        $statusId = (int) ($data['status_id'] ?? $task?->status_id);
        $doneStatusId = $this->statusId('done');
        $waitingApprovalStatusId = $this->statusId('waiting-approval');

        if ($doneStatusId && $statusId === $doneStatusId) {
            $data['completed_at'] = $data['completed_at'] ?? now();

            if ($task?->approved_at) {
                $data['approved_at'] = $task->approved_at;

                return $data;
            }

            if ($user->can('task.approve')) {
                $data['approved_at'] = $data['approved_at'] ?? $task?->approved_at ?? now();

                return $data;
            }

            if ($waitingApprovalStatusId) {
                $data['status_id'] = $waitingApprovalStatusId;
                $data['approved_at'] = null;
            }

            return $data;
        }

        if ($waitingApprovalStatusId && $statusId === $waitingApprovalStatusId) {
            $data['completed_at'] = $data['completed_at'] ?? now();
            $data['approved_at'] = null;

            return $data;
        }

        $data['approved_at'] = null;

        return $data;
    }

    private function statusId(string $slug): ?int
    {
        return ProjectStatus::query()
            ->where('slug', $slug)
            ->value('id');
    }
}
