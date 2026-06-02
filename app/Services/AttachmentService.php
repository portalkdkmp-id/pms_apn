<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;

class AttachmentService
{
    /**
     * @param  array<int, UploadedFile>|UploadedFile|null  $files
     */
    public function storeMany(Model $attachable, array|UploadedFile|null $files, User $user, string $directory): void
    {
        if (! $files) {
            return;
        }

        foreach (Arr::wrap($files) as $file) {
            if (! $file instanceof UploadedFile) {
                continue;
            }

            $path = $file->store($directory, 'public');

            $attachable->attachments()->create([
                'disk' => 'public',
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'size' => $file->getSize() ?: 0,
                'uploaded_by' => $user->id,
            ]);
        }
    }
}
