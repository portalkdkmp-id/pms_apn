<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'code',
    'parent_id',
    'title',
    'description',
    'division_id',
    'owner_id',
    'status_id',
    'priority',
    'kpi_target',
    'start_date',
    'end_date',
    'expected_deadline',
    'requires_previous_project_done',
    'previous_project_id',
    'deleted_by',
])]
class Project extends Model
{
    use HasUuids, SoftDeletes;

    protected function casts(): array
    {
        return [
            'kpi_target' => 'decimal:2',
            'start_date' => 'date',
            'end_date' => 'date',
            'expected_deadline' => 'date',
            'requires_previous_project_done' => 'boolean',
        ];
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function previousProject(): BelongsTo
    {
        return $this->belongsTo(self::class, 'previous_project_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(ProjectStatus::class, 'status_id');
    }

    public function deletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function teams(): HasMany
    {
        return $this->hasMany(Team::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function attachments(): MorphMany
    {
        return $this->morphMany(Attachment::class, 'attachable')->latest();
    }
}
