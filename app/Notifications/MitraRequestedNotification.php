<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Mitra;

class MitraRequestedNotification extends Notification
{
    use Queueable;

    protected $mitra;
    protected $isAdmin;

    /**
     * Create a new notification instance.
     */
    public function __construct(Mitra $mitra, $isAdmin = false)
    {
        $this->mitra = $mitra;
        $this->isAdmin = $isAdmin;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['database']; // Bisa tambahkan 'mail' jika perlu email notification
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        if ($this->isAdmin) {
            // Notifikasi untuk Admin
            return [
                'title' => 'Pengajuan Mitra Baru',
                'message' => 'Ada pengajuan mitra baru dari ' . $this->mitra->user->name,
                'mitra_id' => $this->mitra->id,
                'user_name' => $this->mitra->user->name,
                'npwp_number' => $this->mitra->npwp_number,
                'type' => 'mitra_request',
                'status' => $this->mitra->status ?? 'pending',
            ];
        } else {
            // Notifikasi untuk User yang mengajukan
            return [
                'title' => 'Pengajuan Mitra Berhasil',
                'message' => 'Pengajuan mitra Anda telah berhasil diajukan dan menunggu persetujuan admin.',
                'mitra_id' => $this->mitra->id,
                'npwp_number' => $this->mitra->npwp_number,
                'type' => 'mitra_request',
                'status' => $this->mitra->status ?? 'pending',
            ];
        }
    }

    /**
     * Get the mail representation of the notification (optional).
     */
    public function toMail(object $notifiable): MailMessage
    {
        if ($this->isAdmin) {
            return (new MailMessage)
                ->subject('Pengajuan Mitra Baru')
                ->line('Ada pengajuan mitra baru dari ' . $this->mitra->user->name)
                ->line('NPWP: ' . $this->mitra->npwp_number)
                ->action('Lihat Detail', route('admin.mitra.show', $this->mitra->id))
                ->line('Silakan tinjau pengajuan ini.');
        } else {
            return (new MailMessage)
                ->subject('Pengajuan Mitra Berhasil')
                ->line('Pengajuan mitra Anda telah berhasil diajukan.')
                ->line('NPWP: ' . $this->mitra->npwp_number)
                ->line('Status: Menunggu Persetujuan')
                ->action('Lihat Status', route('mitra.status', $this->mitra->id))
                ->line('Kami akan segera meninjau pengajuan Anda.');
        }
    }
} 