<?php

namespace App\Helpers;

use App\Models\AdminSetting;
use Illuminate\Support\Facades\Cache;

class TaxHelper
{
    /**
     * Get tax settings with caching for optimal performance
     * Cache for 10 minutes to reduce database queries
     *
     * ALGORITHM: O(1) time complexity with memoization pattern
     *
     * @return array ['tax_type' => string, 'tax_value' => float]
     */
    public static function getTaxSettings(): array
    {
        return Cache::remember('tax_settings', now()->addMinutes(10), function () {
            $settings = AdminSetting::first();

            return [
                'tax_type' => $settings->tax_type ?? 'percent', // percent or fixed (DB enum)
                'tax_value' => $settings->tax_value ?? 0,
            ];
        });
    }

    /**
     * Calculate tax amount based on subtotal
     * ALGORITHM: O(1) time complexity - single conditional operation
     *
     * OPTIMIZATION: Calculation dilakukan sekali, hasil di-cache di level aplikasi
     *
     * @param float $subtotal
     * @return float Tax amount
     */
    public static function calculateTax(float $subtotal): float
    {
        $taxSettings = self::getTaxSettings();

        if ($taxSettings['tax_type'] === 'percent') {
            // Percentage-based tax (e.g., 10% = 0.10 * subtotal)
            return round($subtotal * ($taxSettings['tax_value'] / 100), 2);
        } else {
            // Fixed tax amount - constant time
            return (float) $taxSettings['tax_value'];
        }
    }

    /**
     * Calculate total with tax included
     *
     * @param float $subtotal
     * @return array ['subtotal' => float, 'tax' => float, 'total' => float]
     */
    public static function calculateTotal(float $subtotal): array
    {
        $tax = self::calculateTax($subtotal);

        return [
            'subtotal' => $subtotal,
            'tax' => $tax,
            'total' => $subtotal + $tax,
        ];
    }

    /**
     * Get tax display info for frontend
     * ALGORITHM: O(1) - single cache retrieval and string formatting
     *
     * @return array ['type' => string, 'value' => float, 'label' => string]
     */
    public static function getTaxInfo(): array
    {
        $taxSettings = self::getTaxSettings();

        $label = $taxSettings['tax_type'] === 'percent'
            ? "Pajak ({$taxSettings['tax_value']}%)"
            : "Pajak (Biaya Tetap)";

        return [
            'type' => $taxSettings['tax_type'],
            'value' => $taxSettings['tax_value'],
            'label' => $label,
        ];
    }

    /**
     * Calculates the final price including tax.
     * This function is reusable across all relevant Laravel controllers.
     * ALGORITHM: O(1) time complexity - single conditional operation
     *
     * @param float $basePrice The original price before tax
     * @param float|null $taxValue The tax value (optional, will fetch from settings if null)
     * @param string|null $taxType The tax type (optional, will fetch from settings if null)
     * @return float The final price including tax
     */
    public static function calculateFinalPrice(float $basePrice, ?float $taxValue = null, ?string $taxType = null): float
    {
        // Get tax settings if not provided
        if ($taxValue === null || $taxType === null) {
            $taxSettings = self::getTaxSettings();
            $taxValue = $taxValue ?? $taxSettings['tax_value'];
            $taxType = $taxType ?? $taxSettings['tax_type'];
        }

        // Calculate tax based on type
        if ($taxType === 'percent') {
            // Percentage tax calculation
            $taxAmount = round($basePrice * ($taxValue / 100), 2);
        } elseif ($taxType === 'fixed') {
            // Fixed tax amount
            $taxAmount = (float) $taxValue;
        } else {
            // Fallback for invalid tax type
            $taxAmount = 0;
        }

        // Return final price (base price + tax)
        return round($basePrice + $taxAmount, 2);
    }

    /**
     * Clear tax settings cache (call this when admin updates tax)
     */
    public static function clearCache(): void
    {
        Cache::forget('tax_settings');
    }
}
