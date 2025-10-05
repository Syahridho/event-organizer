<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class TransactionSettled extends Notification implements ShouldQueue
{
    use Queueable;

    protected $transaction;

    public function __construct($transaction)
    {
        $this->transaction = $transaction;
    }

    public function via(object $notifiable): array
    {
        return ['database']; // Simpan di database (bisa tambah 'mail' untuk email)
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'transaction_settled',
            'message' => 'Transaksi dengan ID ' . $this->transaction->order_id . ' telah berhasil dibayar.',
            'order_id' => $this->transaction->order_id,
            'amount' => $this->transaction->total,
            'created_at' => $this->transaction->created_at->toDateTimeString(),
        ];
    }
}