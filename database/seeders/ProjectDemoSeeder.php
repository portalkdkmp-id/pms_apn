<?php

namespace Database\Seeders;

use App\Models\Division;
use App\Models\Project;
use App\Models\ProjectStatus;
use App\Models\Task;
use App\Models\Team;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProjectDemoSeeder extends Seeder
{
    public function run(): void
    {
        $backlog = ProjectStatus::where('slug', 'backlog')->firstOrFail();
        $inProgress = ProjectStatus::where('slug', 'in-progress')->firstOrFail();
        $done = ProjectStatus::where('slug', 'done')->firstOrFail();

        Division::query()
            ->with(['manager', 'users'])
            ->orderBy('name')
            ->get()
            ->each(function (Division $division) use ($backlog, $inProgress, $done) {
                $owner = $division->manager ?? $division->users->first();

                if (! $owner) {
                    return;
                }

                $project = Project::updateOrCreate(
                    ['code' => 'PRJ-'.Str::upper(Str::of($division->slug)->replace('-', '')->substr(0, 4))],
                    [
                        'title' => 'Peningkatan Kinerja '.$division->name,
                        'description' => 'Project demo untuk divisi '.$division->name,
                        'division_id' => $division->id,
                        'owner_id' => $owner->id,
                        'status_id' => $inProgress->id,
                        'priority' => 'medium',
                        'kpi_target' => 100,
                        'start_date' => now()->startOfMonth()->toDateString(),
                        'expected_deadline' => now()->addMonth()->endOfMonth()->toDateString(),
                    ],
                );

                $team = Team::updateOrCreate(
                    ['slug' => 'team-'.$division->slug],
                    [
                        'name' => 'Team '.$division->name,
                        'description' => 'Team demo project '.$division->name,
                        'project_id' => $project->id,
                        'leader_id' => $owner->id,
                    ],
                );

                $memberIds = $division->users->pluck('id')->take(4)->values();
                $team->members()->sync($memberIds);

                $parent = Task::updateOrCreate(
                    [
                        'project_id' => $project->id,
                        'title' => 'Rencana kerja '.$division->name,
                    ],
                    [
                        'parent_id' => null,
                        'assignee_id' => $owner->id,
                        'status_id' => $inProgress->id,
                        'description' => 'Menyusun rencana kerja dan target KPI.',
                        'priority' => 'high',
                        'kpi_point' => 10,
                        'start_date' => now()->startOfMonth()->toDateString(),
                        'due_date' => now()->addDays(10)->toDateString(),
                    ],
                );

                $assignees = $team->members()->orderBy('name')->get();

                foreach ($assignees->take(2)->values() as $index => $assignee) {
                    Task::updateOrCreate(
                        [
                            'project_id' => $project->id,
                            'title' => 'Eksekusi milestone '.($index + 1).' '.$division->name,
                        ],
                        [
                            'parent_id' => $parent->id,
                            'assignee_id' => $assignee->id,
                            'status_id' => $index === 0 ? $done->id : $backlog->id,
                            'description' => 'Sub task demo untuk anggota team.',
                            'priority' => $index === 0 ? 'medium' : 'low',
                            'kpi_point' => 10,
                            'start_date' => now()->addDays($index + 2)->toDateString(),
                            'due_date' => now()->addDays(14 + $index)->toDateString(),
                            'completed_at' => $index === 0 ? now()->toDateString() : null,
                        ],
                    );
                }
            });
    }
}
