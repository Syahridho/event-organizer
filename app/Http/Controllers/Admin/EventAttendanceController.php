<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Transaction;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\AttendanceExport;

class EventAttendanceController extends Controller
{
    public function show(Event $event)
    {
        // Otorisasi
        if (auth()->user()->role !== 'admin' && $event->user_id !== auth()->id()) {
            abort(403, 'Unauthorized access to event attendance.');
        }

        // Kueri utama untuk mengambil data pengunjung
        $attendees = Transaction::query()
            // Gabung ke users untuk nama/email
            ->join('users', 'transactions.user_id', '=', 'users.id')
            // Gabung ke transaction_items untuk detail barang
            ->join('transaction_items', 'transactions.id', '=', 'transaction_items.transaction_id')
            
            // *** BARU: Gabung ke tickets untuk mendapatkan NAMA TIKET ***
            ->join('tickets', 'transaction_items.item_id', '=', 'tickets.id')

            // Filter transaksi yang lunas
            ->where('transactions.status', 'settlement')
            // Filter hanya item 'ticket'
            ->where('transaction_items.item_type', 'ticket')
            
            // *** UBAH: Filter event berdasarkan ID event di tabel tickets ***
            ->where('tickets.event_id', $event->id)

            // Pilih data yang ingin ditampilkan
            ->select([
                'users.id as user_id',
                'users.name as user_name',
                'users.email as user_email',
                // Total tiket (jumlah dari semua 'qty')
                DB::raw('SUM(transaction_items.qty) as tickets_purchased'),
                
                // *** BARU: Field untuk detail tiket (contoh: "1 Regular, 1 Free") ***
                DB::raw("GROUP_CONCAT(CONCAT(transaction_items.qty, ' ', tickets.name) SEPARATOR ', ') as ticket_details")
            ])
            // Kelompokkan hasil berdasarkan pengguna
            ->groupBy('users.id', 'users.name', 'users.email')
            ->orderBy('users.name')
            ->get();

        return Inertia::render('Admin/Events/Attendance', [
            'event' => $event,
            'attendees' => $attendees,
        ]);
    }
    public function exportPdf(Event $event)
    {
        // Get attendees data (same logic as show method)
        $attendees = Transaction::query()
            // Gabung ke users untuk nama/email
            ->join('users', 'transactions.user_id', '=', 'users.id')
            // Gabung ke transaction_items untuk detail barang
            ->join('transaction_items', 'transactions.id', '=', 'transaction_items.transaction_id')

            // *** BARU: Gabung ke tickets untuk mendapatkan NAMA TIKET ***
            ->join('tickets', 'transaction_items.item_id', '=', 'tickets.id')

            // Filter transaksi yang lunas
            ->where('transactions.status', 'settlement')
            // Filter hanya item 'ticket'
            ->where('transaction_items.item_type', 'ticket')

            // *** UBAH: Filter event berdasarkan ID event di tabel tickets ***
            ->where('tickets.event_id', $event->id)

            // Pilih data yang ingin ditampilkan
            ->select([
                'users.id as user_id',
                'users.name as user_name',
                'users.email as user_email',
                // Total tiket (jumlah dari semua 'qty')
                DB::raw('SUM(transaction_items.qty) as tickets_purchased'),

                // *** BARU: Field untuk detail tiket (contoh: "1 Regular, 1 Free") ***
                DB::raw("GROUP_CONCAT(CONCAT(transaction_items.qty, ' ', tickets.name) SEPARATOR ', ') as ticket_details")
            ])
            // Kelompokkan hasil berdasarkan pengguna
            ->groupBy('users.id', 'users.name', 'users.email')
            ->orderBy('users.name')
            ->get();

        $pdf = Pdf::loadView('exports.attendance-pdf', [
            'event' => $event,
            'attendees' => $attendees,
        ]);

        return $pdf->download("peserta-{$event->name}.pdf");
    }

    public function exportExcel(Event $event)
    {
        return Excel::download(new AttendanceExport($event), "perserta-{$event->name}.xlsx");
    }
}