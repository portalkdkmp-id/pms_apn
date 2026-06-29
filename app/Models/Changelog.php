<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'version',
    'title',
    'type',
    'summary',
    'changes',
    'is_published',
    'released_at',
    'created_by',
])]
class Changelog extends Model
{
    protected function casts(): array
    {
        return [
            'changes' => 'array',
            'is_published' => 'boolean',
            'released_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
