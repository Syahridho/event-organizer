<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Mitra;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use App\Notifications\MitraStatusNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PartnerController extends Controller
{
    public function index()
    {
        $mitra = Mitra::with('user')->get();
        
        return Inertia::render('Admin/Mitra/Index', [
            'mitras' => $mitra,
        ]);
    }

    public function approve(Mitra $mitra)
    {
        try {
            Log::info('Attempting to approve mitra', [
                'mitra_id' => $mitra->id,
                'user_id' => $mitra->user_id,
                'current_status' => $mitra->status,
                'current_user_role' => $mitra->user->role
            ]);

            if ($mitra->status !== 'pending') {
                return Redirect::back()->with('error', 'Status mitra ini sudah bukan pending dan tidak bisa disetujui.');
            }

            DB::beginTransaction();

            // Update status mitra
            $mitra->update(['status' => 'approved']);
            Log::info('Mitra status updated to approved');

            // Update role user menjadi 'mitra'
            $mitra->user->update(['role' => 'mitra']);
            Log::info('User role updated to mitra');

            // KIRIM NOTIFIKASI
            $mitra->user->notify(new MitraStatusNotification($mitra, 'approved'));
            Log::info('Notification sent to user');

            DB::commit();

            // Refresh data
            $mitra->refresh();
            $mitra->user->refresh();
            
            Log::info('Approval completed', [
                'new_status' => $mitra->status,
                'new_role' => $mitra->user->role
            ]);

            return Redirect::route('admin.partners.index')->with('success', "Pengajuan mitra untuk {$mitra->user->name} berhasil disetujui.");

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error approving mitra', [
                'mitra_id' => $mitra->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return Redirect::back()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }
   
    public function reject(Mitra $mitra, Request $request)
    {
        try {
            Log::info('Attempting to reject mitra', [
                'mitra_id' => $mitra->id,
                'current_status' => $mitra->status,
                'user_id' => $mitra->user_id,
            ]);

            if ($mitra->status !== 'pending') {
                Log::warning('Cannot reject mitra - status not pending', [
                    'mitra_id' => $mitra->id,
                    'status' => $mitra->status
                ]);
                return Redirect::back()->with('error', 'Status mitra ini sudah bukan pending dan tidak bisa ditolak.');
            }

            // Validasi alasan penolakan (opsional)
            $reason = $request->input('reason', 'Dokumen tidak memenuhi persyaratan');

            DB::beginTransaction();

            $mitra->update(['status' => 'rejected']);
            Log::info('Mitra status updated to rejected');

            // KIRIM NOTIFIKASI DENGAN ALASAN
            $mitra->user->notify(new MitraStatusNotification($mitra, 'rejected', $reason));
            Log::info('Rejection notification sent to user');

            DB::commit();

            $mitra->refresh();
            Log::info('Rejection completed successfully', [
                'mitra_id' => $mitra->id,
                'new_status' => $mitra->status
            ]);

            return Redirect::route('admin.partners.index')->with('success', "Pengajuan mitra untuk {$mitra->user->name} berhasil ditolak.");

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error rejecting mitra', [
                'mitra_id' => $mitra->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return Redirect::back()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }

    /**
     * View document file inline (supports PDF, PNG, JPG)
     */
    public function viewPdf(Mitra $mitra, $type)
    {
        $filePath = $type === 'npwp' ? $mitra->npwp_file_path : $mitra->business_file_path;
        
        if (!$filePath || !Storage::disk('public')->exists($filePath)) {
            abort(404, 'File not found.');
        }
        
        $fullPath = Storage::disk('public')->path($filePath);
        
        // Detect MIME type automatically
        $mimeType = Storage::disk('public')->mimeType($filePath);
        
        // Fallback to file extension if MIME type detection fails
        if (!$mimeType) {
            $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
            $mimeType = match($extension) {
                'pdf' => 'application/pdf',
                'jpg', 'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                default => 'application/octet-stream',
            };
        }
        
        return response()->file($fullPath, [
            'Content-Type' => $mimeType,
        ]);
    }

    /**
     * Download PDF file
     */
    public function downloadPdf(Mitra $mitra, $type)
    {
        $filePath = $type === 'npwp' ? $mitra->npwp_file_path : $mitra->business_file_path;
        $fileName = $type === 'npwp' ? "NPWP-{$mitra->user->name}.pdf" : "DokumenUsaha-{$mitra->user->name}.pdf";
        
        if (!$filePath || !Storage::disk('public')->exists($filePath)) {
            abort(404, 'File not found.');
        }
        
        return Storage::disk('public')->download($filePath, $fileName);
    }
}