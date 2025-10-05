<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User; // Atau Mitra jika terpisah
use App\Notifications\CustomNotification;

class NotificationController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $notifications = $user->notifications()->latest()->get()->map(function ($notification) {
            return [
                'id' => $notification->id,
                'type' => $notification->data['type'],
                'message' => $notification->data['message'],
                'pembelian_id' => $notification->data['pembelian_id'] ?? null,
                'jumlah' => $notification->data['jumlah'] ?? null,
                'read_at' => $notification->read_at,
                'created_at' => $notification->created_at->toDateTimeString(),
            ];
        });

        return inertia('Notifications/Index', [
            'notifications' => $notifications,
        ]);
    }

    public function markAsRead(Request $request, $id)
    {
        $user = Auth::user();
        $notification = $user->notifications()->findOrFail($id);
        $notification->markAsRead();

        return redirect()->back()->with('message', 'Notification marked as read.');
    }

    public function markAllAsRead(Request $request)
    {
        Auth::user()->unreadNotifications->markAsRead();

        return response()->json(['message' => 'All notifications marked as read']);
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'message' => 'required|string|max:255',
            'type' => 'required|in:pembelian_baru,pembatalan_mitra,withdraw_diterima,withdraw_ditolak,custom',
        ]);

        $user = User::findOrFail($request->user_id);
        $user->notify(new CustomNotification($request->message, $request->type));

        return redirect()->back()->with('message', 'All notifications marked as read.');
    }


    public function showMitra()
    {
        // Dapatkan pengguna yang saat ini login
        $user = Auth::user();
    
        // Pastikan pengguna ada
        if (!$user) {
            // Jika tidak ada pengguna yang login, arahkan ke halaman login
            return redirect()->route('login');
        }
    
        // Ambil semua notifikasi dan urutkan dari yang terbaru
        $notifications = $user->notifications()->latest()->get();
    
        // Peta (map) koleksi untuk menyesuaikan format data
        $formattedNotifications = $notifications->map(function ($notification) {
            return [
                'id' => $notification->id,
                'type' => $notification->type, // Gunakan kolom type untuk tipe notifikasi
                'message' => $notification->data['message'] ?? 'Pesan tidak tersedia.', // Akses data dengan aman
                'pembelian_id' => $notification->data['pembelian_id'] ?? null,
                'jumlah' => $notification->data['jumlah'] ?? null,
                'read_at' => $notification->read_at,
                'created_at' => $notification->created_at->toDateTimeString(),
            ];
        });
    
        // dd($formattedNotifications); // Hapus baris ini setelah pengujian
    
        return inertia('Mitra/Notifications/Index', [
            'notifications' => $formattedNotifications,
        ]);
    }

    public function getUnreadNotifications()
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        
        // Ambil notifikasi yang belum dibaca saja
        $unreadNotifications = $user->unreadNotifications()->latest()->get();

        $formattedNotifications = $unreadNotifications->map(function ($notification) {
            return [
                'id' => $notification->id,
                'type' => $notification->type,
                'message' => $notification->data['message'] ?? 'Pesan tidak tersedia.',
                'created_at' => $notification->created_at->toDateTimeString(),
            ];
        });

        return response()->json([
            'notifications' => $formattedNotifications,
            'count' => $unreadNotifications->count(),
        ]);
    }
}