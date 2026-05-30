<?php

namespace App\Http\Requests\Division;

use Illuminate\Foundation\Http\FormRequest;

class StoreDivisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('division.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:divisions,name'],
            'slug' => ['required', 'string', 'max:255', 'alpha_dash:ascii', 'unique:divisions,slug'],
            'description' => ['nullable', 'string', 'max:1000'],
            'manager_id' => ['nullable', 'uuid', 'exists:users,id'],
        ];
    }
}
