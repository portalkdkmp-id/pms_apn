<?php

namespace App\Http\Controllers;

use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Models\Division;
use App\Models\Project;
use App\Models\ProjectStatus;
use App\Models\User;
use App\Services\ProjectService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function __construct(private readonly ProjectService $projectService) {}

    public function index(): Response
    {
        $user = request()->user();

        abort_unless($user?->can('project.view'), 403);

        return Inertia::render('projects/index', [
            'projects' => $this->projectService->paginateFor($user),
            'divisions' => Division::query()->orderBy('name')->get(['id', 'name']),
            'owners' => User::query()->orderBy('name')->get(['id', 'name', 'email', 'division_id']),
            'statuses' => ProjectStatus::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get(['id', 'name', 'color']),
            'priorities' => ['low', 'medium', 'high', 'critical'],
        ]);
    }

    public function store(StoreProjectRequest $request): RedirectResponse
    {
        $this->projectService->create($request->validated());

        return to_route('projects.index')->with('success', 'Project berhasil dibuat.');
    }

    public function update(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        $this->projectService->update($project, $request->validated());

        return to_route('projects.index')->with('success', 'Project berhasil diperbarui.');
    }

    public function destroy(Project $project): RedirectResponse
    {
        $user = request()->user();

        abort_unless($user?->can('project.delete'), 403);

        $this->projectService->delete($project, $user);

        return to_route('projects.index')->with('success', 'Project berhasil dihapus.');
    }
}
