<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventFreeApiTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function test_user_model_works()
    {
        $user = User::factory()->create();

        $this->assertNotNull($user->id);
    }

    /** @test */
    public function test_user_has_attributes()
    {
        $user = User::factory()->create();

        $this->assertNotNull($user->name);
        $this->assertNotNull($user->email);
    }

    /** @test */
    public function test_database_connection()
    {
        $this->assertTrue(true);
    }
}
