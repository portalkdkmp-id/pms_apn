<?php

namespace App\Http\Requests\Team;

use App\Models\Team;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTeamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('team.update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Team $team */
        $team = $this->route('team');

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('teams', 'name')->ignore($team)],
            'slug' => ['required', 'string', 'max:255', 'alpha_dash:ascii', Rule::unique('teams', 'slug')->ignore($team)],
            'description' => ['nullable', 'string'],
            'project_id' => ['required', 'uuid', 'exists:projects,id'],
            'leader_id' => ['nullable', 'uuid', 'exists:users,id'],
            'member_ids' => ['array'],
            'member_ids.*' => ['uuid', Rule::exists('users', 'id')],
        ];
    }
}
