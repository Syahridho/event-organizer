<?php

namespace App\Services;

use App\Helpers\TaxHelper;

/**
 * Reusable service for Midtrans tax calculation and item generation
 * Ensures consistent tax handling across all payment controllers
 */
class MidtransTaxService
{
    /**
     * Generate Midtrans items with tax injection
     * 
     * @param array $baseItems Array of base items with price, quantity, name, id
     * @param float|null $taxValue Tax value (optional, will fetch from settings if not provided)
     * @param string|null $taxType Tax type (optional, will fetch from settings if not provided)
     * @return array Contains 'items' and 'total_amount'
     */
    public static function generateMidtransItems(array $baseItems, ?float $taxValue = null, ?string $taxType = null): array
    {
        $finalItems = [];
        $totalPrice = 0;

        // Get tax settings if not provided
        if ($taxValue === null || $taxType === null) {
            $taxSettings = TaxHelper::getTaxSettings();
            $taxValue = $taxValue ?? $taxSettings['tax_value'];
            $taxType = $taxType ?? $taxSettings['tax_type'];
        }

        // 1. Calculate base price total and structure original items for Midtrans
        foreach ($baseItems as $item) {
            // Clean item structure for Midtrans (only allowed fields)
            $cleanItem = [
                'id' => 'ITEM_' . $item['id'],
                'price' => (int) $item['price'],
                'quantity' => (int) $item['quantity'],
                'name' => substr($item['name'], 0, 50), // Midtrans limit 50 chars
            ];

            $finalItems[] = $cleanItem;
            $totalPrice += $item['price'] * $item['quantity'];
        }

        // 2. Calculate tax amount based on total price and tax type
        $taxAmount = 0;
        if ($taxType === 'percent') {
            $taxAmount = round($totalPrice * ($taxValue / 100));
        } elseif ($taxType === 'fixed') {
            $taxAmount = (float) $taxValue;
        }

        // 3. Inject the Tax Item (Crucial for Midtrans breakdown)
        if ($taxAmount > 0) {
            $finalItems[] = [
                'id' => 'TAX_ITEM',
                'price' => (int) $taxAmount,
                'quantity' => 1,
                'name' => 'Pajak Layanan'
            ];
        }

        // 4. Calculate Final Total Amount
        $finalTotal = $totalPrice + $taxAmount;

        return [
            'items' => $finalItems,
            'total_amount' => (int) $finalTotal,
            'subtotal' => (int) $totalPrice,
            'tax_amount' => (int) $taxAmount,
        ];
    }

    /**
     * Validate frontend subtotal against backend calculation
     * 
     * @param float $frontendSubtotal Subtotal sent from frontend
     * @param array $baseItems Base items for calculation
     * @return bool True if valid, false otherwise
     */
    public static function validateSubtotal(float $frontendSubtotal, array $baseItems): bool
    {
        $calculatedSubtotal = 0;
        
        foreach ($baseItems as $item) {
            $calculatedSubtotal += $item['price'] * $item['quantity'];
        }

        // Allow 1 rupiah tolerance for rounding
        return abs($calculatedSubtotal - $frontendSubtotal) <= 1;
    }

    /**
     * Extract clean base items from validated items
     * 
     * @param array $validatedItems Validated items from controller
     * @return array Clean base items for tax calculation
     */
    public static function extractBaseItems(array $validatedItems): array
    {
        $baseItems = [];
        
        foreach ($validatedItems as $validatedItem) {
            $baseItems[] = [
                'id' => $validatedItem['item']->id,
                'price' => $validatedItem['price'],
                'quantity' => $validatedItem['quantity'],
                'name' => $validatedItem['item']->name ?? 'Item',
            ];
        }
        
        return $baseItems;
    }
}