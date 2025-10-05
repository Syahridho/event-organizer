<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TicketController extends Controller
{
    public function checkAvailability(Request $request)
    {
        $request->validate([
            'tickets' => 'required|array',
            'tickets.*.id' => 'required|integer|exists:tickets,id',
            'tickets.*.quantity' => 'required|integer|min:1',
        ]);

        $requestedTickets = $request->input('tickets');
        $unavailableTickets = [];
        $ticketsData = [];

        foreach ($requestedTickets as $requestedTicket) {
            // Query real-time dari database
            $ticket = DB::table('tickets')
                ->leftJoin('transaction_items', function($join) {
                    $join->on('tickets.id', '=', 'transaction_items.item_id')
                         ->where('transaction_items.item_type', '=', 'ticket');
                })
                ->leftJoin('transactions', function($join) {
                    $join->on('transaction_items.transaction_id', '=', 'transactions.id')
                         ->whereIn('transactions.status', ['settlement']);
                })
                ->where('tickets.id', $requestedTicket['id'])
                ->select(
                    'tickets.*',
                    DB::raw('COALESCE(SUM(transaction_items.qty), 0) as sold_count')
                )
                ->groupBy(
                    'tickets.id',
                    'tickets.event_id', 
                    'tickets.name', 
                    'tickets.price', 
                    'tickets.quota',
                    'tickets.created_at',
                    'tickets.updated_at'
                )
                ->first();

            if (!$ticket) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tiket tidak ditemukan',
                ], 404);
            }

            $remaining = max(0, $ticket->quota - $ticket->sold_count);
            $isSoldOut = $remaining <= 0;
            
            $ticketsData[] = [
                'id' => $ticket->id,
                'name' => $ticket->name,
                'remaining' => $remaining,
                'is_sold_out' => $isSoldOut,
            ];

            // Cek apakah stok mencukupi
            if ($isSoldOut || $requestedTicket['quantity'] > $remaining) {
                $unavailableTickets[] = [
                    'name' => $ticket->name,
                    'requested' => $requestedTicket['quantity'],
                    'available' => $remaining,
                ];
            }
        }

        if (count($unavailableTickets) > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Beberapa tiket tidak tersedia',
                'unavailable_tickets' => $unavailableTickets,
                'all_tickets' => $ticketsData,
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Semua tiket tersedia',
            'tickets' => $ticketsData,
        ]);
    }
}