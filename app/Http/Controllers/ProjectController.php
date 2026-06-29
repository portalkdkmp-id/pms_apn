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
            'parentProjects' => $this->projectService->parentOptionsFor($user),
            'divisions' => $this->divisionOptionsFor($user),
            'owners' => $this->ownerOptionsFor($user),
            'statuses' => ProjectStatus::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get(['id', 'name', 'slug', 'color']),
            'priorities' => ['low', 'medium', 'high', 'critical'],
        ]);
    }

    public function store(StoreProjectRequest $request): RedirectResponse
    {
        $this->projectService->create($request->validated(), $request->user());

        return back()->with('success', 'Project berhasil dibuat.');
    }

    public function update(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        $this->projectService->update($project, $request->validated(), $request->user());

        return back()->with('success', 'Project berhasil diperbarui.');
    }

    public function destroy(Project $project): RedirectResponse
    {
        $user = request()->user();

        abort_unless($user?->can('project.delete'), 403);

        $this->projectService->delete($project, $user);

        return back()->with('success', 'Project berhasil dihapus.');
    }

    private function divisionOptionsFor(User $user)
    {
        $query = Division::query()->orderBy('name');

        if (! $user->can('project.view_all') && $user->can('project.view_division') && $user->division_id !== null) {
            $query->whereKey($user->division_id);
        }

        return $query->get(['id', 'name']);
    }

    private function ownerOptionsFor(User $user)
    {
        $query = User::query()->orderBy('name');

        if (! $user->can('project.view_all') && $user->can('project.view_division') && $user->division_id !== null) {
            $query->where('division_id', $user->division_id);
        }

        if (! $user->can('project.view_all') && ! $user->can('project.view_division') && $user->can('project.view_assigned')) {
            $query->whereKey($user->id);
        }

        return $query->get(['id', 'name', 'email', 'division_id']);
    }
}
