<?php

namespace App\Http\Requests\ProjectStatus;

use Illuminate\Foundation\Http\FormRequest;

class StoreProjectStatusRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_active' => $this->boolean('is_active'),
        ]);
    }

    public function authorize(): bool
    {
        return $this->user()?->can('project_status.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:project_statuses,name'],
            'slug' => ['required', 'string', 'max:255', 'alpha_dash:ascii', 'unique:project_statuses,slug'],
            'color' => ['required', 'string', 'max:20'],
            'sort_order' => ['required', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }
}
