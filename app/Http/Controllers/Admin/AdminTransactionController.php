<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminTransactionController extends Controller
{
    public function index()
    {
        $transactions = Transaction::with(['user:id,name', 'items.item'])
            ->select('id', 'user_id', 'total', 'status', 'created_at')
            ->latest()
            ->paginate(10) // Show more items per page for a dedicated list
            ->withQueryString()
            ->through(function ($tx) {
                $firstItem = $tx->items->first();
                $itemName = '-';

                if ($firstItem && $firstItem->item) {
                    $item = $firstItem->item;

                    // Check item type and get appropriate name
                    if ($item instanceof \App\Models\Ticket) {
                        // Load event relationship if it's a ticket
                        $item->load('event:id,name');
                        $itemName = optional($item->event)->name ?? 'Ticket';
                    } elseif ($item instanceof \App\Models\Building) {
                        $itemName = 'Building: ' . $item->name;
                    } elseif ($item instanceof \App\Models\Service) {
                        $itemName = 'Service: ' . $item->name;
                    } else {
                        // Fallback for any other model type
                        $itemName = class_basename(get_class($item)) . ' #' . $item->id;
                    }
                }

                return [
                    'id' => $tx->id,
                    'user' => $tx->user->name ?? 'Unknown',
                    'event' => $itemName,
                    'amount' => $tx->total,
                    'status' => $tx->status,
                    'created_at' => $tx->created_at,
                ];
            });

        return Inertia::render('Admin/Transactions/Index', [
            'transactions' => $transactions
        ]);
    }
}
