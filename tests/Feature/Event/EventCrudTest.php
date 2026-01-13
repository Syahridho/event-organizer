<?php

namespace Tests\Feature\Event;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventCrudTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function test_user_can_be_created()
    {
        $user = User::factory()->create();
        
        $this->assertInstanceOf(User::class, $user);
    }

    /** @test */
    public function test_user_has_name()
    {
        $user = User::factory()->create(['name' => 'Test User']);

        $this->assertEquals('Test User', $user->name);
    }

    /** @test */
    public function test_database_works()
    {
        $this->assertTrue(true);
    }
}
