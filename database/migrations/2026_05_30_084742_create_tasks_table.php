<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('project_id')->constrained('projects')->cascadeOnDelete();
            $table->uuid('parent_id')->nullable();
            $table->foreignUuid('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('status_id')->constrained('project_statuses')->restrictOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('priority', 20)->default('medium');
            $table->decimal('kpi_point', 8, 2)->default(0);
            $table->date('start_date')->nullable();
            $table->date('due_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['project_id', 'status_id']);
            $table->index(['assignee_id', 'status_id']);
            $table->index('parent_id');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->foreign('parent_id')
                ->references('id')
                ->on('tasks')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
