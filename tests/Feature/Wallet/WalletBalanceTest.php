<?php

namespace Tests\Feature\Wallet;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class WalletBalanceTest extends TestCase
{
    use DatabaseTransactions; // SAFE: Only rolls back changes after test

    /** @test */
    public function test_user_can_have_wallet()
    {
        $user = User::factory()->create();
        $wallet = Wallet::create([
            'user_id' => $user->id,
            'balance' => 0,
        ]);

        $this->assertDatabaseHas('wallets', [
            'user_id' => $user->id,
        ]);
    }

    /** @test */
    public function test_wallet_has_balance()
    {
        $user = User::factory()->create();
        $wallet = Wallet::create([
            'user_id' => $user->id,
            'balance' => 100000,
        ]);

        $this->assertEquals(100000, $wallet->balance);
    }

    /** @test */
    public function test_wallet_balance_is_numeric()
    {
        $user = User::factory()->create();
        $wallet = Wallet::create([
            'user_id' => $user->id,
            'balance' => 50000,
        ]);

        $this->assertIsNumeric($wallet->balance);
    }
}
