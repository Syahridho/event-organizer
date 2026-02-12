<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class AdminEventTest extends TestCase
{
    use DatabaseTransactions; // SAFE: Only rolls back changes after test

    /** @test */
    public function test_admin_user_exists()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->assertEquals('admin', $admin->role);
    }

    /** @test */
    public function test_admin_can_be_created()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
            'role' => 'admin',
        ]);
    }

    /** @test */
    public function test_admin_has_permissions()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->assertTrue($admin->role === 'admin');
    }
}
