<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class BannedUserTest extends TestCase
{
    use DatabaseTransactions; // SAFE: Only rolls back changes after test

    /** @test */
    public function test_banned_user_cannot_login()
    {
        $uniqueEmail = 'banned_' . uniqid() . '@example.com';
        $user = User::factory()->create([
            'email' => $uniqueEmail,
            'password' => bcrypt('password'),
            'is_banned' => true,
        ]);

        $response = $this->post(route('login'), [
            'email' => $uniqueEmail,
            'password' => 'password',
        ]);

        $this->assertGuest();
    }

    /** @test */
    public function test_active_user_can_login()
    {
        $uniqueEmail = 'active_' . uniqid() . '@example.com';
        $user = User::factory()->create([
            'email' => $uniqueEmail,
            'password' => bcrypt('password'),
            'is_banned' => false,
        ]);

        $response = $this->post(route('login'), [
            'email' => $uniqueEmail,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
    }
}
