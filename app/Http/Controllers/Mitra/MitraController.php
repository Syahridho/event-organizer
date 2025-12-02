<?php

namespace App\Http\Controllers\Mitra;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Wallet;
use App\Models\TransactionItem;
use App\Models\Service;
use App\Models\Building;
use App\Models\RentProperty;
use App\Models\Event;
use Illuminate\Support\Facades\DB; // Import Facade DB untuk query
use Carbon\Carbon;

class MitraController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();

        // Pastikan wallet selalu ada untuk user yang login (operasi atomik, satu query)
        $wallet = Wallet::firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0]
        );

        // Ambil data total pendapatan dari model Wallet (dijamin tidak null)
        $totalRevenue = $wallet->balance;
        

        // ---- Data untuk kartu "Transaksi Selesai" ----
        $completedTransactionsCount = TransactionItem::whereHasMorph('item', ['service', 'building', 'rent_property', 'property'], function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->where('status', 'completed')
        ->count();

        // --- Data transaksi selesai dari bulan lalu ---
        $startOfLastMonth = now()->subMonth()->startOfMonth();
        $endOfLastMonth = now()->subMonth()->endOfMonth();

        $lastMonthCompletedCount = TransactionItem::whereHasMorph('item', ['service', 'building', 'rent_property', 'property'], function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->where('status', 'completed')
        ->whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])
        ->count();

        $transactionChange = $completedTransactionsCount - $lastMonthCompletedCount;

        // ---- Data untuk kartu "Total Item Dibuat" ----
        $itemCounts = [];
        $itemCounts['service'] = Service::where('user_id', $user->id)->count();
        $itemCounts['building'] = Building::where('user_id', $user->id)->count();
        $itemCounts['rent_property'] = RentProperty::where('user_id', $user->id)->count();
        $itemCounts['event'] = Event::where('user_id', $user->id)->count();

        $totalItems = array_sum($itemCounts);

        // ---- Logika untuk persentase pendapatan (mengambil dari tabel) ----
        // 1. Ambil pendapatan bulan ini
        $startOfThisMonth = now()->startOfMonth();
        $endOfThisMonth = now()->endOfMonth();

        $thisMonthRevenue = TransactionItem::whereHasMorph('item', ['service', 'building', 'rent_property', 'property'], function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->where('status', 'completed')
        ->whereBetween('updated_at', [$startOfThisMonth, $endOfThisMonth])
        ->sum('price');
        
        // 2. Ambil pendapatan bulan lalu
        $lastMonthRevenue = TransactionItem::whereHasMorph('item', ['service', 'building', 'rent_property', 'property'], function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->where('status', 'completed')
        ->whereBetween('updated_at', [$startOfLastMonth, $endOfLastMonth])
        ->sum('price');

        // 3. Hitung persentase
        $percentageChange = 0;
        if ($lastMonthRevenue > 0) {
            $percentageChange = (($thisMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100;
        } else if ($thisMonthRevenue > 0) {
            // Jika bulan lalu 0 tapi bulan ini ada pendapatan, persentase naik 100% (atau bisa juga tak terhingga)
            $percentageChange = 100;
        }


        // Robust owner filter without relying on morph alias resolution:
        // Match directly on stored item_type values and item_id sets per model
        $serviceIds = Service::where('user_id', $user->id)->pluck('id');
        $buildingIds = Building::where('user_id', $user->id)->pluck('id');
        $rentPropertyIds = RentProperty::where('user_id', $user->id)->pluck('id');

        $transactionItems = TransactionItem::query()
            ->where(function ($q) use ($serviceIds, $buildingIds, $rentPropertyIds) {
                $q->where(function ($qq) use ($serviceIds) {
                    $qq->where('item_type', 'service')->whereIn('item_id', $serviceIds);
                })->orWhere(function ($qq) use ($buildingIds) {
                    $qq->where('item_type', 'building')->whereIn('item_id', $buildingIds);
                })->orWhere(function ($qq) use ($rentPropertyIds) {
                    // Support multiple legacy morph-type storage values
                    $qq->whereIn('item_type', ['rent_property', 'property', 'App\\Models\\RentProperty'])
                       ->whereIn('item_id', $rentPropertyIds);
                });
            })
            ->with(['item', 'transaction'])
            ->latest()
            ->paginate(5)
            ->withQueryString();


        // $tes = TransactionItem::where('user_id', $user->id)->get();

        // dd($tes);

        

        // ---- Data for Chart (Dynamic Filter) ----
        $chartFilter = $request->input('chart_filter', 'week');
        $dates = collect();
        $salesData = collect();

        // Base Query
        $eventIds = Event::where('user_id', $user->id)->pluck('id');
        
        $query = TransactionItem::query()
            ->where(function ($q) use ($serviceIds, $buildingIds, $rentPropertyIds, $eventIds) {
                 // 1. Non-Event items: Must be 'completed'
                 $q->where(function ($sub) use ($serviceIds, $buildingIds, $rentPropertyIds) {
                     $sub->where(function ($qq) use ($serviceIds) {
                        $qq->where('item_type', 'service')->whereIn('item_id', $serviceIds);
                    })->orWhere(function ($qq) use ($buildingIds) {
                        $qq->where('item_type', 'building')->whereIn('item_id', $buildingIds);
                    })->orWhere(function ($qq) use ($rentPropertyIds) {
                        $qq->whereIn('item_type', ['rent_property', 'property', 'App\\Models\\RentProperty'])
                           ->whereIn('item_id', $rentPropertyIds);
                    });
                 })->where('status', 'completed')
                 
                 // 2. Event items: Must be paid (transaction status)
                 ->orWhere(function ($sub) use ($eventIds) {
                     $sub->whereIn('item_type', ['event', 'App\\Models\\Event'])
                         ->whereIn('item_id', $eventIds)
                         ->whereHas('transaction', function($tr) {
                             $tr->whereIn('status', ['settlement', 'capture', 'completed']);
                         });
                 });
            });

        if ($chartFilter === 'year') {
             // Last 12 months
             for ($i = 11; $i >= 0; $i--) {
                $date = now()->subMonths($i);
                $dates->push([
                    'key' => $date->format('Y-m'),
                    'day' => $date->translatedFormat('M Y'),
                    'sales' => 0
                ]);
            }
            $salesData = $query->where('created_at', '>=', now()->subMonths(11)->startOfMonth())
                ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as date, SUM(price * qty + COALESCE(delivery_fee, 0)) as total')
                ->groupBy('date')
                ->pluck('total', 'date');

        } elseif ($chartFilter === '3_months') {
             // Last 3 months (Daily)
             for ($i = 89; $i >= 0; $i--) {
                $date = now()->subDays($i);
                $dates->push([
                    'key' => $date->format('Y-m-d'),
                    'day' => $date->translatedFormat('d M'),
                    'sales' => 0
                ]);
            }
             $salesData = $query->where('created_at', '>=', now()->subDays(89)->startOfDay())
                ->selectRaw('DATE(created_at) as date, SUM(price * qty + COALESCE(delivery_fee, 0)) as total')
                ->groupBy('date')
                ->pluck('total', 'date');

        } elseif ($chartFilter === 'month') {
             // Last 30 days
             for ($i = 29; $i >= 0; $i--) {
                $date = now()->subDays($i);
                $dates->push([
                    'key' => $date->format('Y-m-d'),
                    'day' => $date->translatedFormat('d M'),
                    'sales' => 0
                ]);
            }
             $salesData = $query->where('created_at', '>=', now()->subDays(29)->startOfDay())
                ->selectRaw('DATE(created_at) as date, SUM(price * qty + COALESCE(delivery_fee, 0)) as total')
                ->groupBy('date')
                ->pluck('total', 'date');
        } else {
            // Default: week (7 days)
            for ($i = 6; $i >= 0; $i--) {
                $date = now()->subDays($i);
                $dates->push([
                    'key' => $date->format('Y-m-d'),
                    'day' => $date->translatedFormat('D'),
                    'sales' => 0
                ]);
            }
             $salesData = $query->where('created_at', '>=', now()->subDays(6)->startOfDay())
                ->selectRaw('DATE(created_at) as date, SUM(price * qty + COALESCE(delivery_fee, 0)) as total')
                ->groupBy('date')
                ->pluck('total', 'date');
        }

        // Merge
        $chartData = $dates->map(function ($item) use ($salesData) {
            $item['sales'] = $salesData->get($item['key'], 0);
            unset($item['key']);
            return $item;
        });
        return Inertia::render('Mitra/Dashboard', [
            'totalRevenue' => $totalRevenue,
            'percentageChange' => round($percentageChange, 2),
            'completedTransactionsCount' => $completedTransactionsCount,
            'transactionChange' => $transactionChange,
            'totalItems' => $totalItems,
            'itemCounts' => $itemCounts,
            'transactionItems' => $transactionItems,
            'chartData' => $chartData,
            'currentChartFilter' => $chartFilter,
        ]);
    }

    public function withdraw(Request $request)
    {
        // ... (kode withdraw Anda di sini)
    }
}