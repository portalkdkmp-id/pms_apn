<?php

namespace Database\Seeders;

use App\Models\Division;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DivisionSeeder extends Seeder
{
    public function run(): void
    {
        $divisions = [
            ['name' => 'Pengadaan', 'slug' => 'pengadaan', 'prefix' => 'PGD'],
            ['name' => 'Strategi Pengembangan Usaha', 'slug' => 'strategi-pengembangan-usaha', 'prefix' => 'SPU'],
            ['name' => 'HR', 'slug' => 'hr', 'prefix' => 'HR'],
            ['name' => 'Humas', 'slug' => 'humas', 'prefix' => 'HMS'],
        ];

        foreach ($divisions as $index => $divisionData) {
            $division = Division::query()
                ->where('slug', $divisionData['slug'])
                ->orWhere('name', $divisionData['name'])
                ->first() ?? new Division;

            $division->fill([
                'name' => $divisionData['name'],
                'slug' => $divisionData['slug'],
                'description' => 'Divisi '.$divisionData['name'],
            ])->save();

            $manager = User::updateOrCreate(
                ['email' => 'manager.'.$divisionData['slug'].'@mail.com'],
                [
                    'name' => 'Manager '.$divisionData['name'],
                    'staff_number' => $divisionData['prefix'].'-MGR-001',
                    'phone' => '71'.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT),
                    'division_id' => $division->id,
                    'password' => Hash::make('password'),
                ],
            );

            $staff = User::updateOrCreate(
                ['email' => 'staff.'.$divisionData['slug'].'@mail.com'],
                [
                    'name' => 'Staff '.$divisionData['name'],
                    'staff_number' => $divisionData['prefix'].'-STF-001',
                    'phone' => '72'.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT),
                    'division_id' => $division->id,
                    'password' => Hash::make('password'),
                ],
            );

            $manager->syncRoles(['manager']);
            $staff->syncRoles(['staff']);

            $division->update(['manager_id' => $manager->id]);
        }
    }
}
