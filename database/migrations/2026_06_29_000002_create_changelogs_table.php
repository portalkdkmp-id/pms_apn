<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('changelogs', function (Blueprint $table) {
            $table->id();
            $table->string('version')->unique();
            $table->string('title');
            $table->string('type', 20)->default('minor');
            $table->text('summary')->nullable();
            $table->json('changes');
            $table->boolean('is_published')->default(false);
            $table->timestamp('released_at')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['is_published', 'released_at']);
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('changelogs');
    }
};
