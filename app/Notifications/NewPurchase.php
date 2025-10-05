<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewPurchase extends Notification implements ShouldQueue
{
    use Queueable;

    protected $pembelian;  // Data pembelian yang dikirim ke notifikasi

    public function __construct($pembelian)
    {
        $this->pembelian = $pembelian;
    }

    public function via(object $notifiable): array
    {
        return ['database'];  // Simpan di database (bisa tambah 'mail' jika mau email)
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'pembelian_baru',
            'message' => 'Ada pembelian baru dengan ID ' . $this->pembelian->id,
            'pembelian_id' => $this->pembelian->id,
            'jumlah' => $this->pembelian->jumlah,
            // Tambah data lain sesuai kebutuhan
        ];
    }
}