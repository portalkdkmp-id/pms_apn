<?php

namespace App\Http\Controllers;

use App\Http\Requests\Task\StoreTaskRequest;
use App\Http\Requests\Task\UpdateTaskRequest;
use App\Models\Project;
use App\Models\ProjectStatus;
use App\Models\Task;
use App\Models\User;
use App\Services\TaskService;
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
            'tasks' => $this->taskService->paginateFor($user),
            'projects' => Project::query()
                ->with('teams.members:id,name,email')
                ->orderBy('title')
                ->get(['id', 'code', 'title', 'division_id']),
            'parentTasks' => Task::query()
                ->orderBy('title')
                ->get(['id', 'project_id', 'title']),
            'users' => User::query()
                ->orderBy('name')
                ->get(['id', 'name', 'email']),
            'statuses' => ProjectStatus::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get(['id', 'name', 'color']),
            'priorities' => ['low', 'medium', 'high', 'critical'],
        ]);
    }

    public function store(StoreTaskRequest $request): RedirectResponse
    {
        $this->taskService->create($request->validated());

        return to_route('tasks.index')->with('success', 'Task berhasil dibuat.');
    }

    public function update(UpdateTaskRequest $request, Task $task): RedirectResponse
    {
        $this->taskService->update($task, $request->validated());

        return to_route('tasks.index')->with('success', 'Task berhasil diperbarui.');
    }

    public function destroy(Task $task): RedirectResponse
    {
        abort_unless(request()->user()?->can('task.delete'), 403);

        $this->taskService->delete($task);

        return to_route('tasks.index')->with('success', 'Task berhasil dihapus.');
    }
}
