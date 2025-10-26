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
    public function index()
    {
        // Cache data for 5 minutes to improve performance
        $cacheKey = 'admin_dashboard_data';
        $cacheTime = now()->addMinutes(5);

        $dashboardData = Cache::remember($cacheKey, $cacheTime, function () {
            // Optimized: Parallel queries using single DB connection
            $now = Carbon::now();
            $currentMonth = $now->month;
            $currentYear = $now->year;
            $sevenDaysAgo = $now->copy()->subDays(6)->startOfDay();

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
                ->where('status', 'paid')
                ->where('created_at', '>=', $sevenDaysAgo)
                ->groupBy('date')
                ->pluck('total', 'date');

            // Merge actual data with all dates
            $chartData = $dates->map(function ($item) use ($salesData) {
                $item['sales'] = $salesData->get($item['date'], 0);
                unset($item['date']); // Remove date field, only keep day
                return $item;
            });

            // Query 3: Optimized recent transactions with eager loading
            $recentTransactions = Transaction::with(['user:id,name', 'items.item'])
                ->select('id', 'user_id', 'total', 'status', 'created_at')
                ->latest()
                ->limit(5)
                ->get()
                ->map(function ($tx) {
                    $firstItem = $tx->items->first();
                    $itemName = '-';

                    if ($firstItem && $firstItem->item) {
                        $item = $firstItem->item;

                        // Check item type and get appropriate name
                        if ($item instanceof \App\Models\Ticket) {
                            // Load event relationship if it's a ticket
                            $item->load('event:id,name');
                            $itemName = optional($item->event)->name ?? 'Ticket';
                        } elseif ($item instanceof \App\Models\Building) {
                            $itemName = 'Building: ' . $item->name;
                        } elseif ($item instanceof \App\Models\Service) {
                            $itemName = 'Service: ' . $item->name;
                        } else {
                            // Fallback for any other model type
                            $itemName = class_basename(get_class($item)) . ' #' . $item->id;
                        }
                    }

                    return [
                        'id' => $tx->id,
                        'user' => $tx->user->name ?? 'Unknown',
                        'event' => $itemName,
                        'amount' => $tx->total,
                        'status' => $tx->status,
                    ];
                });

            return [
                'stats' => $stats,
                'chartData' => $chartData,
                'recentTransactions' => $recentTransactions,
            ];
        });

        return Inertia::render('Admin/Dashboard', $dashboardData);
    }

}
