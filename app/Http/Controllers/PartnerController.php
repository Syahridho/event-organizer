<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Mitra;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Notifications\MitraRequestedNotification;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
 

class PartnerController extends Controller
{
    public function create()
    {
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        if (Auth::user()->where('role', 'mitra')->exists()) {
            return redirect()->route('mitra.dashboard')->with('info', 'Anda sudah mengajukan pendaftaran mitra.');
        }

        $mitra = Mitra::where('status', 'pending')->with('user')->get();

        return Inertia::render('User/Mitra/Index', [
            'status' => $mitra,
        ]);
    }

    
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'address' => ['required', 'string', 'max:1000'],
            'description' => ['required', 'string', 'min:10', 'max:2000'],
            'npwp_number' => ['required', 'string', 'max:20', 'unique:mitra,npwp_number'],
            'npwp_file' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:2048'],
            'business_file' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'], 
        ]);

        // Initialize paths to null to ensure they are defined for the catch block
        $npwPath = null;
        $businessPath = null;

        try {
            // 1. Store NPWP File
            $npwPath = $validatedData['npwp_file']->store('mitra/npwp', 'public'); 
            
            // 2. Store Business File (FIXED: Assigning to $businessPath)
            $businessPath = $validatedData['business_file']->store('mitra/business_files', 'public'); // <-- This is the fix!

            $user = auth()->user();

            $mitra = Mitra::create([
                'user_id' => $user->id,
                'address' => $validatedData['address'],
                'description' => $validatedData['description'],
                'npwp_number' => $validatedData['npwp_number'],
                'npwp_file_path' => $npwPath, // Now uses the correct path
                'business_file_path' => $businessPath, // Now uses the correct path
            ]);     
            
            
            $adminUser = User::where('role', 'admin')->first();
            if ($adminUser) {
                $adminUser->notify(new MitraRequestedNotification($mitra, true));
            }
            
            // 2. Kirim notifikasi ke pengguna yang mengajukan
            $user->notify(new MitraRequestedNotification($mitra, false));

            return redirect()->route('welcome')->with('success', 'Pendaftar Mitra berhasil diajukan!...');

        } catch (\Exception $e) {
            // Log the error for debugging (highly recommended in a catch block)
            \Log::error("Mitra registration failed: " . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString() // Tambahkan trace untuk debugging
            ]);
            
            // Clean up uploaded files
            if ($npwPath && Storage::disk('public')->exists($npwPath)) {
                Storage::disk('public')->delete($npwPath);
            }
            if ($businessPath && Storage::disk('public')->exists($businessPath)) {
                Storage::disk('public')->delete($businessPath);
            }
            
            // Tampilkan error message untuk debugging (hapus di production)
            dd($e->getMessage(), $e->getTraceAsString());
            
            return back()
                ->with('error', 'Terjadi kesalahan saat menyimpan data. Silakan coba lagi.')
                ->withInput();
        }
    }
}