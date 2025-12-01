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
    public function index()
    {
        // Check if user already has a mitra record
        $existingMitra = null;
        if (Auth::check()) {
            $existingMitra = Mitra::where('user_id', Auth::id())->first();

            // If mitra exists and approved, redirect to dashboard
            if ($existingMitra && $existingMitra->status === 'approved') {
                return redirect()->route('mitra.dashboard')->with('info', 'Anda sudah terdaftar sebagai mitra.');
            }
        }

        return Inertia::render('User/Mitra/Index', [
            'existingMitra' => $existingMitra,
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

    /**
     * Allow rejected mitra to reapply by deleting old rejected record
     */
    public function reapply()
    {
        try {
            $user = auth()->user();
            $existingMitra = Mitra::where('user_id', $user->id)->first();

            // Only allow reapply if status is rejected
            if (!$existingMitra || $existingMitra->status !== 'rejected') {
                return redirect()->route('partner.create')
                    ->with('error', 'Anda tidak memiliki pengajuan yang ditolak.');
            }

            // Delete old files
            if ($existingMitra->npwp_file_path && Storage::disk('public')->exists($existingMitra->npwp_file_path)) {
                Storage::disk('public')->delete($existingMitra->npwp_file_path);
            }
            if ($existingMitra->business_file_path && Storage::disk('public')->exists($existingMitra->business_file_path)) {
                Storage::disk('public')->delete($existingMitra->business_file_path);
            }

            // Delete mitra record
            $existingMitra->delete();

            \Log::info('Mitra reapply - old record deleted', [
                'user_id' => $user->id,
                'old_mitra_id' => $existingMitra->id
            ]);

            return redirect()->route('partner.create')
                ->with('success', 'Data lama telah dihapus. Silakan lengkapi formulir kembali.');

        } catch (\Exception $e) {
            \Log::error('Reapply failed', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return redirect()->route('partner.create')
                ->with('error', 'Terjadi kesalahan. Silakan coba lagi.');
        }
    }
}