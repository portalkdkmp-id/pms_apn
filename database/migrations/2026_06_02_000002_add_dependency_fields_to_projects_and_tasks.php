<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->boolean('requires_previous_project_done')->default(false)->after('expected_deadline');
            $table
                ->foreignUuid('previous_project_id')
                ->nullable()
                ->after('requires_previous_project_done')
                ->constrained('projects')
                ->nullOnDelete();
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->boolean('requires_previous_task_done')->default(false)->after('completed_at');
            $table
                ->foreignUuid('previous_task_id')
                ->nullable()
                ->after('requires_previous_task_done')
                ->constrained('tasks')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropConstrainedForeignId('previous_task_id');
            $table->dropColumn('requires_previous_task_done');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropConstrainedForeignId('previous_project_id');
            $table->dropColumn('requires_previous_project_done');
        });
    }
};
