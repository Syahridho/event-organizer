<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Member',
            'email' => 'qwe@gmail.com',
            'username' => 'member',
            'password' => Hash::make('qweqweqwe'),
            'role' => 'member',
            'email_verified_at' => now(),
            'uuid' => str()->uuid(),
            'last_seen_at' => now(),
        ]);

        User::create([
            'name' => 'Mitra',
            'email' => 'asd@gmail.com',
            'username' => 'mitra',
            'password' => Hash::make('asdasdasd'),
            'role' => 'mitra',
            'email_verified_at' => now(),
            'uuid' => str()->uuid(),
            'last_seen_at' => now(),
        ]);

        User::create([
            'name' => 'Admin',
            'email' => 'admin@gmail.com',
            'username' => 'admin',
            'password' => Hash::make('admin'),
            'role' => 'admin',
            'email_verified_at' => now(),
            'uuid' => str()->uuid(),
            'last_seen_at' => now(),
        ]);
    }
}
