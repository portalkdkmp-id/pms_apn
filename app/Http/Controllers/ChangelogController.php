<?php

namespace App\Http\Controllers;

use App\Http\Requests\Changelog\StoreChangelogRequest;
use App\Http\Requests\Changelog\UpdateChangelogRequest;
use App\Models\Changelog;
use App\Services\ChangelogService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ChangelogController extends Controller
{
    public function __construct(private readonly ChangelogService $changelogService) {}

    public function index(): Response
    {
        $user = request()->user();

        abort_unless($user?->can('changelog.view'), 403);

        return Inertia::render('changelogs/index', [
            'changelogs' => $this->changelogService->paginateFor($user),
            'types' => ['major', 'minor', 'patch', 'hotfix', 'beta'],
        ]);
    }

    public function store(StoreChangelogRequest $request): RedirectResponse
    {
        $this->changelogService->create($request->validated(), $request->user());

        return to_route('changelogs.index')->with('success', 'Changelog berhasil dibuat.');
    }

    public function update(UpdateChangelogRequest $request, Changelog $changelog): RedirectResponse
    {
        $this->changelogService->update($changelog, $request->validated());

        return to_route('changelogs.index')->with('success', 'Changelog berhasil diperbarui.');
    }

    public function destroy(Changelog $changelog): RedirectResponse
    {
        abort_unless(request()->user()?->can('changelog.delete'), 403);

        $this->changelogService->delete($changelog);

        return to_route('changelogs.index')->with('success', 'Changelog berhasil dihapus.');
    }

    public function publish(Changelog $changelog): RedirectResponse
    {
        abort_unless(request()->user()?->can('changelog.publish'), 403);

        $this->changelogService->publish($changelog);

        return to_route('changelogs.index')->with('success', 'Changelog berhasil dipublish.');
    }
}
