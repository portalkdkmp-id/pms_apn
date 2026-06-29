<?php

namespace App\Http\Controllers;

use App\Http\Requests\Task\StoreTaskRequest;
use App\Http\Requests\Task\UpdateTaskRequest;
use App\Models\Division;
use App\Models\Project;
use App\Models\ProjectStatus;
use App\Models\Task;
use App\Models\User;
use App\Services\TaskService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function __construct(private readonly TaskService $taskService) {}

    public function index(): Response
    {
        $user = request()->user();

        abort_unless($user?->can('task.view'), 403);

        return Inertia::render('tasks/index', [
            'tasks' => $this->taskService->paginateFor(
                $user,
                request()->string('sort')->toString(),
                request()->string('direction')->toString(),
            ),
            'projects' => $this->projectOptionsFor($user),
            'divisions' => $this->divisionOptionsFor($user),
            'parentTasks' => $this->parentTaskOptionsFor($user),
            'users' => $this->userOptionsFor($user),
            'statuses' => ProjectStatus::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get(['id', 'name', 'slug', 'color']),
            'priorities' => ['low', 'medium', 'high', 'critical'],
            'sort' => [
                'field' => request()->string('sort')->toString() ?: 'created_at',
                'direction' => request()->string('direction')->toString() === 'asc' ? 'asc' : 'desc',
            ],
        ]);
    }

    public function pending(): Response
    {
        $user = request()->user();

        abort_unless($user?->can('task.approve'), 403);

        return Inertia::render('tasks/pending', [
            'tasks' => $this->taskService->pendingApprovalFor($user),
        ]);
    }

    public function store(StoreTaskRequest $request): RedirectResponse
    {
        $this->taskService->create($request->validated(), $request->user());

        return back()->with('success', 'Task berhasil dibuat.');
    }

    public function update(UpdateTaskRequest $request, Task $task): RedirectResponse
    {
        $this->taskService->update($task, $request->validated(), $request->user());

        return back()->with('success', 'Task berhasil diperbarui.');
    }

    public function destroy(Task $task): RedirectResponse
    {
        abort_unless(request()->user()?->can('task.delete'), 403);

        $this->taskService->delete($task);

        return back()->with('success', 'Task berhasil dihapus.');
    }

    public function approve(Task $task): RedirectResponse
    {
        $this->taskService->approve($task, request()->user());

        return back()->with('success', 'Task berhasil di-approve.');
    }

    private function projectOptionsFor(User $user)
    {
        $query = Project::query()
            ->with('teams.members:id,name,email')
            ->orderBy('title');

        if ($user->can('project.view_all')) {
            return $query->get(['id', 'code', 'title', 'division_id']);
        }

        $query->where(function (Builder $query) use ($user) {
            if ($user->can('project.view_division') && $user->division_id !== null) {
                $query->orWhere('division_id', $user->division_id);
            }

            if ($user->can('project.view_assigned')) {
                $query
                    ->orWhere('owner_id', $user->id)
                    ->orWhereHas('tasks', fn (Builder $query) => $query->where('assignee_id', $user->id));
            }
        });

        return $query->get(['id', 'code', 'title', 'division_id']);
    }

    private function divisionOptionsFor(User $user)
    {
        $query = Division::query()->orderBy('name');

        if (! $user->can('task.view_all') && $user->division_id !== null) {
            $query->whereKey($user->division_id);
        }

        return $query->get(['id', 'name']);
    }

    private function parentTaskOptionsFor(User $user)
    {
        $query = Task::query()->orderBy('title');

        if (! $user->can('task.view_all')) {
            $query->where(function (Builder $query) use ($user) {
                if ($user->can('task.view_division') && $user->division_id !== null) {
                    $query
                        ->orWhere('division_id', $user->division_id)
                        ->orWhereHas('project', fn (Builder $query) => $query->where('division_id', $user->division_id));
                }

                if ($user->can('task.view_assigned')) {
                    $query->orWhere('assignee_id', $user->id);
                }
            });
        }

        return $query->get(['id', 'project_id', 'title']);
    }

    private function userOptionsFor(User $user)
    {
        $query = User::query()->orderBy('name');

        if (! $user->can('task.view_all') && $user->division_id !== null) {
            $query->where('division_id', $user->division_id);
        }

        return $query->get(['id', 'name', 'email', 'division_id']);
    }
}
