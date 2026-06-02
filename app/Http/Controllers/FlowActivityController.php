<?php

namespace App\Http\Controllers;

use App\Models\Division;
use App\Models\Project;
use App\Models\ProjectStatus;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;
use Inertia\Response;

class FlowActivityController extends Controller
{
    public function index(): Response
    {
        return $this->render('flow2');
    }

    public function flow2(): Response
    {
        return $this->render('flow2');
    }

    public function timeline(): Response
    {
        return $this->render('timeline');
    }

    private function render(string $mode): Response
    {
        $user = request()->user();

        abort_unless($user?->can('task.view'), 403);

        $projectQuery = $this->visibleProjectsQuery($user);
        $projectIds = (clone $projectQuery)->pluck('id');

        return Inertia::render('flow-activities/index', [
            'mode' => $mode,
            'projects' => (clone $projectQuery)
                ->with([
                    'division:id,name',
                    'owner:id,name,email',
                    'parent:id,code,title',
                    'previousProject:id,code,title,status_id',
                    'previousProject.status:id,name,slug,color',
                    'status:id,name,slug,color',
                    'attachments:id,attachable_id,attachable_type,disk,path,original_name,mime_type,size,created_at',
                    'tasks' => fn ($query) => $query
                        ->whereNull('parent_id')
                        ->with([
                            'division:id,name',
                            'assignee:id,name,email,division_id',
                            'previousTask:id,title,status_id',
                            'previousTask.status:id,name,slug,color',
                            'status:id,name,slug,color',
                            'attachments:id,attachable_id,attachable_type,disk,path,original_name,mime_type,size,created_at',
                            'subtasks' => fn ($query) => $query
                                ->with([
                                    'division:id,name',
                                    'assignee:id,name,email,division_id',
                                    'previousTask:id,title,status_id',
                                    'previousTask.status:id,name,slug,color',
                                    'status:id,name,slug,color',
                                    'attachments:id,attachable_id,attachable_type,disk,path,original_name,mime_type,size,created_at',
                                    'subtasks' => fn ($query) => $query
                                        ->with(['division:id,name', 'assignee:id,name,email,division_id', 'previousTask:id,title,status_id', 'previousTask.status:id,name,slug,color', 'status:id,name,slug,color', 'attachments:id,attachable_id,attachable_type,disk,path,original_name,mime_type,size,created_at'])
                                        ->orderBy('due_date')
                                        ->orderBy('title'),
                                ])
                                ->orderBy('due_date')
                                ->orderBy('title'),
                        ])
                        ->orderBy('due_date')
                        ->orderBy('title'),
                ])
                ->withCount('children')
                ->orderByRaw('parent_id is not null')
                ->orderBy('expected_deadline')
                ->orderBy('title')
                ->get(),
            'allProjects' => Project::query()
                ->whereIn('id', $projectIds)
                ->orderBy('code')
                ->get(['id', 'code', 'title', 'parent_id', 'division_id']),
            'parentTasks' => Task::query()
                ->whereIn('project_id', $projectIds)
                ->orderBy('title')
                ->get(['id', 'project_id', 'title']),
            'divisions' => Division::query()->orderBy('name')->get(['id', 'name']),
            'users' => User::query()->orderBy('name')->get(['id', 'name', 'email', 'division_id']),
            'statuses' => ProjectStatus::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get(['id', 'name', 'color']),
            'priorities' => ['low', 'medium', 'high', 'critical'],
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
