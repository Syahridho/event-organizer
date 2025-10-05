<?php

namespace App\Http\Controllers\Admin;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\AdminSetting;
use App\Models\Event;
use App\Models\Transaction;
use Carbon\Carbon;
use App\Http\Controllers\Controller;

class AdminController extends Controller
{
    public function index()
    {
        // Statistik
        $events = Event::where('status', 'active')->count();
        $pendingPayments = Transaction::where('status', 'pending')->count();
        $totalTransactions = Transaction::count();
        $revenueThisMonth = Transaction::where('status', 'paid')
            ->whereMonth('created_at', Carbon::now()->month)
            ->sum('total');

        // Grafik penjualan (7 hari terakhir)
        $chartData = Transaction::selectRaw('DATE(created_at) as date, SUM(total) as total')
            ->where('status', 'paid')
            ->where('created_at', '>=', Carbon::now()->subDays(6))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'day' => Carbon::parse($item->date)->translatedFormat('D'), // Sen, Sel, dst.
                    'sales' => $item->total,
                ];
            });

        // Transaksi terbaru
        $recentTransactions = Transaction::with(['user', 'items.item'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($tx) {
                return [
                    'id' => $tx->id,
                    'user' => $tx->user->name ?? 'Unknown',
                    'event' => $tx->items->first()->item->event->name ?? '-',
                    'amount' => $tx->total,
                    'status' => $tx->status,
                ];
            });

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'events' => $events,
                'pendingPayments' => $pendingPayments,
                'totalTransactions' => $totalTransactions,
                'revenueThisMonth' => $revenueThisMonth,
            ],
            'chartData' => $chartData,
            'recentTransactions' => $recentTransactions,
        ]);
    }

}
