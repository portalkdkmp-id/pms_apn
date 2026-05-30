<?php

namespace App\Services;

use App\Models\Division;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class DivisionService
{
    /**
     * @return LengthAwarePaginator<int, Division>
     */
    public function paginate(): LengthAwarePaginator
    {
        return Division::query()
            ->with('manager:id,name,email')
            ->latest()
            ->paginate(10)
            ->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Division
    {
        return Division::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Division $division, array $data): Division
    {
        $division->update($data);

        return $division->refresh();
    }

    public function delete(Division $division): void
    {
        $division->delete();
    }
}
