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
        if (Schema::hasColumn('divisions', 'code') && ! Schema::hasColumn('divisions', 'slug')) {
            Schema::table('divisions', function (Blueprint $table) {
                $table->renameColumn('code', 'slug');
            });
        }

        Schema::table('divisions', function (Blueprint $table) {
            if (! Schema::hasColumn('divisions', 'manager_id')) {
                $table->foreignUuid('manager_id')
                    ->nullable()
                    ->after('description')
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('divisions', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('divisions', function (Blueprint $table) {
            if (Schema::hasColumn('divisions', 'manager_id')) {
                $table->dropConstrainedForeignId('manager_id');
            }

            if (Schema::hasColumn('divisions', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });

        if (Schema::hasColumn('divisions', 'slug') && ! Schema::hasColumn('divisions', 'code')) {
            Schema::table('divisions', function (Blueprint $table) {
                $table->renameColumn('slug', 'code');
            });
        }
    }
};
