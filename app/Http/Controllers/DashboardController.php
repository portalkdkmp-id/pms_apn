<?php

namespace App\Http\Controllers;

use App\Models\Division;
use App\Models\Project;
use App\Models\ProjectStatus;
use App\Models\Task;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = request()->user();

        $projectQuery = $this->visibleProjectsQuery($user);
        $taskQuery = $this->visibleTasksQuery($user);

        $projectsByStatus = ProjectStatus::query()
            ->withCount(['projects as count' => fn (Builder $query) => $this->scopeProjectVisibility($query, $user)])
            ->orderBy('sort_order')
            ->get(['id', 'name', 'color'])
            ->map(fn (ProjectStatus $status) => [
                'label' => $status->name,
                'value' => $status->count,
                'color' => $status->color,
            ]);

        $tasksByStatus = ProjectStatus::query()
            ->withCount(['projects as count' => fn (Builder $query) => $query->whereRaw('1 = 0')])
            ->orderBy('sort_order')
            ->get(['id', 'name', 'color'])
            ->map(function (ProjectStatus $status) use ($user) {
                return [
                    'label' => $status->name,
                    'value' => (clone $this->visibleTasksQuery($user))->where('status_id', $status->id)->count(),
                    'color' => $status->color,
                ];
            });

        $projectsByDivision = Division::query()
            ->withCount(['projects as count' => fn (Builder $query) => $this->scopeProjectVisibility($query, $user)])
            ->orderBy('name')
            ->get(['id', 'name'])
            ->filter(fn (Division $division) => $division->count > 0)
            ->values()
            ->map(fn (Division $division) => [
                'label' => $division->name,
                'value' => $division->count,
            ]);

        $totalKpiTarget = (float) (clone $projectQuery)->sum('kpi_target');
        $totalKpiValue = (float) (clone $projectQuery)->sum('kpi_value');
        $taskKpiPoints = (float) (clone $taskQuery)->sum('kpi_point');
        $completedTaskKpiPoints = (float) (clone $taskQuery)->whereNotNull('completed_at')->sum('kpi_point');

        return Inertia::render('dashboard', [
            'stats' => [
                'projects' => (clone $projectQuery)->count(),
                'activeProjects' => (clone $projectQuery)->whereHas('status', fn (Builder $query) => $query->whereNotIn('slug', ['done', 'canceled']))->count(),
                'tasks' => (clone $taskQuery)->count(),
                'openTasks' => (clone $taskQuery)->whereNull('completed_at')->count(),
                'overdueTasks' => (clone $taskQuery)->whereNull('completed_at')->whereDate('due_date', '<', now()->toDateString())->count(),
                'teams' => Team::query()->whereHas('project', fn (Builder $query) => $this->scopeProjectVisibility($query, $user))->count(),
                'users' => User::query()->count(),
                'divisions' => Division::query()->count(),
                'kpiTarget' => round($totalKpiTarget, 2),
                'kpiValue' => round($totalKpiValue, 2),
                'kpiPercent' => $totalKpiTarget > 0 ? round(($totalKpiValue / $totalKpiTarget) * 100, 1) : 0,
                'taskKpiPoints' => round($taskKpiPoints, 2),
                'completedTaskKpiPoints' => round($completedTaskKpiPoints, 2),
            ],
            'charts' => [
                'projectsByStatus' => $projectsByStatus,
                'tasksByStatus' => $tasksByStatus,
                'projectsByDivision' => $projectsByDivision,
            ],
            'recentProjects' => (clone $projectQuery)
                ->with(['division:id,name', 'owner:id,name', 'status:id,name,color'])
                ->latest()
                ->limit(5)
                ->get(['id', 'code', 'title', 'division_id', 'owner_id', 'status_id', 'expected_deadline'])
                ->map(fn (Project $project) => [
                    'id' => $project->id,
                    'code' => $project->code,
                    'title' => $project->title,
                    'division' => $project->division?->name,
                    'owner' => $project->owner?->name,
                    'status' => $project->status?->only(['name', 'color']),
                    'deadline' => $project->expected_deadline?->toDateString(),
                ]),
            'overdueTasks' => (clone $taskQuery)
                ->with(['project:id,code,title', 'assignee:id,name', 'status:id,name,color'])
                ->whereNull('completed_at')
                ->whereDate('due_date', '<', now()->toDateString())
                ->orderBy('due_date')
                ->limit(6)
                ->get(['id', 'project_id', 'assignee_id', 'status_id', 'title', 'due_date', 'kpi_point'])
                ->map(fn (Task $task) => [
                    'id' => $task->id,
                    'title' => $task->title,
                    'project' => $task->project ? $task->project->code.' - '.$task->project->title : null,
                    'assignee' => $task->assignee?->name,
                    'status' => $task->status?->only(['name', 'color']),
                    'dueDate' => $task->due_date?->toDateString(),
                    'kpiPoint' => $task->kpi_point,
                ]),
            'myTasks' => Task::query()
                ->with(['project:id,code,title', 'status:id,name,color'])
                ->where('assignee_id', $user->id)
                ->whereNull('completed_at')
                ->orderByRaw('due_date is null')
                ->orderBy('due_date')
                ->limit(6)
                ->get(['id', 'project_id', 'status_id', 'title', 'due_date', 'kpi_point'])
                ->map(fn (Task $task) => [
                    'id' => $task->id,
                    'title' => $task->title,
                    'project' => $task->project ? $task->project->code.' - '.$task->project->title : null,
                    'status' => $task->status?->only(['name', 'color']),
                    'dueDate' => $task->due_date?->toDateString(),
                    'kpiPoint' => $task->kpi_point,
                ]),
        ]);
    }

    private function visibleProjectsQuery(User $user): Builder
    {
        return $this->scopeProjectVisibility(Project::query(), $user);
    }

    private function scopeProjectVisibility(Builder $query, User $user): Builder
    {
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

    private function visibleTasksQuery(User $user): Builder
    {
        $query = Task::query();

        if ($user->can('task.view_all')) {
            return $query;
        }

        $canViewDivision = $user->can('task.view_division') && $user->division_id !== null;
        $canViewAssigned = $user->can('task.view_assigned');

        if (! $canViewDivision && ! $canViewAssigned) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where(function (Builder $query) use ($user, $canViewDivision, $canViewAssigned) {
            if ($canViewDivision) {
                $query->orWhereHas('project', fn (Builder $query) => $query->where('division_id', $user->division_id));
            }

            if ($canViewAssigned) {
                $query->orWhere('assignee_id', $user->id);
            }
        });
    }
}
