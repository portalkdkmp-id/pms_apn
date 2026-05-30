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
            'code' => ['required', 'string', 'max:50', 'unique:divisions,code'],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
