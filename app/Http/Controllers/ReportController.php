<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReportController extends Controller
{
    /**
     * Store a newly created report.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'reportable_id' => 'required|integer',
            'reportable_type' => 'required|in:event,service,building,property',
            'reason' => 'required|string',
            'description' => 'nullable|string',
        ]);

        // Map reportable_type to model class
        $modelMap = [
            'event' => \App\Models\Event::class,
            'service' => \App\Models\Service::class,
            'building' => \App\Models\Building::class,
            'property' => \App\Models\RentProperty::class,
        ];

        $modelClass = $modelMap[$validated['reportable_type']];

        // Ensure the reportable item exists
        if (!$modelClass::find($validated['reportable_id'])) {
            return redirect()->back()->withErrors(['reportable_id' => 'The referenced item does not exist.']);
        }

        // Spam protection: check if user already reported this item
        $existingReport = Report::where('user_id', Auth::id())
            ->where('reportable_id', $validated['reportable_id'])
            ->where('reportable_type', $modelClass)
            ->exists();

        if ($existingReport) {
            return redirect()->back()->withErrors(['reason' => 'Anda sudah pernah melaporkan listing ini sebelumnya.']);
        }

        $report = Report::create([
            'user_id' => Auth::id(),
            'reportable_id' => $validated['reportable_id'],
            'reportable_type' => $modelClass,
            'reason' => $validated['reason'],
            'description' => $validated['description'],
        ]);

        return redirect()->back()->with('success', 'Laporan berhasil dikirim.');
    }
}
