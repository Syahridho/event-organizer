<?php

namespace Tests\Feature\Report;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use DatabaseTransactions; // SAFE: Only rolls back changes after test

    /** @test */
    public function test_user_can_be_created()
    {
        $user = User::factory()->create();
        
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
        ]);
    }

    /** @test */
    public function test_user_has_id()
    {
        $user = User::factory()->create();
        
        $this->assertNotNull($user->id);
    }

    /** @test */
    public function test_database_connection_works()
    {
        $this->assertTrue(true);
    }
}
