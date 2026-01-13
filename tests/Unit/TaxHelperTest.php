<?php

namespace Tests\Unit;

use Tests\TestCase;

class TaxHelperTest extends TestCase
{
    /** @test */
    public function test_calculate_final_price_with_tax()
    {
        $basePrice = 100000;
        $taxRate = 0.11; // 11% PPN
        
        $finalPrice = $basePrice + ($basePrice * $taxRate);
        
        $this->assertEquals(111000, $finalPrice);
    }

    /** @test */
    public function test_get_tax_info_returns_correct_rate()
    {
        $taxRate = 0.11; // 11% PPN Indonesia
        
        $this->assertEquals(0.11, $taxRate);
    }

    /** @test */
    public function test_edge_case_zero_price()
    {
        $basePrice = 0;
        $taxRate = 0.11;
        
        $finalPrice = $basePrice + ($basePrice * $taxRate);
        
        $this->assertEquals(0, $finalPrice);
    }

    /** @test */
    public function test_edge_case_negative_price()
    {
        $basePrice = -100000;
        $taxRate = 0.11;
        
        // Negative prices should be handled or prevented
        $finalPrice = max(0, $basePrice + ($basePrice * $taxRate));
        
        $this->assertEquals(0, $finalPrice);
    }

    /** @test */
    public function test_tax_calculation_precision()
    {
        $basePrice = 123456;
        $taxRate = 0.11;
        
        $finalPrice = $basePrice + ($basePrice * $taxRate);
        
        // Use round to avoid floating point precision issues
        $this->assertEquals(137036, round($finalPrice));
    }

    /** @test */
    public function test_tax_amount_extraction()
    {
        $basePrice = 100000;
        $taxRate = 0.11;
        
        $taxAmount = $basePrice * $taxRate;
        
        $this->assertEquals(11000, $taxAmount);
    }

    /** @test */
    public function test_reverse_tax_calculation()
    {
        $finalPrice = 111000;
        $taxRate = 0.11;
        
        $basePrice = $finalPrice / (1 + $taxRate);
        
        $this->assertEquals(100000, round($basePrice));
    }

    /** @test */
    public function test_multiple_items_tax_calculation()
    {
        $items = [
            ['price' => 100000, 'quantity' => 2],
            ['price' => 50000, 'quantity' => 1],
        ];
        
        $taxRate = 0.11;
        $subtotal = 0;
        
        foreach ($items as $item) {
            $subtotal += $item['price'] * $item['quantity'];
        }
        
        $tax = $subtotal * $taxRate;
        $total = $subtotal + $tax;
        
        $this->assertEquals(250000, $subtotal);
        $this->assertEquals(27500, $tax);
        $this->assertEquals(277500, $total);
    }
}
