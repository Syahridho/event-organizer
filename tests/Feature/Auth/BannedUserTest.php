<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BannedUserTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function test_banned_user_cannot_login()
    {
        $user = User::factory()->create([
            'email' => 'banned@example.com',
            'password' => bcrypt('password'),
            'is_banned' => true,
        ]);

        $response = $this->post(route('login'), [
            'email' => 'banned@example.com',
            'password' => 'password',
        ]);

        $this->assertGuest();
    }

    /** @test */
    public function test_active_user_can_login()
    {
        $user = User::factory()->create([
            'email' => 'active@example.com',
            'password' => bcrypt('password'),
            'is_banned' => false,
        ]);

        $response = $this->post(route('login'), [
            'email' => 'active@example.com',
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
    }
}
