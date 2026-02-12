<?php

namespace Tests\Feature\Profile;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class ProfilePhotoTest extends TestCase
{
    use DatabaseTransactions; // SAFE: Only rolls back changes after test, doesn't delete database

    /** @test */
    public function test_user_model_exists()
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
    public function test_user_has_email()
    {
        $uniqueEmail = 'test_' . uniqid() . '@example.com';
        $user = User::factory()->create(['email' => $uniqueEmail]);
        
        $this->assertEquals($uniqueEmail, $user->email);
    }
}
