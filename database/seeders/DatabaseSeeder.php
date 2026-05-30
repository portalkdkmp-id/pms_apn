<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            ProjectStatusSeeder::class,
        ]);

        $users = [
            ['name' => 'Super Admin', 'email' => 'superadmin@mail.com', 'staff_number' => 'k0001', 'phone' => '70001', 'role' => 'superadmin'],
            ['name' => 'Direktur', 'email' => 'direktur@mail.com', 'staff_number' => 'k0002', 'phone' => '70002', 'role' => 'direktur'],
            ['name' => 'Wakil Direktur', 'email' => 'vicedirektur@mail.com', 'staff_number' => 'k0003', 'phone' => '70003', 'role' => 'vice_presiden'],
            ['name' => 'Manager', 'email' => 'manager@mail.com', 'staff_number' => 'k0004', 'phone' => '70004', 'role' => 'manager'],
            ['name' => 'Staff', 'email' => 'staff@mail.com', 'staff_number' => 'k0005', 'phone' => '70005', 'role' => 'staff'],
        ];

        foreach ($users as $userData) {
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'staff_number' => $userData['staff_number'],
                    'password' => Hash::make('password'),
                    'phone' => $userData['phone'],
                ],
            );

            $user->syncRoles([$userData['role']]);
        }

        $this->call(DivisionSeeder::class);
        $this->call(ProjectDemoSeeder::class);
    }
}
