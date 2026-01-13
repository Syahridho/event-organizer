<?php

namespace Tests\Feature\Building;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BuildingCrudTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function test_user_factory_works()
    {
        $user = User::factory()->create();
        
        $this->assertNotNull($user->id);
    }

    /** @test */
    public function test_user_has_email()
    {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $this->assertEquals('test@example.com', $user->email);
    }

    /** @test */
    public function test_assertions_work()
    {
        $this->assertTrue(true);
        $this->assertFalse(false);
    }
}
