<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Service;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\Wallet;
use App\Models\WalletTransaction;

class WalletRefundTest extends TestCase
{
    use RefreshDatabase;

    public function test_partner_cancellation_refunds_user_wallet_and_logs_history_idempotently(): void
    {
        // Create seller (mitra) and buyer (member)
        $seller = User::factory()->create([
            'role' => 'mitra',
        ]);

        $buyer = User::factory()->create([
            'role' => 'member',
        ]);

        // Create a service owned by seller
        $service = Service::create([
            'user_id' => $seller->id,
            'name' => 'Test Service',
            'thumbnail' => null,
            'description' => 'Test description',
            'location' => 'Jakarta',
            'price' => 150000,
            'status' => 'active',
        ]);

        // Create a settled transaction belonging to the buyer
        $transaction = Transaction::create([
            'user_id' => $buyer->id,
            'order_id' => 'ORD-TEST-123',
            'redirect_url' => 'http://example.com/return',
            'status' => 'settlement',
            'token' => 'tok_test_123',
            'total' => 150000,
            'tax' => '0',
            'payment_type' => 'bank_transfer',
            'va_number' => '1234567890',
            'bank_name' => 'bni',
            'bill_key' => null,
            'biller_code' => null,
        ]);

        // Create a transaction item referencing the service (use FQCN for morphTo to resolve)
        $item = TransactionItem::create([
            'transaction_id' => $transaction->id,
            'item_id' => $service->id,
            'item_type' => Service::class, // critical for morphTo to load owner for authorization
            'type' => 'Service Item',
            'price' => 150000,
            'qty' => 1,
            'status' => 'confirmed',
            'delivery_type' => null,
            'delivery_fee' => 0,
            'delivery_fee_status' => 'pending',
            'note' => 'Test',
        ]);

        // Ensure buyer has no wallet/transactions initially
        $this->assertNull(Wallet::where('user_id', $buyer->id)->first());
        $this->assertEquals(0, WalletTransaction::where('user_id', $buyer->id)->count());

        // Partner cancels the item with a valid note
        $response = $this->actingAs($seller)
            ->post(route('mitra.transactions.cancel', ['transactionItem' => $item->id]), [
                'note' => 'Alasan pembatalan valid.',
            ]);

        $response->assertStatus(302);

        // Assert wallet created & credited
        $wallet = Wallet::where('user_id', $buyer->id)->first();
        $this->assertNotNull($wallet, 'Buyer wallet should be created');
        $this->assertEquals(150000.00, (float) $wallet->balance, 'Wallet balance should equal refunded amount');

        // Assert wallet transaction logged
        $this->assertDatabaseHas('wallet_transactions', [
            'user_id' => $buyer->id,
            'wallet_id' => $wallet->id,
            'amount' => 150000.00,
            'type' => 'CREDIT',
            'reference_type' => 'transaction_item',
            'reference_id' => $item->id,
        ]);

        // Calling cancel again must be idempotent (no duplicate credit)
        $response2 = $this->actingAs($seller)
            ->post(route('mitra.transactions.cancel', ['transactionItem' => $item->id]), [
                'note' => 'Alasan pembatalan valid kedua.',
            ]);

        $response2->assertStatus(302);

        $wallet->refresh();
        $this->assertEquals(150000.00, (float) $wallet->balance, 'Wallet balance should not double-credit');
        $this->assertEquals(1, WalletTransaction::where('user_id', $buyer->id)
            ->where('reference_type', 'transaction_item')
            ->where('reference_id', $item->id)
            ->count(), 'There should be exactly one wallet transaction for the reference');
    }
}