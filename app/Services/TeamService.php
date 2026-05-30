<?php

namespace App\Services;

use App\Models\Team;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class TeamService
{
    /**
     * @return LengthAwarePaginator<int, Team>
     */
    public function paginate(): LengthAwarePaginator
    {
        return Team::query()
            ->with([
                'project:id,code,title',
                'leader:id,name,email',
                'members:id,name,email',
            ])
            ->latest()
            ->paginate(10)
            ->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Team
    {
        return DB::transaction(function () use ($data) {
            $team = Team::create(Arr::except($data, ['member_ids']));
            $team->members()->sync($data['member_ids'] ?? []);

            return $team;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Team $team, array $data): Team
    {
        return DB::transaction(function () use ($team, $data) {
            $team->update(Arr::except($data, ['member_ids']));
            $team->members()->sync($data['member_ids'] ?? []);

            return $team->refresh();
        });
    }

    public function delete(Team $team): void
    {
        DB::transaction(function () use ($team) {
            $team->members()->detach();
            $team->delete();
        });
    }
}
