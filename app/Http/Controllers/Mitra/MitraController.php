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
use App\Models\RentProperties;
use App\Models\Event;
use Illuminate\Support\Facades\DB; // Import Facade DB untuk query
use Carbon\Carbon;

class MitraController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();
        
        // Ambil data total pendapatan dari model Wallet
        $totalRevenue = $user->wallet->balance ?? 0;
        

        // ---- Data untuk kartu "Transaksi Selesai" ----
        $completedTransactionsCount = TransactionItem::whereHasMorph('item', [Service::class, Building::class, RentProperties::class], function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->where('status', 'completed')
        ->count();

        // --- Data transaksi selesai dari bulan lalu ---
        $startOfLastMonth = now()->subMonth()->startOfMonth();
        $endOfLastMonth = now()->subMonth()->endOfMonth();

        $lastMonthCompletedCount = TransactionItem::whereHasMorph('item', [Service::class, Building::class, RentProperties::class], function ($query) use ($user) {
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
        $itemCounts['rent_properties'] = RentProperties::where('user_id', $user->id)->count();
        $itemCounts['event'] = Event::where('user_id', $user->id)->count();

        $totalItems = array_sum($itemCounts);

        // ---- Logika untuk persentase pendapatan (mengambil dari tabel) ----
        // 1. Ambil pendapatan bulan ini
        $startOfThisMonth = now()->startOfMonth();
        $endOfThisMonth = now()->endOfMonth();

        $thisMonthRevenue = TransactionItem::whereHasMorph('item', [Service::class, Building::class, RentProperties::class], function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->where('status', 'completed')
        ->whereBetween('updated_at', [$startOfThisMonth, $endOfThisMonth])
        ->sum('price');
        
        // 2. Ambil pendapatan bulan lalu
        $lastMonthRevenue = TransactionItem::whereHasMorph('item', [Service::class, Building::class, RentProperties::class], function ($query) use ($user) {
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


        $transactionItems = TransactionItem::whereHasMorph(
            'item',
            [Service::class, Building::class, RentProperties::class],
            function ($query) use ($user) {
                $query->where('user_id', $user->id);
            }
        )
        ->with([
            'item',
            'transaction'
        ])
        ->latest()
        ->get();

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