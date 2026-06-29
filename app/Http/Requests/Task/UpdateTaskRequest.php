<?php

namespace App\Http\Requests\Task;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Task $task */
        $task = $this->route('task');
        $user = $this->user();

        if (! $user?->can('task.update')) {
            return false;
        }

        if ($user->can('task.view_all')) {
            return true;
        }

        if ($user->can('task.view_division') && $user->division_id === $task->project?->division_id) {
            return true;
        }

        return $user->can('task.view_assigned') && $task->assignee_id === $user->id;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Task $task */
        $task = $this->route('task');

        return [
            'project_id' => ['required', 'uuid', 'exists:projects,id'],
            'parent_id' => ['nullable', 'uuid', 'exists:tasks,id', Rule::notIn([$task->id])],
            'division_id' => ['nullable', 'uuid', 'exists:divisions,id'],
            'assignee_id' => ['nullable', 'uuid', 'exists:users,id'],
            'status_id' => ['required', 'integer', 'exists:project_statuses,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'priority' => ['required', 'string', Rule::in(['low', 'medium', 'high', 'critical'])],
            'kpi_point' => ['required', 'numeric', 'min:0', 'max:999999.99', 'decimal:0,2'],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'completed_at' => ['nullable', 'date'],
            'requires_previous_task_done' => ['sometimes', 'boolean'],
            'previous_task_id' => ['nullable', 'required_if:requires_previous_task_done,1', 'uuid', 'exists:tasks,id', Rule::notIn([$task->id])],
            'attachments' => ['nullable', 'array', 'max:5'],
            'attachments.*' => ['file', 'max:10240', 'mimes:jpg,jpeg,png,webp,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,zip'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $project = Project::query()->find($this->input('project_id'));

                if (! $project) {
                    return;
                }

                $parentId = $this->input('parent_id');
                if ($parentId && Task::query()->whereKey($parentId)->where('project_id', '!=', $project->id)->exists()) {
                    $validator->errors()->add('parent_id', 'Parent task harus berada pada project yang sama.');
                }

                $previousTaskId = $this->input('previous_task_id');
                if ($previousTaskId && Task::query()->whereKey($previousTaskId)->where('project_id', '!=', $project->id)->exists()) {
                    $validator->errors()->add('previous_task_id', 'Previous task harus berada pada project yang sama.');
                }

                $divisionId = $this->input('division_id') ?: $project->division_id;
                $assigneeId = $this->input('assignee_id');
                if ($assigneeId && User::query()->whereKey($assigneeId)->where('division_id', '!=', $divisionId)->exists()) {
                    $validator->errors()->add('assignee_id', 'PIC harus berasal dari divisi task.');
                }
            },
        ];
    }
}
