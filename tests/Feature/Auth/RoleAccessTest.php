<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function admin_can_access_admin_dashboard()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->get('/admin/dashboard');

        $response->assertStatus(200);
    }

    /** @test */
    public function member_cannot_access_admin_dashboard()
    {
        $member = User::factory()->create(['role' => 'member']);

        $response = $this->actingAs($member)->get('/admin/dashboard');

        $response->assertForbidden(); // 403
    }

    /** @test */
    public function mitra_cannot_access_admin_dashboard()
    {
        $mitra = User::factory()->create(['role' => 'mitra']);

        $response = $this->actingAs($mitra)->get('/admin/dashboard');

        $response->assertForbidden();
    }

    /** @test */
    public function banned_user_cannot_login()
    {
        $user = User::factory()->create([
            'role' => 'member',
            'is_banned' => true,
            'banned_reason' => 'Violation',
        ]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertGuest();
        $response->assertRedirect(); // mungkin ke login dengan error
        $response->assertSessionHasErrors(['email']); // atau pesan error
    }

    /** @test */
    public function banned_admin_cannot_access_admin_dashboard()
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_banned' => true,
        ]);

        $response = $this->actingAs($admin)->get('/admin/dashboard');

        $response->assertForbidden(); // atau redirect ke login
    }

    /** @test */
    public function user_without_role_defaults_to_member()
    {
        $user = User::factory()->create(['role' => null]);

        $response = $this->actingAs($user)->get('/admin/dashboard');

        $response->assertForbidden();
    }

    /** @test */
    public function admin_can_access_admin_withdraw_index()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->get('/admin/withdraw');

        $response->assertStatus(200);
    }

    /** @test */
    public function non_admin_cannot_access_admin_withdraw_index()
    {
        $user = User::factory()->create(['role' => 'member']);

        $response = $this->actingAs($user)->get('/admin/withdraw');

        $response->assertForbidden();
    }
}