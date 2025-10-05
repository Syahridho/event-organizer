<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Withdraw;

class WithdrawalRequestedNotification extends Notification
{
    use Queueable;

    protected $withdrawal;
    protected $forAdmin; // Properti untuk membedakan notifikasi admin atau user

    /**
     * Create a new notification instance.
     *
     * @param Withdraw $withdrawal
     * @param bool $forAdmin
     * @return void
     */
    public function __construct(Withdraw $withdrawal, $forAdmin = true)
    {
        $this->withdrawal = $withdrawal;
        $this->forAdmin = $forAdmin;
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
        // Kondisi untuk mengirim data yang berbeda
        if ($this->forAdmin) {
            return [
                'withdrawal_id' => $this->withdrawal->id,
                'user_name' => $this->withdrawal->user->name,
                'user_id' => $this->withdrawal->user_id,
                'amount' => $this->withdrawal->amount,
                'message' => 'Terdapat permintaan penarikan baru dari ' . $this->withdrawal->user->name . '.',
                'status' => $this->withdrawal->status,
            ];
        }

        return [
            'withdrawal_id' => $this->withdrawal->id,
            'message' => 'Permintaan penarikan Anda sebesar Rp' . number_format($this->withdrawal->amount, 0, ',', '.') . ' telah diajukan.',
            'status' => $this->withdrawal->status,
        ];
    }
}