<?php

namespace App\Http\Requests\Project;

use App\Models\Project;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('project.update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Project $project */
        $project = $this->route('project');

        return [
            'code' => ['required', 'string', 'max:255', Rule::unique('projects', 'code')->ignore($project)],
            'parent_id' => ['nullable', 'uuid', 'exists:projects,id', Rule::notIn([$project->id])],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'division_id' => ['required', 'uuid', 'exists:divisions,id'],
            'owner_id' => ['required', 'uuid', 'exists:users,id'],
            'status_id' => ['required', 'integer', 'exists:project_statuses,id'],
            'priority' => ['required', 'string', Rule::in(['low', 'medium', 'high', 'critical'])],
            'kpi_target' => ['nullable', 'numeric', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'expected_deadline' => ['nullable', 'date', 'after_or_equal:start_date'],
            'requires_previous_project_done' => ['sometimes', 'boolean'],
            'previous_project_id' => ['nullable', 'required_if:requires_previous_project_done,1', 'uuid', 'exists:projects,id', Rule::notIn([$project->id])],
            'attachments' => ['nullable', 'array', 'max:5'],
            'attachments.*' => ['file', 'max:10240', 'mimes:jpg,jpeg,png,webp,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,zip'],
        ];
    }
}
