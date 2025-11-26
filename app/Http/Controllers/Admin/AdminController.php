<?php

namespace App\Http\Controllers\Admin;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\AdminSetting;
use App\Models\Event;
use App\Models\Transaction;
use Carbon\Carbon;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class AdminController extends Controller
{
    public function index(Request $request)
    {
        $taxFilter = $request->input('tax_filter', 'month');

        // Cache data for 5 minutes to improve performance
        // Include filter in cache key to ensure correct data is cached per filter
        $cacheKey = 'admin_dashboard_data_' . $taxFilter;
        $cacheTime = now()->addMinutes(5);

        $dashboardData = Cache::remember($cacheKey, $cacheTime, function () use ($taxFilter) {
            // Optimized: Parallel queries using single DB connection
            $now = Carbon::now();
            $currentMonth = $now->month;
            $currentYear = $now->year;
            $sevenDaysAgo = $now->copy()->subDays(6)->startOfDay();

            // Calculate Tax Income based on filter
            $taxQuery = Transaction::where('status', 'settlement');
            // dd($taxQuery);
            
            switch ($taxFilter) {
                case 'year':
                    $taxQuery->whereYear('created_at', $now->year);
                    break;
                case '6_months':
                    $taxQuery->where('created_at', '>=', $now->copy()->subMonths(6));
                    break;
                case '3_months':
                    $taxQuery->where('created_at', '>=', $now->copy()->subMonths(3));
                    break;
                case 'month':
                    $taxQuery->whereMonth('created_at', $now->month)->whereYear('created_at', $now->year);
                    break;
                case 'week':
                    $taxQuery->where('created_at', '>=', $now->copy()->subWeek());
                    break;
                case 'day':
                    $taxQuery->whereDate('created_at', $now->today());
                    break;
            }
            
            $taxIncome = $taxQuery->sum('tax');

            // Query 1: Get all stats in single optimized queries
            $stats = [
                'events' => Event::where('status', 'active')->count(),
                'pendingPayments' => Transaction::where('status', 'pending')->count(),
                'totalTransactions' => Transaction::count(),
                'revenueThisMonth' => Transaction::where('status', 'paid')
                    ->whereYear('created_at', $currentYear)
                    ->whereMonth('created_at', $currentMonth)
                    ->sum('total')
            ];

            // Query 2: Optimized weekly sales data (7 hari terakhir)
            // Generate all 7 days first, then merge with actual data
            $dates = collect();
            for ($i = 6; $i >= 0; $i--) {
                $date = $now->copy()->subDays($i);
                $dates->push([
                    'date' => $date->format('Y-m-d'),
                    'day' => $date->translatedFormat('D'), // Sen, Sel, dst.
                    'sales' => 0
                ]);
            }

            // Get actual sales data with optimized query
            $salesData = Transaction::selectRaw('DATE(created_at) as date, SUM(total) as total')
                ->where('status', 'settlement')
                ->where('created_at', '>=', $sevenDaysAgo)
                ->groupBy('date')
                ->pluck('total', 'date');

            // Merge actual data with all dates
            $chartData = $dates->map(function ($item) use ($salesData) {
                $item['sales'] = $salesData->get($item['date'], 0);
                unset($item['date']); // Remove date field, only keep day
                return $item;
            });

            return [
                'stats' => $stats,
                'chartData' => $chartData,
                'taxIncome' => $taxIncome,
                'currentTaxFilter' => $taxFilter,
            ];
        });

        return Inertia::render('Admin/Dashboard', $dashboardData);
    }

}
