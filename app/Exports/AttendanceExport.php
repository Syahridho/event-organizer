<?php

namespace App\Exports;

use App\Models\Event;
use App\Models\Transaction;
use App\Models\Ticket;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class AttendanceExport implements FromCollection, WithHeadings, WithMapping
{
    protected $event;

    public function __construct(Event $event)
    {
        $this->event = $event;
    }

    public function collection()
    {
        // Use same logic as show method
        return \App\Models\Transaction::query()
            ->join('users', 'transactions.user_id', '=', 'users.id')
            ->join('transaction_items', 'transactions.id', '=', 'transaction_items.transaction_id')
            ->join('tickets', 'transaction_items.item_id', '=', 'tickets.id')
            ->where('transactions.status', 'settlement')
            ->where('transaction_items.item_type', 'ticket')
            ->where('tickets.event_id', $this->event->id)
            ->select([
                'users.id as user_id',
                'users.name as user_name',
                'users.email as user_email',
                \Illuminate\Support\Facades\DB::raw('SUM(transaction_items.qty) as tickets_purchased'),
                \Illuminate\Support\Facades\DB::raw("GROUP_CONCAT(CONCAT(transaction_items.qty, ' ', tickets.name) SEPARATOR ', ') as ticket_details")
            ])
            ->groupBy('users.id', 'users.name', 'users.email')
            ->orderBy('users.name')
            ->get();
    }

    public function headings(): array
    {
        return [
            'Nama',
            'Email',
            'Tiket Jumlah',
            'Tiket Detail',
        ];
    }

    public function map($attendee): array
    {
        return [
            $attendee['user_name'],
            $attendee['user_email'],
            $attendee['tickets_purchased'],
            $attendee['ticket_details'],
        ];
    }
}
