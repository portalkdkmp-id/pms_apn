<?php

namespace App\Http\Controllers;

use App\Http\Requests\Division\StoreDivisionRequest;
use App\Http\Requests\Division\UpdateDivisionRequest;
use App\Models\Division;
use App\Services\DivisionService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DivisionController extends Controller
{
    public function __construct(private readonly DivisionService $divisionService) {}

    public function index(): Response
    {
        abort_unless(request()->user()?->can('division.view'), 403);

        return Inertia::render('divisions/index', [
            'divisions' => $this->divisionService->paginate(),
        ]);
    }

    public function store(StoreDivisionRequest $request): RedirectResponse
    {
        $this->divisionService->create($request->validated());

        return to_route('divisions.index')->with('success', 'Division berhasil dibuat.');
    }

    public function update(UpdateDivisionRequest $request, Division $division): RedirectResponse
    {
        $this->divisionService->update($division, $request->validated());

        return to_route('divisions.index')->with('success', 'Division berhasil diperbarui.');
    }

    public function destroy(Division $division): RedirectResponse
    {
        abort_unless(request()->user()?->can('division.delete'), 403);

        $this->divisionService->delete($division);

        return to_route('divisions.index')->with('success', 'Division berhasil dihapus.');
    }
}
