<?php

namespace App\Http\Requests\Division;

use App\Models\Division;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDivisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('division.update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Division $division */
        $division = $this->route('division');

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('divisions', 'name')->ignore($division)],
            'code' => ['required', 'string', 'max:50', Rule::unique('divisions', 'code')->ignore($division)],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
