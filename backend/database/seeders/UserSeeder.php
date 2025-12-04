<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();
        $expiresAt = $now->copy()->addDays(90);

        // Create Admin User
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@hometronix.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'is_active' => true,
            'force_password_change' => false,
            'password_changed_at' => $now,
            'password_expires_at' => $expiresAt,
        ]);

        // Create Salesperson User
        User::create([
            'name' => 'John Doe',
            'email' => 'john@hometronix.com',
            'password' => Hash::make('password'),
            'role' => 'salesperson',
            'is_active' => true,
            'force_password_change' => false,
            'password_changed_at' => $now,
            'password_expires_at' => $expiresAt,
        ]);

        // Create Technician User
        User::create([
            'name' => 'Mike Johnson',
            'email' => 'mike@hometronix.com',
            'password' => Hash::make('password'),
            'role' => 'technician',
            'is_active' => true,
            'force_password_change' => false,
            'password_changed_at' => $now,
            'password_expires_at' => $expiresAt,
        ]);
    }
}
