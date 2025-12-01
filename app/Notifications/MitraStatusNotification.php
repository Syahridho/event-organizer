<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\Mitra;

class MitraStatusNotification extends Notification
{
    use Queueable;

    protected $mitra;
    protected $status; // 'approved' or 'rejected'
    protected $reason;

    public function __construct(Mitra $mitra, $status, $reason = null)
    {
        $this->mitra = $mitra;
        $this->status = $status;
        $this->reason = $reason;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        if ($this->status === 'approved') {
            return [
                'title' => 'Pengajuan Mitra Disetujui',
                'message' => 'Selamat! Pengajuan mitra Anda telah disetujui.',
                'mitra_id' => $this->mitra->id,
                'type' => 'mitra_approved',
                'status' => 'approved',
                'url' => route('mitra.dashboard'), // Sesuaikan route
            ];
        } else {
            return [
                'title' => 'Pengajuan Mitra Ditolak',
                'message' => 'Maaf, pengajuan mitra Anda ditolak. ' . ($this->reason ?? ''),
                'mitra_id' => $this->mitra->id,
                'type' => 'mitra_rejected',
                'status' => 'rejected',
                'reason' => $this->reason,
                'url' => route('partner.create'), // Route untuk mengajukan kembali
            ];
        }
    }
}