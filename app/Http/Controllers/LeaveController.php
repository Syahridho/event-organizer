<?php

namespace App\Http\Controllers;

use App\Models\Leave;
use App\Models\Service;
use App\Models\Building;
use App\Models\RentProperty;
use App\Models\Transaction;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;

class LeaveController extends Controller
{
    public function index()
    {
        $userId = auth()->id();
        
        // Get all items with pagination
        $services = Service::where('user_id', $userId)->latest()->get();
        $buildings = Building::where('user_id', $userId)->latest()->get() ?? [];
        $property = RentProperty::where('user_id', $userId)->latest()->get() ?? [];

        // Get leaves with optimized query
        $leaves = Leave::where('user_id', $userId)
            ->select(['id', 'item_id', 'item_type', 'date', 'day_of_week', 'created_at'])
            ->orderBy('date', 'desc')
            ->orderBy('day_of_week')
            ->get();


        return Inertia::render('Mitra/Leave/Index', [
            'title' => 'Manajemen Cuti',
            'services' => $services,
            'buildings' => $buildings,
            'propertys' => $property,
            'leaves' => $leaves,
            'pagination' => [
                'total' => $services->count() + count($buildings) + count($property),
                'per_page' => 10
            ]
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'item_id' => 'required|integer',
            'item_type' => 'required|string|in:service,building,rent_property',
            'date' => 'nullable|date|after_or_equal:today',
            'day_of_week' => 'nullable|string|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu'
        ], [
            'item_id.required' => 'Item ID harus diisi',
            'item_type.required' => 'Tipe item harus diisi',
            'item_type.in' => 'Tipe item tidak valid',
            'date.after_or_equal' => 'Tanggal cuti tidak boleh di masa lalu',
            'day_of_week.in' => 'Hari tidak valid'
        ]);

        // Validasi tidak boleh duplikat
        if ($request->date) {
            $existing = Leave::where('user_id', auth()->id())
                ->where('item_id', $request->item_id)
                ->where('item_type', $request->item_type)
                ->where('date', $request->date)
                ->exists();
            
            if ($existing) {
                throw ValidationException::withMessages([
                    'date' => 'Tanggal ini sudah ada dalam daftar cuti'
                ]);
            }
        }

        if ($request->day_of_week) {
            $existing = Leave::where('user_id', auth()->id())
                ->where('item_id', $request->item_id)
                ->where('item_type', $request->item_type)
                ->where('day_of_week', $request->day_of_week)
                ->exists();
            
            if ($existing) {
                throw ValidationException::withMessages([
                    'day_of_week' => 'Hari ini sudah ada dalam daftar cuti mingguan'
                ]);
            }
        }

        Leave::create([
            'user_id' => Auth::id(),
            'item_id' => $request->item_id,
            'item_type' => $request->item_type,
            'date' => $request->date,
            'day_of_week' => $request->day_of_week
        ]);

        return redirect()->back()->with('success', 'Cuti berhasil ditambahkan');
    }

