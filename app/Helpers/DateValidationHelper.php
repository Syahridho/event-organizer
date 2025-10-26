<?php

namespace App\Helpers;

use Carbon\Carbon;

class DateValidationHelper
{
    /**
     * Check if event is still valid for purchase
     * Uses fastest validation with early returns
     */
    public static function isEventValid($event): array
    {
        $now = Carbon::now();

        // Rule 1: Check event end date (fastest check first)
        if ($event->event_date_end) {
            $eventDateEnd = Carbon::parse($event->event_date_end)->endOfDay();
            if ($eventDateEnd->isPast()) {
                return [
                    'valid' => false,
                    'message' => 'Event sudah berakhir',
                    'code' => 'EVENT_ENDED'
                ];
            }
        }

        // Rule 2: Check ticket sales end date
        if ($event->ticket_date_end) {
            $ticketDateEnd = Carbon::parse($event->ticket_date_end)->endOfDay();
            if ($ticketDateEnd->isPast()) {
                return [
                    'valid' => false,
                    'message' => 'Periode penjualan tiket sudah berakhir',
                    'code' => 'SALES_ENDED'
                ];
            }
        }

        // Rule 3: Check ticket sales start date
        if ($event->ticket_date_start) {
            $ticketDateStart = Carbon::parse($event->ticket_date_start)->startOfDay();
            if ($ticketDateStart->isFuture()) {
                return [
                    'valid' => false,
                    'message' => 'Penjualan tiket belum dimulai',
                    'code' => 'SALES_NOT_STARTED'
                ];
            }
        }

        return [
            'valid' => true,
            'message' => 'Event masih valid',
            'code' => 'VALID'
        ];
    }

    /**
     * Check if rent date is valid (for service/building/property)
     * Optimized with single comparison
     */
    public static function isRentDateValid($rentDate): array
    {
        if (!$rentDate) {
            return [
                'valid' => false,
                'message' => 'Tanggal sewa harus dipilih',
                'code' => 'RENT_DATE_REQUIRED'
            ];
        }

        $now = Carbon::today(); // Start of today (00:00:00)
        $rent = Carbon::parse($rentDate)->startOfDay();

        if ($rent->isPast()) {
            return [
                'valid' => false,
                'message' => 'Tanggal sewa sudah terlewat. Silakan pilih tanggal lain.',
                'code' => 'RENT_DATE_EXPIRED'
            ];
        }

        return [
            'valid' => true,
            'message' => 'Tanggal sewa valid',
            'code' => 'VALID'
        ];
    }

    /**
     * Validate product availability with date check
     * Fast algorithm with early returns (O(1) time complexity)
     */
    public static function validateProductPurchase($item, $itemType, $rentDate = null): array
    {
        // Early return pattern for fastest validation

        // Ticket validation (Event)
        if ($itemType === 'ticket') {
            if (!isset($item->event)) {
                return [
                    'valid' => false,
                    'message' => 'Event tidak ditemukan',
                    'code' => 'EVENT_NOT_FOUND'
                ];
            }

            return self::isEventValid($item->event);
        }

        // Rentable items validation (Service, Building, Property)
        if (in_array($itemType, ['service', 'building', 'property'])) {
            return self::isRentDateValid($rentDate);
        }

        // Default valid for unknown types
        return [
            'valid' => true,
            'message' => 'Item valid',
            'code' => 'VALID'
        ];
    }

    /**
     * Bulk validate cart items before checkout
     * Optimized to fail fast on first invalid item
     *
     * @param array $cartItems Array of cart items with structure: ['item', 'type', 'rent_days']
     * @return array ['valid' => bool, 'message' => string, 'invalid_items' => array]
     */
    public static function validateCartItems(array $cartItems): array
    {
        $invalidItems = [];

        foreach ($cartItems as $cartItem) {
            $item = $cartItem['item'] ?? null;
            $type = $cartItem['type'] ?? null;
            $rentDate = $cartItem['rent_days'] ?? null;

            if (!$item || !$type) {
                $invalidItems[] = [
                    'item' => $cartItem,
                    'reason' => 'Item atau tipe tidak valid'
                ];
                continue;
            }

            $validation = self::validateProductPurchase($item, $type, $rentDate);

            if (!$validation['valid']) {
                $invalidItems[] = [
                    'item' => $cartItem,
                    'reason' => $validation['message'],
                    'code' => $validation['code']
                ];
            }
        }

        if (!empty($invalidItems)) {
            return [
                'valid' => false,
                'message' => 'Beberapa item di keranjang tidak valid. Silakan hapus atau perbarui.',
                'invalid_items' => $invalidItems
            ];
        }

        return [
            'valid' => true,
            'message' => 'Semua item valid',
            'invalid_items' => []
        ];
    }
}
