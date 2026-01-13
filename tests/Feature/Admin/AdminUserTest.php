<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function test_user_can_have_admin_role()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->assertEquals('admin', $admin->role);
    }

    /** @test */
    public function test_user_can_have_mitra_role()
    {
        $mitra = User::factory()->create(['role' => 'mitra']);

        $this->assertEquals('mitra', $mitra->role);
    }

    /** @test */
    public function test_user_can_have_member_role()
    {
        $member = User::factory()->create(['role' => 'member']);

        $this->assertEquals('member', $member->role);
    }

    /** @test */
    public function test_user_has_banned_status()
    {
        $user = User::factory()->create(['is_banned' => true]);

        $this->assertTrue($user->is_banned);
    }
}
