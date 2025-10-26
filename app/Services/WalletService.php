<?php

namespace App\Services;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\TransactionItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WalletService
{
    /**
     * Credit refund to user's wallet for a partner-cancelled transaction item.
     *
     * Guarantees atomicity with DB::transaction and idempotency via reference check.
     *
     * @param User $user The buyer who should receive the refund
     * @param TransactionItem $item The cancelled transaction item
     * @return WalletTransaction The created or existing wallet transaction log
     *
     * @throws \Throwable on failure (transaction is rolled back)
     */
    public function creditRefund(User $user, TransactionItem $item): WalletTransaction
    {
        return DB::transaction(function () use ($user, $item) {
            // Calculate refund amount = price * quantity (supports both qty/quantity fields)
            $quantity = $item->qty ?? $item->quantity ?? 1;
            $price = (int) $item->price;
            $amount = (int) max(0, $price * (int) $quantity);

            if ($amount <= 0) {
                throw new \RuntimeException('Refund amount must be greater than zero.');
            }

            // Idempotency: avoid duplicate refunds for the same TransactionItem
            $existing = WalletTransaction::where('type', 'CREDIT')
                ->where('reference_type', 'transaction_item')
                ->where('reference_id', $item->id)
                ->first();

            if ($existing) {
                return $existing;
            }

            // Find or create user's wallet
            $wallet = Wallet::firstOrCreate(
                ['user_id' => $user->id],
                ['balance' => 0]
            );

            // Atomic balance increment
            // Using the model instance ensures the correct row is targeted
            $wallet->increment('balance', $amount);
            $wallet->refresh();

            // Create wallet transaction log
            $walletTransaction = WalletTransaction::create([
                'wallet_id'       => $wallet->id,
                'user_id'         => $user->id,
                'amount'          => $amount,
                'type'            => 'CREDIT',
                'reference_type'  => 'transaction_item',
                'reference_id'    => $item->id,
                'description'     => 'Refund for partner-cancelled transaction item #' . $item->id,
            ]);

            Log::info('Refund credited to wallet', [
                'user_id' => $user->id,
                'wallet_id' => $wallet->id,
                'transaction_item_id' => $item->id,
                'amount' => $amount,
                'new_balance' => $wallet->balance,
            ]);

            return $walletTransaction;
        });
    }
}