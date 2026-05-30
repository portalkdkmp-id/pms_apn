<?php

namespace App\Http\Requests\Task;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('task.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'project_id' => ['required', 'uuid', 'exists:projects,id'],
            'parent_id' => ['nullable', 'uuid', 'exists:tasks,id'],
            'assignee_id' => ['nullable', 'uuid', 'exists:users,id'],
            'status_id' => ['required', 'integer', 'exists:project_statuses,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'priority' => ['required', 'string', Rule::in(['low', 'medium', 'high', 'critical'])],
            'kpi_point' => ['required', 'numeric', 'min:0', 'max:999999.99', 'decimal:0,2'],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'completed_at' => ['nullable', 'date'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $project = Project::query()
                    ->with('teams.members:id')
                    ->find($this->input('project_id'));

                if (! $project) {
                    return;
                }

                $parentId = $this->input('parent_id');
                if ($parentId && Task::query()->whereKey($parentId)->where('project_id', '!=', $project->id)->exists()) {
                    $validator->errors()->add('parent_id', 'Parent task harus berada pada project yang sama.');
                }

                $assigneeId = $this->input('assignee_id');
                if ($assigneeId && ! $project->teams->flatMap->members->pluck('id')->contains($assigneeId)) {
                    $validator->errors()->add('assignee_id', 'Assignee harus merupakan member team pada project terkait.');
                }
            },
        ];
    }
}
