<?php

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('project.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $user = $this->user();
        $divisionRules = ['required', 'uuid', 'exists:divisions,id'];
        $ownerRules = ['required', 'uuid', 'exists:users,id'];

        if ($user && ! $user->can('project.view_all') && $user->can('project.view_division') && $user->division_id !== null) {
            $divisionRules[] = Rule::in([$user->division_id]);
            $ownerRules = [
                'required',
                'uuid',
                Rule::exists('users', 'id')->where(fn ($query) => $query->where('division_id', $user->division_id)),
            ];
        }

        return [
            'code' => ['required', 'string', 'max:255', 'unique:projects,code'],
            'parent_id' => ['nullable', 'uuid', 'exists:projects,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'division_id' => $divisionRules,
            'owner_id' => $ownerRules,
            'status_id' => ['required', 'integer', 'exists:project_statuses,id'],
            'priority' => ['required', 'string', Rule::in(['low', 'medium', 'high', 'critical'])],
            'kpi_target' => ['nullable', 'numeric', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'expected_deadline' => ['nullable', 'date', 'after_or_equal:start_date'],
            'requires_previous_project_done' => ['sometimes', 'boolean'],
            'previous_project_id' => ['nullable', 'required_if:requires_previous_project_done,1', 'uuid', 'exists:projects,id'],
            'attachments' => ['nullable', 'array', 'max:5'],
            'attachments.*' => ['file', 'max:10240', 'mimes:jpg,jpeg,png,webp,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,zip'],
        ];
    }
}
