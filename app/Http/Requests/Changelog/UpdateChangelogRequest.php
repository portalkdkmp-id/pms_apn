<?php

namespace App\Http\Requests\Changelog;

use App\Models\Changelog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateChangelogRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'changes' => $this->changesFromText(),
            'is_published' => $this->boolean('is_published'),
        ]);
    }

    public function authorize(): bool
    {
        return $this->user()?->can('changelog.update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Changelog $changelog */
        $changelog = $this->route('changelog');

        return [
            'version' => ['required', 'string', 'max:50', Rule::unique('changelogs', 'version')->ignore($changelog)],
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', Rule::in(['major', 'minor', 'patch', 'hotfix', 'beta'])],
            'summary' => ['nullable', 'string'],
            'changes' => ['required', 'array', 'min:1'],
            'changes.*' => ['required', 'string', 'max:500'],
            'is_published' => ['boolean'],
            'released_at' => ['nullable', 'date'],
        ];
    }

    /**
     * @return array<int, string>
     */
    private function changesFromText(): array
    {
        return collect(preg_split('/\r\n|\r|\n/', (string) $this->input('changes_text', '')))
            ->map(fn (string $line) => trim($line, " \t\n\r\0\x0B-•"))
            ->filter()
            ->values()
            ->all();
    }
}
