<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RolePermissionSeeder::class);

        // User::factory(10)->create();

        $superadmin = User::factory()->create([
            'name' => 'Super Admin',
            'email' => 'superadmin@mail.com',
            'staff_number' => 'k0001',
            'password' => bcrypt('password'),
            'phone' => '70001',

        ]);

        $direktur = User::factory()->create([
            'name' => 'Direktur',
            'email' => 'direktur@mail.com',
            'staff_number' => 'k0002',
            'password' => bcrypt('password'),
            'phone' => '70002',

        ]);

        
        $vicedirektur = User::factory()->create([
            'name' => 'Wakil Direktur',
            'email' => 'vicedirektur@mail.com',
            'staff_number' => 'k0003',
            'password' => bcrypt('password'),
            'phone' => '70003',

        ]);

        $manager = User::factory()->create([
            'name' => 'Manager',
            'email' => 'manager@mail.com',
            'staff_number' => 'k0004',
            'password' => bcrypt('password'),
            'phone' => '70004',

        ]);

        $staff = User::factory()->create([
            'name' => 'Staff',
            'email' => 'staff@mail.com',
            'staff_number' => 'k0005',
            'password' => bcrypt('password'),
            'phone' => '70005',

        ]);



        $superadmin->assignRole('superadmin');
        $direktur->assignRole('direktur');
        $vicedirektur->assignRole('vice_presiden');
        $manager->assignRole('manager');
        $staff->assignRole('staff');
    }
}
