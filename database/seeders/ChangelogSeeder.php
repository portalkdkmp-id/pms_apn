<?php

namespace Database\Seeders;

use App\Models\Changelog;
use Illuminate\Database\Seeder;

class ChangelogSeeder extends Seeder
{
    public function run(): void
    {
        Changelog::updateOrCreate(
            ['version' => '0.1b'],
            [
                'title' => 'Initial beta release',
                'type' => 'beta',
                'summary' => 'Rilis awal beta PMS APN untuk manajemen project, task, team, approval, dan visualisasi workflow.',
                'changes' => [
                    'Dashboard performa PMS, project, task, KPI, dan overdue.',
                    'CRUD user, role, permission, division, project status, project, team, dan task.',
                    'Task approval flow dengan Pending Tasks untuk manager dan superadmin.',
                    'Overdue marker pada project, task, dan Gantt chart.',
                    'Flow Activities dan Gantt Chart untuk melihat relasi dan timeline pekerjaan.',
                    'Sonner toast untuk feedback CRUD.',
                ],
                'is_published' => true,
                'released_at' => now(),
            ],
        );
    }
}
