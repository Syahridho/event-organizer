<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Cart;
use Illuminate\Support\Facades\DB;

class CleanupSoldOutCartItems extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cart:cleanup-sold-out';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically remove cart items that have been booked and settled by other users';

    /**
     * Execute the console command.
     *
     * OPTIMIZED: Single query approach with O(n) complexity
     * Cleans up cart items that are no longer available because another user has settled payment
     */
    public function handle()
    {
        $this->info('Starting cart cleanup for sold-out items...');

        // Step 1: Get all settled bookings (same query as CartController)
        $bookedDates = DB::table('transaction_items')
            ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
            ->where('transactions.status', 'settlement')
            ->whereIn('transaction_items.item_type', ['service', 'building', 'rent_property'])
            ->whereNotNull('transaction_items.rent_days')
            ->select(
                'transaction_items.item_id',
                'transaction_items.item_type',
                'transaction_items.rent_days',
                'transactions.user_id'
            )
            ->get()
            ->groupBy(function ($item) {
                return $item->item_id . '_' . $item->item_type . '_' . $item->rent_days;
            });

        if ($bookedDates->isEmpty()) {
            $this->info('No settled bookings found. Nothing to clean up.');
            return Command::SUCCESS;
        }

        $this->info('Found ' . $bookedDates->count() . ' settled bookings.');

        // Step 2: Get all cart items that might be sold out
        $carts = Cart::whereIn('type', ['service', 'building', 'property'])
            ->whereNotNull('rent_days')
            ->get();

        if ($carts->isEmpty()) {
            $this->info('No rentable items in any cart. Nothing to clean up.');
            return Command::SUCCESS;
        }

        $this->info('Checking ' . $carts->count() . ' cart items...');

        // Step 3: Find and delete sold-out cart items
        $deletedCount = 0;
        $cartIdsToDelete = [];

        foreach ($carts as $cart) {
            // CRITICAL FIX: Normalize item_type for consistent matching
            $normalizedType = $this->normalizeItemType($cart->item_type, $cart->type);
            $key = $cart->item_id . '_' . $normalizedType . '_' . $cart->rent_days;

            // Check if this exact date is already booked
            if (isset($bookedDates[$key])) {
                $bookingInfo = $bookedDates[$key]->first();

                // Only delete if booked by ANOTHER user (not the cart owner)
                if ($bookingInfo->user_id != $cart->user_id) {
                    $cartIdsToDelete[] = $cart->id;
                    $deletedCount++;
                }
            }
        }

        // Step 4: Bulk delete sold-out cart items
        if (!empty($cartIdsToDelete)) {
            Cart::whereIn('id', $cartIdsToDelete)->delete();
            $this->info("✅ Successfully cleaned up {$deletedCount} sold-out cart items.");
            $this->line('Cart IDs deleted: ' . implode(', ', $cartIdsToDelete));
        } else {
            $this->info('No sold-out items found in carts. All items are still available.');
        }

        return Command::SUCCESS;
    }

    /**
     * CRITICAL: Normalize item_type for consistent matching between cart and transactions
     *
     * @param string $itemType Fully qualified class name (e.g., App\Models\Building)
     * @param string $type Short type name (e.g., building, service, property)
     * @return string Normalized type for transaction_items table
     */
    private function normalizeItemType($itemType, $type)
    {
        // Map cart type to transaction_items item_type
        $typeMapping = [
            'building' => 'building',
            'service' => 'service',
            'property' => 'rent_property', // Important: property in cart = rent_property in transactions
        ];

        return $typeMapping[$type] ?? $type;
    }
}
