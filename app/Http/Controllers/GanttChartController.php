<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;
use Inertia\Response;

class GanttChartController extends Controller
{
    public function index(): Response
    {
        $user = request()->user();

        abort_unless($user?->can('task.view'), 403);

        return Inertia::render('gantt-chart/index', [
            'projects' => $this->visibleProjectsQuery($user)
                ->with([
                    'division:id,name',
                    'owner:id,name,email',
                    'parent:id,code,title',
                    'previousProject:id,code,title,status_id',
                    'previousProject.status:id,name,slug,color',
                    'status:id,name,slug,color',
                    'tasks' => fn ($query) => $query
                        ->whereNull('parent_id')
                        ->with([
                            'division:id,name',
                            'assignee:id,name,email,division_id',
                            'previousTask:id,title,status_id',
                            'previousTask.status:id,name,slug,color',
                            'status:id,name,slug,color',
                            'subtasks' => fn ($query) => $query
                                ->with([
                                    'division:id,name',
                                    'assignee:id,name,email,division_id',
                                    'previousTask:id,title,status_id',
                                    'previousTask.status:id,name,slug,color',
                                    'status:id,name,slug,color',
                                    'subtasks' => fn ($query) => $query
                                        ->with(['division:id,name', 'assignee:id,name,email,division_id', 'previousTask:id,title,status_id', 'previousTask.status:id,name,slug,color', 'status:id,name,slug,color'])
                                        ->orderBy('start_date')
                                        ->orderBy('due_date')
                                        ->orderBy('title'),
                                ])
                                ->orderBy('start_date')
                                ->orderBy('due_date')
                                ->orderBy('title'),
                        ])
                        ->orderBy('start_date')
                        ->orderBy('due_date')
                        ->orderBy('title'),
                ])
                ->orderByRaw('parent_id is not null')
                ->orderBy('start_date')
                ->orderBy('expected_deadline')
                ->orderBy('title')
                ->get(),
        ]);
    }

    private function visibleProjectsQuery(User $user): Builder
    {
        $query = Project::query();

        if ($user->can('project.view_all')) {
            return $query;
        }

        $canViewDivision = $user->can('project.view_division') && $user->division_id !== null;
        $canViewAssigned = $user->can('project.view_assigned');

        if (! $canViewDivision && ! $canViewAssigned) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where(function (Builder $query) use ($user, $canViewDivision, $canViewAssigned) {
            if ($canViewDivision) {
                $query->orWhere('division_id', $user->division_id);
            }

            if ($canViewAssigned) {
                $query->orWhere('owner_id', $user->id);
            }
        });
    }
}
