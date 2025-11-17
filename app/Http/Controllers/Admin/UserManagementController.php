<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    /**
     * Display a listing of all users.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $role = $request->input('role');
        $status = $request->input('status');
        
        $query = User::query()
            ->select('id', 'name', 'username', 'email', 'role', 'is_banned', 'banned_at', 'banned_reason', 'created_at', 'last_seen_at')
            ->latest();
        
        // Filter by search term
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }
        
        // Filter by role
        if ($role && $role !== 'all') {
            $query->where('role', $role);
        }
        
        // Filter by status
        if ($status) {
            if ($status === 'banned') {
                $query->where('is_banned', true);
            } elseif ($status === 'active') {
                $query->where('is_banned', false);
            }
        }
        
        $users = $query->paginate(10)->withQueryString();
        
        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'role' => $role,
                'status' => $status,
            ],
        ]);
    }
    
    /**
     * Ban a user.
     */
    public function ban($id, Request $request)
    {
        try {
            // Find user by ID instead of UUID
            $user = User::findOrFail($id);
            
            // Prevent banning admin users
            if ($user->role === 'admin') {
                return Redirect::back()->with('error', 'Tidak bisa memblokir user admin.');
            }
            
            $request->validate([
                'reason' => 'required|string|max:255',
            ]);
            
            DB::beginTransaction();
            
            $user->update([
                'is_banned' => true,
                'banned_at' => now(),
                'banned_reason' => $request->input('reason'),
            ]);
            
            DB::commit();
            
            Log::info('User banned', [
                'user_id' => $user->id,
                'username' => $user->username,
                'reason' => $request->input('reason'),
                'banned_by' => auth()->id(),
            ]);
            
            return Redirect::route('admin.users.index')->with('success', "User {$user->name} berhasil diblokir.");
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error banning user', [
                'user_id' => $id,
                'error' => $e->getMessage(),
            ]);
            
            return Redirect::back()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }
    
    /**
     * Unban a user.
     */
    public function unban($id)
    {
        try {
            // Find user by ID instead of UUID
            $user = User::findOrFail($id);
            
            // Prevent unbanning admin users
            if ($user->role === 'admin') {
                return Redirect::back()->with('error', 'Tidak bisa mengubah status user admin.');
            }
            
            DB::beginTransaction();
            
            $user->update([
                'is_banned' => false,
                'banned_at' => null,
                'banned_reason' => null,
            ]);
            
            DB::commit();
            
            Log::info('User unbanned', [
                'user_id' => $user->id,
                'username' => $user->username,
                'unbanned_by' => auth()->id(),
            ]);
            
            return Redirect::route('admin.users.index')->with('success', "User {$user->name} berhasil dibuka blokirnya.");
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error unbanning user', [
                'user_id' => $id,
                'error' => $e->getMessage(),
            ]);
            
            return Redirect::back()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }
}