<?php

namespace Tests\Feature\Profile;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfilePhotoTest extends TestCase
{
    use RefreshDatabase;

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
        $user = User::factory()->create(['email' => 'test@example.com']);
        
        $this->assertEquals('test@example.com', $user->email);
    }
}
