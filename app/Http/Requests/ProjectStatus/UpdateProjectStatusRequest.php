<?php

namespace App\Http\Requests\ProjectStatus;

use App\Models\ProjectStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProjectStatusRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_active' => $this->boolean('is_active'),
        ]);
    }

    public function authorize(): bool
    {
        return $this->user()?->can('project_status.update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var ProjectStatus $projectStatus */
        $projectStatus = $this->route('project_status');

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('project_statuses', 'name')->ignore($projectStatus)],
            'slug' => ['required', 'string', 'max:255', 'alpha_dash:ascii', Rule::unique('project_statuses', 'slug')->ignore($projectStatus)],
            'color' => ['required', 'string', 'max:20'],
            'sort_order' => ['required', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }
}
