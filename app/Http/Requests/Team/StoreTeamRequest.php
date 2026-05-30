<?php

namespace App\Http\Requests\Team;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTeamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('team.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'alpha_dash:ascii', 'unique:teams,slug'],
            'description' => ['nullable', 'string'],
            'project_id' => ['required', 'uuid', 'exists:projects,id'],
            'leader_id' => ['nullable', 'uuid', 'exists:users,id'],
            'member_ids' => ['array'],
            'member_ids.*' => ['uuid', Rule::exists('users', 'id')],
        ];
    }
}
