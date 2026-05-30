<?php

namespace App\Services;

use App\Models\Task;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TaskService
{
    /**
     * @return LengthAwarePaginator<int, Task>
     */
    public function paginateFor(User $user): LengthAwarePaginator
    {
        $query = Task::query()
            ->with([
                'project:id,code,title,division_id',
                'parent:id,title',
                'assignee:id,name,email',
                'status:id,name,color',
                'subtasks:id,parent_id,title,status_id,assignee_id,kpi_point',
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
                        $query->orWhereHas('project', fn ($query) => $query->where('division_id', $user->division_id));
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
    public function create(array $data): Task
    {
        return Task::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Task $task, array $data): Task
    {
        $task->update($data);

        return $task->refresh();
    }

    public function delete(Task $task): void
    {
        $task->delete();
    }
}
