<?php

namespace Database\Seeders;

use App\Models\Division;
use App\Models\Project;
use App\Models\ProjectStatus;
use App\Models\Task;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FoodEstateActivitySeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            DB::table('team_user')->delete();
            Task::query()->forceDelete();
            Team::query()->forceDelete();
            Project::query()->forceDelete();

            $pengadaan = Division::query()->where('slug', 'pengadaan')->firstOrFail();
            $strategi = Division::query()->where('slug', 'strategi-pengembangan-usaha')->firstOrFail();
            $owner = User::query()->role('superadmin')->first()
                ?? User::query()->orderBy('name')->firstOrFail();

            $statuses = ProjectStatus::query()->whereIn('slug', [
                'backlog',
                'todo',
                'in-progress',
                'waiting-approval',
                'done',
            ])->pluck('id', 'slug');

            $mainProject = Project::query()->create([
                'code' => 'KSPP-001',
                'title' => 'Pembentukan Kawasan Sentra Produksi Pangan',
                'description' => 'Main project pembentukan kawasan sentra produksi pangan lintas divisi.',
                'division_id' => $strategi->id,
                'owner_id' => $owner->id,
                'status_id' => $statuses['in-progress'],
                'priority' => 'critical',
                'kpi_target' => 100,
                'start_date' => now()->startOfMonth()->toDateString(),
                'expected_deadline' => now()->addMonths(4)->endOfMonth()->toDateString(),
            ]);

            $this->createSubProject(
                mainProject: $mainProject,
                division: $pengadaan,
                code: 'KSPP-PGD',
                title: 'Kesiapan Pengadaan Sarana Produksi',
                description: 'Sub-project pengadaan lahan, benih, alat produksi, dan dukungan logistik.',
                statuses: $statuses->all(),
            );

            $this->createSubProject(
                mainProject: $mainProject,
                division: $strategi,
                code: 'KSPP-SPU',
                title: 'Strategi Pengembangan Kawasan dan Kemitraan',
                description: 'Sub-project model bisnis, kemitraan, offtaker, dan rencana pengembangan kawasan.',
                statuses: $statuses->all(),
            );
        });
    }

    /**
     * @param  array<string, int>  $statuses
     */
    private function createSubProject(
        Project $mainProject,
        Division $division,
        string $code,
        string $title,
        string $description,
        array $statuses,
    ): void {
        $manager = $division->manager ?? $division->users()->first();
        $staff = $division->users()->whereKeyNot($manager?->id)->first() ?? $manager;

        if (! $manager || ! $staff) {
            return;
        }

        $project = Project::query()->create([
            'code' => $code,
            'parent_id' => $mainProject->id,
            'title' => $title,
            'description' => $description,
            'division_id' => $division->id,
            'owner_id' => $manager->id,
            'status_id' => $statuses['in-progress'],
            'priority' => 'high',
            'kpi_target' => 50,
            'start_date' => now()->startOfMonth()->addDays(5)->toDateString(),
            'expected_deadline' => now()->addMonths(3)->endOfMonth()->toDateString(),
        ]);

        $team = Team::query()->create([
            'name' => 'Tim '.$division->name.' KSPP',
            'slug' => Str::slug('tim-'.$division->slug.'-kspp'),
            'description' => 'Tim pelaksana '.$title,
            'project_id' => $project->id,
            'leader_id' => $manager->id,
        ]);
        $team->members()->sync(collect([$manager->id, $staff->id])->filter()->values());

        Task::query()->create([
            'project_id' => $project->id,
            'division_id' => $division->id,
            'assignee_id' => $staff->id,
            'status_id' => $statuses['todo'],
            'title' => 'Sinkronisasi awal '.$division->name,
            'description' => 'Task solo untuk memastikan kesiapan awal divisi.',
            'priority' => 'medium',
            'kpi_point' => 8,
            'start_date' => now()->addDays(3)->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
        ]);

        $parentTask = Task::query()->create([
            'project_id' => $project->id,
            'division_id' => $division->id,
            'assignee_id' => $manager->id,
            'status_id' => $statuses['in-progress'],
            'title' => 'Pelaksanaan paket kerja '.$division->name,
            'description' => 'Task utama yang memecah aktivitas divisi menjadi beberapa sub task.',
            'priority' => 'high',
            'kpi_point' => 12,
            'start_date' => now()->addDays(7)->toDateString(),
            'due_date' => now()->addDays(35)->toDateString(),
        ]);

        $nestedParent = Task::query()->create([
            'project_id' => $project->id,
            'parent_id' => $parentTask->id,
            'division_id' => $division->id,
            'assignee_id' => $staff->id,
            'status_id' => $statuses['in-progress'],
            'title' => 'Pemetaan kebutuhan teknis',
            'description' => 'Sub task untuk memetakan kebutuhan teknis pelaksanaan.',
            'priority' => 'high',
            'kpi_point' => 10,
            'start_date' => now()->addDays(9)->toDateString(),
            'due_date' => now()->addDays(24)->toDateString(),
        ]);

        Task::query()->create([
            'project_id' => $project->id,
            'parent_id' => $parentTask->id,
            'division_id' => $division->id,
            'assignee_id' => $manager->id,
            'status_id' => $statuses['waiting-approval'],
            'title' => 'Validasi rencana kerja',
            'description' => 'Sub task validasi rencana kerja sebelum eksekusi penuh.',
            'priority' => 'medium',
            'kpi_point' => 8,
            'start_date' => now()->addDays(12)->toDateString(),
            'due_date' => now()->addDays(28)->toDateString(),
        ]);

        foreach (['Inventarisasi data lapangan', 'Finalisasi daftar prioritas'] as $index => $title) {
            Task::query()->create([
                'project_id' => $project->id,
                'parent_id' => $nestedParent->id,
                'division_id' => $division->id,
                'assignee_id' => $index === 0 ? $staff->id : $manager->id,
                'status_id' => $index === 0 ? $statuses['done'] : $statuses['todo'],
                'title' => $title,
                'description' => 'Sub task turunan untuk '.$nestedParent->title,
                'priority' => $index === 0 ? 'medium' : 'high',
                'kpi_point' => 6,
                'start_date' => now()->addDays(14 + $index)->toDateString(),
                'due_date' => now()->addDays(20 + ($index * 4))->toDateString(),
                'completed_at' => $index === 0 ? now()->toDateString() : null,
            ]);
        }
    }
}
