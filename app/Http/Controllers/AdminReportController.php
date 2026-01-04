<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminReportController extends Controller
{
    /**
     * Display a listing of the reports.
     */
    public function index(Request $request)
    {
        $query = Report::with(['user', 'reportable.user'])->latest();

        // Filter by type
        if ($request->has('type') && $request->type !== 'all') {
            $query->where('reportable_type', 'App\\Models\\' . ucfirst($request->type));
        }

        // Filter by reason
        if ($request->has('reason') && $request->reason !== 'all') {
            $query->where('reason', $request->reason);
        }

        // Search by item name
        if ($request->has('search') && $request->search !== '') {
            $search = $request->search;
            $query->whereHasMorph('reportable', ['App\Models\Event', 'App\Models\Service', 'App\Models\Building', 'App\Models\RentProperty'], function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        $reports = $query->paginate(20)->withQueryString();

        return Inertia::render('Admin/ReportDashboard', [
            'reports' => $reports,
            'filters' => $request->only(['type', 'reason', 'search']),
        ]);
    }

    /**
     * Toggle ban status of the reported item.
     */
    public function toggleBan($id)
    {
        $report = Report::findOrFail($id);
        $item = $report->reportable;

        if (!$item) {
            return redirect()->back()->with('error', 'Item not found.');
        }

        // Assuming the item has a 'status' column with possible values 'active', 'banned'
        $newStatus = $item->status === 'banned' ? 'active' : 'banned';
        $item->status = $newStatus;
        $item->save();

        $message = $newStatus === 'banned' ? 'Item has been banned.' : 'Item has been activated.';

        return redirect()->back()->with('success', $message);
    }
}
