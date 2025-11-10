<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class PaymentStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected string $title;
    protected string $message;
    protected array $data;

    public function __construct(string $title, string $message, array $data = [])
    {
        $this->title = $title;
        $this->message = $message;
        $this->data = $data;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return array_merge([
            'type' => $this->data['type'] ?? 'payment_status',
            'title' => $this->title,
            'message' => $this->message,
            'status' => $this->data['status'] ?? null,
            'order_id' => $this->data['order_id'] ?? null,
            'amount' => $this->data['amount'] ?? null,
            'payment_type' => $this->data['payment_type'] ?? null,
            'va_number' => $this->data['va_number'] ?? null,
            'bank_name' => $this->data['bank_name'] ?? null,
            'role' => $this->data['role'] ?? null, // 'user' | 'mitra' | 'admin'
            'items' => $this->data['items'] ?? [],
        ], $this->data);
    }
}