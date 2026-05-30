<?php

namespace Database\Seeders;

use App\Models\ProjectStatus;
use Illuminate\Database\Seeder;

class ProjectStatusSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            ['name' => 'Backlog', 'slug' => 'backlog', 'color' => '#64748b'],
            ['name' => 'Todo', 'slug' => 'todo', 'color' => '#2563eb'],
            ['name' => 'In Progress', 'slug' => 'in-progress', 'color' => '#f59e0b'],
            ['name' => 'Waiting Approval', 'slug' => 'waiting-approval', 'color' => '#8b5cf6'],
            ['name' => 'Blocked', 'slug' => 'blocked', 'color' => '#ef4444'],
            ['name' => 'Done', 'slug' => 'done', 'color' => '#16a34a'],
            ['name' => 'Canceled', 'slug' => 'canceled', 'color' => '#71717a'],
        ];

        foreach ($statuses as $index => $status) {
            ProjectStatus::updateOrCreate(
                ['slug' => $status['slug']],
                [
                    'name' => $status['name'],
                    'color' => $status['color'],
                    'sort_order' => $index + 1,
                    'is_active' => true,
                ],
            );
        }
    }
}
