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
            ->get();


        // $tes = TransactionItem::where('user_id', $user->id)->get();

        // dd($tes);

        

        return Inertia::render('Mitra/Dashboard', [
            'totalRevenue' => $totalRevenue,
            'percentageChange' => round($percentageChange, 2),
            'completedTransactionsCount' => $completedTransactionsCount,
            'transactionChange' => $transactionChange,
            'totalItems' => $totalItems,
            'itemCounts' => $itemCounts,
            'transactionItems' => $transactionItems,
        ]);
    }

    public function withdraw(Request $request)
    {
        // ... (kode withdraw Anda di sini)
    }
}