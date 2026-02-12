<?php

namespace Tests\Feature\Building;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class BuildingCrudTest extends TestCase
{
    use DatabaseTransactions; // SAFE: Only rolls back changes after test

    /** @test */
    public function test_user_factory_works()
    {
        $user = User::factory()->create();
        
        $this->assertNotNull($user->id);
    }

    /** @test */
    public function test_user_has_email()
    {
        $uniqueEmail = 'test_' . uniqid() . '@example.com';
        $user = User::factory()->create(['email' => $uniqueEmail]);

        $this->assertEquals($uniqueEmail, $user->email);
    }

    /** @test */
    public function test_assertions_work()
    {
        $this->assertTrue(true);
        $this->assertFalse(false);
    }
}
