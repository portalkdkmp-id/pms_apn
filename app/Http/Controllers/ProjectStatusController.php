<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProjectStatus\StoreProjectStatusRequest;
use App\Http\Requests\ProjectStatus\UpdateProjectStatusRequest;
use App\Models\ProjectStatus;
use App\Services\ProjectStatusService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProjectStatusController extends Controller
{
    public function __construct(private readonly ProjectStatusService $projectStatusService) {}

    public function index(): Response
    {
        abort_unless(request()->user()?->can('project_status.view'), 403);

        return Inertia::render('project-statuses/index', [
            'projectStatuses' => $this->projectStatusService->paginate(),
        ]);
    }

    public function store(StoreProjectStatusRequest $request): RedirectResponse
    {
        $this->projectStatusService->create($request->validated());

        return to_route('project-statuses.index')->with('success', 'Project status berhasil dibuat.');
    }

    public function update(UpdateProjectStatusRequest $request, ProjectStatus $projectStatus): RedirectResponse
    {
        $this->projectStatusService->update($projectStatus, $request->validated());

        return to_route('project-statuses.index')->with('success', 'Project status berhasil diperbarui.');
    }

    public function destroy(ProjectStatus $projectStatus): RedirectResponse
    {
        abort_unless(request()->user()?->can('project_status.delete'), 403);

        $this->projectStatusService->delete($projectStatus);

        return to_route('project-statuses.index')->with('success', 'Project status berhasil dihapus.');
    }
}