    /**
     * Store multiple leave dates at once
     */
    public function storeBulk(Request $request)
    {
        // ✅ Validasi request
        $request->validate([
            'user_id'   => 'required|exists:users,id',
            'item_id'   => 'required|integer',
            'item_type' => 'required|string|in:service,building,rent_property',
            'dates'     => 'required|array|min:1',
            'dates.*'   => 'date|after_or_equal:today',
        ], [
            'user_id.required'   => 'User ID harus diisi',
            'user_id.exists'     => 'User tidak ditemukan',
            'item_id.required'   => 'Item ID harus diisi',
            'item_type.required' => 'Tipe item harus diisi',
            'dates.required'     => 'Pilih minimal satu tanggal',
            'dates.*.after_or_equal' => 'Tanggal Cuti tidak boleh di masa lalu',
        ]);

        // ✅ Ambil data dari request
        $userId   = $request->user_id;
        $itemId   = $request->item_id;
        $itemType = $request->item_type;
        $dates    = $request->dates;

        // ✅ Cek tanggal yang sudah ada di database
        $existingDates = Leave::where('user_id', $userId)
            ->where('item_id', $itemId)
            ->where('item_type', $itemType)
            ->whereIn('date', $dates)
            ->pluck('date')
            ->toArray();

        // $blockedDates = Transaction::where('user_id', $userId)
        //     ->where('status', 'settlement')
        //     ->whereHas('items', function ($query) use ($itemId, $itemType, $dates) {
        //         $query->where('item_id', $itemId)
        //             ->where('item_type', $itemType)
        //             ->whereIn('rent_days', $dates);
        //     })
        //     ->pluck('rent_days')
        //     ->toArray();

        // if (!empty($blockedDates)) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'Ada transaksi aktif di tanggal: ' . implode(', ', $blockedDates)
        //     ], 422);
        // }


        $newDates = array_diff($dates, $existingDates);

        if (empty($newDates)) {
            return response()->json([
                'success' => false,
                'message' => 'Semua tanggal sudah ada dalam daftar Cuti',
            ], 422);
        }

        // ✅ Siapkan data untuk bulk insert
        $leaveData = collect($newDates)->map(function ($date) use ($userId, $itemId, $itemType) {
            return [
                'user_id'     => $userId,
                'item_id'     => $itemId,
                'item_type'   => $itemType,
                'date'        => $date,
                'day_of_week' => null, // bisa null kalau mau
                'created_at'  => now(),
                'updated_at'  => now(),
            ];
        });

        // ✅ Insert dalam chunk (aman untuk data besar)
        $leaveData->chunk(100)->each(function ($chunk) {
            Leave::insert($chunk->toArray());
        });

        // ✅ Pesan respons
        $message = count($newDates) . ' tanggal Cuti berhasil ditambahkan';
        if (!empty($existingDates)) {
            $message .= '. ' . count($existingDates) . ' tanggal sudah ada sebelumnya';
        }

        return response()->json([
            'success'        => true,
            'message'        => $message,
            'added_count'    => count($newDates),
            'existing_count' => count($existingDates),
            'added_dates'    => array_values($newDates),
            'skipped_dates'  => $existingDates,
        ]);
    }


    public function destroy(Leave $leave)
    {
        // Authorize - pastikan user hanya bisa hapus cuti sendiri
        if ($leave->user_id !== auth()->id()) {
            abort(403, 'Unauthorized action.');
        }

        $leave->delete();
        
        return redirect()->back()->with('success', 'Cuti berhasil dihapus');
    }

    /**
     * Delete multiple leaves at once
     */
    public function destroyBulk(Request $request)
    {
        $request->validate([
            'user_id'   => 'required|exists:users,id',
            'item_id' => 'required|integer',
            'item_type' => 'required|string|in:service,building,rent_property',
            'dates' => 'required|array|min:1',
            'dates.*' => 'date'
        ]);

        $userId = $request->user_id;
        $itemId = $request->item_id;
        $itemType = $request->item_type;
        $dates = $request->dates;


        // Delete leaves for specific dates
        $deletedCount = Leave::where('user_id', $userId)
            ->where('item_id', $itemId)
            ->where('item_type', $itemType)
            ->whereIn('date', $dates)
            ->delete();


        return response()->json([
            'success' => true,
            'message' => "{$deletedCount} Cuti berhasil dihapus.",
            'deleted_count' => $deletedCount
        ]);
    }


