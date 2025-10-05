<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use App\Models\Withdraw;

class WithdrawalStatusNotification extends Notification
{
    use Queueable;

    protected $withdrawal;
    protected $status;

    /**
     * Create a new notification instance.
     *
     * @param  \App\Models\Withdraw  $withdrawal
     * @param  string  $status
     * @return void
     */
    public function __construct(Withdraw $withdrawal, $status)
    {
        $this->withdrawal = $withdrawal;
        $this->status = $status;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        $message = '';
        if ($this->status === 'completed') {
            $message = "Penarikan sebesar Rp" . number_format($this->withdrawal->amount, 0, ',', '.') . " telah berhasil disetujui.";
        } elseif ($this->status === 'rejected') {
            $message = "Penarikan sebesar Rp" . number_format($this->withdrawal->amount, 0, ',', '.') . " telah ditolak.";
        }

        return [
            'message' => $message,
            'withdrawal_id' => $this->withdrawal->id,
            'amount' => $this->withdrawal->amount,
            'status' => $this->status,
        ];
    }
}