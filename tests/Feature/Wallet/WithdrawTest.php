<?php

namespace Tests\Feature\Wallet;

use App\Models\User;
use App\Models\Withdraw;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WithdrawTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function test_withdraw_can_be_created()
    {
        $user = User::factory()->create();
        
        $withdraw = Withdraw::create([
            'user_id' => $user->id,
            'amount' => 100000,
            'method' => 'bank_transfer',
            'account_holder_name' => 'John Doe',
            'account_number' => '1234567890',
            'bank_name' => 'BCA',
            'status' => 'pending',
        ]);

        $this->assertDatabaseHas('withdraws', [
            'user_id' => $user->id,
            'amount' => 100000,
        ]);
    }

    /** @test */
    public function test_withdraw_belongs_to_user()
    {
        $user = User::factory()->create();
        
        $withdraw = Withdraw::create([
            'user_id' => $user->id,
            'amount' => 100000,
            'method' => 'bank_transfer',
            'account_holder_name' => 'John Doe',
            'account_number' => '1234567890',
            'bank_name' => 'BCA',
            'status' => 'pending',
        ]);

        $this->assertEquals($user->id, $withdraw->user_id);
    }

    /** @test */
    public function test_withdraw_has_status()
    {
        $user = User::factory()->create();
        
        $withdraw = Withdraw::create([
            'user_id' => $user->id,
            'amount' => 100000,
            'method' => 'bank_transfer',
            'account_holder_name' => 'John Doe',
            'account_number' => '1234567890',
            'bank_name' => 'BCA',
            'status' => 'pending',
        ]);

        $this->assertEquals('pending', $withdraw->status);
    }
}
