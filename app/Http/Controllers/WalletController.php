<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        // Ambil saldo dompet pengguna
        $totalRevenue = $user->wallet->balance ?? 0;

        return Inertia::render('Mitra/Dashboard', [
            'totalRevenue' => $totalRevenue,
        ]);
    }
}