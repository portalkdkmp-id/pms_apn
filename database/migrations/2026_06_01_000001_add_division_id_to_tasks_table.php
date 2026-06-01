<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->foreignUuid('division_id')
                ->nullable()
                ->after('parent_id')
                ->constrained('divisions')
                ->nullOnDelete();

            $table->index(['division_id', 'status_id']);
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex(['division_id', 'status_id']);
            $table->dropForeign(['division_id']);
            $table->dropColumn('division_id');
        });
    }
};
