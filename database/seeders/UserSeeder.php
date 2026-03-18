<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Teacher (Instructor) Account
        User::updateOrCreate(
            ['email' => 'teacher@example.com'],
            [
                'name' => 'John Teacher',
                'password' => Hash::make('password'),
                'role' => User::ROLE_INSTRUCTOR,
                'email_verified_at' => now(),
            ]
        );

        // Student Account
        User::updateOrCreate(
            ['email' => 'student@example.com'],
            [
                'name' => 'Jane Student',
                'password' => Hash::make('password'),
                'role' => User::ROLE_STUDENT,
                'email_verified_at' => now(),
            ]
        );
    }
}
