<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Tightenco\Ziggy\Ziggy;
use App\Models\Chat;
use App\Models\Cart;
use App\Models\Ticket;
use App\Models\Building;
use App\Models\Service;
use App\Models\RentProperties;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): string|null
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $shared = parent::share($request);
        $counts = [
            'unread_notifications' => 0,
            'unread_chats' => 0,
            'cart_items' => 0,
        ];

        if (Auth::check()) {
            $user = Auth::user();

          
            // Menggunakan method unreadNotifications() yang tersedia pada trait Notifiable (di User model)
            $unreadNotificationsCount = $user->unreadNotifications()->count();

          
            $unreadChatsCount = Chat::where('receiver_id', $user->id)
                                    ->whereNull('seen_at')
                                    ->count();
            

            // Asumsi model Cart memiliki kolom item_qty
            // rent_days akan dikembalikan sebagai string mentah (YYYY-MM-DD) tanpa konversi timezone
            $cartItemsCount = Cart::with([
                'item' => function ($morphTo) {
                    $morphTo->morphWith([
                        Ticket::class => ['event'],
                        Building::class => [],
                        Service::class => [],
                        RentProperties::class => [],
                    ]);
                }
            ])
            ->where('user_id', auth()->id())
            ->get();

            $counts = [
                'unread_notifications' => $unreadNotificationsCount,
                'unread_chats' => $unreadChatsCount,
                'cart_items' => $cartItemsCount,
            ];
        }

        return [
            ...$shared,
            'auth' => [
                'user' => $request->user(),
            ],
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'counts' => $counts,
        ];
    }
}