    /**
     * Remove multiple leaves (bulk deletion).
     */
    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:leaves,id',
        ]);

        try {
            $deletedCount = Leave::whereIn('id', $request->ids)
                ->where('user_id', auth()->id())
                ->delete();
            return back()->with('success', "{$deletedCount} Cuti berhasil dihapus.");
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal menghapus Cuti: ' . $e->getMessage()]);
        }
    }

    /**
     * Toggle weekly leave (add if not exists, remove if exists).
     */
    public function toggleWeekly(Request $request)
    {
        try {
            $request->validate([
                'item_id' => 'required|integer',
                'item_type' => 'required|string|in:service,building,rent_property',
                'day_of_week' => 'required|string|in:Minggu,Senin,Selasa,Rabu,Kamis,Jumat,Sabtu',
            ]);
    
            $existingLeave = Leave::where('day_of_week', $request->day_of_week)
                         ->where('user_id', auth()->id())
                         ->where('item_id', $request->item_id)
                         ->where('item_type', $request->item_type)
                         ->whereNull('date')
                         ->first();
    
            if ($existingLeave) {
                // Remove weekly leave
                $existingLeave->delete();
    
                return response()->json([
                    'success' => true,
                    'action' => 'removed',
                    'message' => 'Cuti mingguan untuk hari ' . $request->day_of_week . ' berhasil dihapus.',
                ]);
    
            } else {
                // Add weekly leave
                $newLeave = Leave::create([
                    'user_id' => Auth::id(),
                    'item_id' => $request->item_id,
                    'item_type' => $request->item_type,
                    'day_of_week' => $request->day_of_week,
                ]);
    
                return response()->json([
                    'success' => true,
                    'action' => 'added',
                    'leave' => $newLeave,
                    'message' => 'Cuti mingguan untuk hari ' . $request->day_of_week . ' berhasil ditambahkan.',
                ]);
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Error validasi
            return response()->json([
                'success' => false,
                'error' => 'validation',
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Illuminate\Database\QueryException $e) {
            // Error database
            \Log::error('Database error in toggleWeekly: ' . $e->getMessage(), [
                'user_id' => auth()->id(),
                'item_id' => $request->item_id,
                'item_type' => $request->item_type,
                'day_of_week' => $request->day_of_week,
                'sql' => $e->getSql(),
                'bindings' => $e->getBindings(),
            ]);
    
            return response()->json([
                'success' => false,
                'error' => 'database',
                'message' => 'Terjadi kesalahan database: ' . $e->getMessage(),
                'code' => $e->getCode(),
            ], 500);
        } catch (\Exception $e) {
            // Error umum lainnya
            \Log::error('Error in toggleWeekly: ' . $e->getMessage(), [
                'user_id' => auth()->id(),
                'item_id' => $request->item_id,
                'item_type' => $request->item_type,
                'day_of_week' => $request->day_of_week,
                'trace' => $e->getTraceAsString(),
            ]);
    
            return response()->json([
                'success' => false,
                'error' => 'general',
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], 500);
        }
    }

    public function indexService() {
        $userId = Auth::id();
        
        return Inertia::render('Mitra/Leave/Index', [
            'title' => 'Cuti Jasa',
            'services' => Service::where('user_id', $userId)
                ->select(['id', 'name', 'location', 'price', 'status', 'thumbnail', 'created_at'])
                ->latest()
                ->get(),
            'buildings' => Building::where('user_id', $userId)
                ->select(['id', 'name', 'location', 'price', 'status', 'thumbnail', 'created_at'])
                ->latest()
                ->get() ?? [],
            'property' => RentProperty::where('user_id', $userId)
                ->select(['id', 'name', 'location', 'price', 'status', 'thumbnail', 'created_at'])
                ->latest()
                ->get() ?? [],
            'leaves' => Leave::where('user_id', $userId)
                ->select(['id', 'item_id', 'item_type', 'date', 'day_of_week'])
                ->get(),
            'transaction' => Transaction::where('user_id', $userId)
                ->where('status', 'settlement')
                ->whereHas('items', function ($query) {
                    $query->whereDate('rent_days', '>=', now()->toDateString())
                        ->whereDate('rent_days', '<', now()->addDay()->toDateString());
                })
                ->with(['items' => function ($query) {
                    $query->whereDate('rent_days', '>=', now()->toDateString())
                        ->whereDate('rent_days', '<', now()->addDay()->toDateString());
                }])
                ->get()
        ]);        
    }

    /**
     * Get leave statistics with polymorphic support
     */
    public function getStats(Request $request)
    {
        $userId = auth()->id();
        $itemId = $request->item_id;
        $itemType = $request->item_type;
        
        $query = Leave::where('user_id', $userId);
        
        if ($itemId && $itemType) {
            $query->where('item_id', $itemId)->where('item_type', $itemType);
        }
        
        $weeklyLeaves = $query->clone()->whereNotNull('day_of_week')->count();
        $dateLeaves = $query->clone()
            ->whereNotNull('date')
            ->where('date', '>=', now()->format('Y-m-d'))
            ->count();

        return response()->json([
            'weekly_leaves' => $weeklyLeaves,
            'upcoming_date_leaves' => $dateLeaves,
            'total_leaves' => $weeklyLeaves + $dateLeaves
        ]);
    }

    /**
     * Added new method to check transactions on specific date
     */
    public function checkTransactionsOnDate(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'item_id' => 'required|integer',
            'item_type' => 'required|string|in:service,building,rent_property'
        ]);


        $userId = auth()->id();
        $date = $request->date;
        $itemId = $request->item_id;
        $itemType = $request->item_type;

        // Check if there are any transactions on this date for this item
        $hasTransactions = Transaction::where('user_id', $userId)
            ->where('status', 'settlement')
            ->whereHas('items', function ($query) use ($date, $itemId, $itemType) {
                $query->whereDate('rent_days', $date)
                    ->where('item_id', $itemId)
                    ->where('item_type', $itemType);
            })
            ->exists();

        return response()->json([
            'has_transactions' => $hasTransactions,
            'date' => $date,
            'message' => $hasTransactions ? 'Ada transaksi aktif pada tanggal ini' : 'Tidak ada transaksi pada tanggal ini'
        ]);
    }
    /**
     * Show individual item leave management page
     */
    public function show($itemId, Request $request)
    {
        $itemType = $request->query('type');

        // ✅ Validasi item type
        if (!in_array($itemType, ['service', 'building', 'rent_property'])) {
            abort(404, 'Invalid item type');
        }

        $userId = auth()->id();

        // ✅ Ambil item sesuai type
        $item = match ($itemType) {
            'service'         => Service::where('id', $itemId)->where('user_id', $userId)->first(),
            'building'        => Building::where('id', $itemId)->where('user_id', $userId)->first(),
            'rent_property' => RentProperty::where('id', $itemId)->where('user_id', $userId)->first(),
            default           => null,
        };

        if (!$item) {
            return redirect('/')->with('error', 'Unauthorized access or item not found');
        }

        // ✅ Ambil existing leaves
        $existingLeaves = Leave::where('user_id', $userId)
            ->where('item_id', $itemId)
            ->where('item_type', $itemType)
            ->select(['id', 'item_id', 'item_type', 'date', 'day_of_week', 'created_at'])
            ->orderBy('date', 'desc')
            ->orderBy('day_of_week')
            ->get();

        // ✅ Ambil tanggal dari transaksi settlement
        $transactionDates = \DB::table('transaction_items')
            ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
            ->where('transaction_items.item_id', $itemId)
            ->where('transaction_items.item_type', $itemType)
            ->where('transactions.status', 'settlement') // hanya yang sudah lunas/settlement
            ->pluck('transaction_items.rent_days')
            ->toArray();

        return Inertia::render('Mitra/Leave/Show', [
            'title'          => 'Kelola Hari Cuti - ' . $item->name,
            'item'           => $item,
            'itemType'       => $itemType,
            'existingLeaves' => $existingLeaves,
            'bookedDates'    => $transactionDates, // ✅ bisa dipakai disable di frontend
        ]);
    }

    public function checkWeekly(Request $request)
    {
        $request->validate([
            'item_id' => 'required|integer',
            'item_type' => 'required|string|in:service,building,rent_property',
            'day_of_week' => 'required|string'
        ]);

        $userId = auth()->id();
        $dayOfWeek = $request->day_of_week;
        $itemId = $request->item_id;
        $itemType = $request->item_type;

        // Map Indo -> English (sesuai MySQL DAYNAME)
        $dayMap = [
            'Minggu' => 'Sunday',
            'Senin' => 'Monday',
            'Selasa' => 'Tuesday',
            'Rabu' => 'Wednesday',
            'Kamis' => 'Thursday',
            'Jumat' => 'Friday',
            'Sabtu' => 'Saturday',
        ];
        $dayOfWeekEn = $dayMap[$dayOfWeek] ?? $dayOfWeek;

        $hasTransactions = \App\Models\Transaction::where('user_id', $userId)
            ->where('status', 'settlement')
            ->whereHas('items', function ($query) use ($dayOfWeekEn, $itemId, $itemType) {
                $query->where('item_id', $itemId)
                    ->where('item_type', $itemType)
                    ->whereRaw("DAYNAME(rent_days) = ?", [$dayOfWeekEn]);
            })
            ->exists();

        return response()->json([
            'has_transactions' => $hasTransactions,
            'message' => $hasTransactions
                ? "Tidak bisa mengatur Cuti mingguan, ada transaksi aktif di hari $dayOfWeek"
                : "Aman, tidak ada transaksi di hari $dayOfWeek"
        ]);
    }



}