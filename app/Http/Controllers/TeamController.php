<?php

namespace App\Http\Controllers;

use App\Http\Requests\Team\StoreTeamRequest;
use App\Http\Requests\Team\UpdateTeamRequest;
use App\Models\Project;
use App\Models\Team;
use App\Models\User;
use App\Services\TeamService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    public function __construct(private readonly TeamService $teamService) {}

    public function index(): Response
    {
        abort_unless(request()->user()?->can('team.view'), 403);

        return Inertia::render('teams/index', [
            'teams' => $this->teamService->paginate(),
            'projects' => Project::query()
                ->orderBy('title')
                ->get(['id', 'code', 'title']),
            'users' => User::query()
                ->orderBy('name')
                ->get(['id', 'name', 'email']),
        ]);
    }

    public function store(StoreTeamRequest $request): RedirectResponse
    {
        $this->teamService->create($request->validated());

        return to_route('teams.index')->with('success', 'Team berhasil dibuat.');
    }

    public function update(UpdateTeamRequest $request, Team $team): RedirectResponse
    {
        $this->teamService->update($team, $request->validated());

        return to_route('teams.index')->with('success', 'Team berhasil diperbarui.');
    }

    public function destroy(Team $team): RedirectResponse
    {
        abort_unless(request()->user()?->can('team.delete'), 403);

        $this->teamService->delete($team);

        return to_route('teams.index')->with('success', 'Team berhasil dihapus.');
    }
}
