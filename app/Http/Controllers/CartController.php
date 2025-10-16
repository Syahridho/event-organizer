<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Event;
use App\Models\Ticket;
use App\Models\Service;
use App\Models\Building;
use App\Models\RentProperties;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CartController extends Controller
{
    public function index()
    {
        $userId = auth()->id();

        $carts = Cart::with([
            'item' => function ($morphTo) {
                $morphTo->morphWith([
                    Ticket::class => ['event'],
                    Building::class => [],
                    Service::class => [],
                    RentProperties::class => [],
                ]);
            }
        ])
        ->where('user_id', $userId)
        ->get();

        // Check booked dates for service, building, and property items
        // Get all settled transaction items with rent_days
        $bookedDates = \DB::table('transaction_items')
            ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
            ->where('transactions.status', 'settlement')
            ->whereIn('transaction_items.type', ['service', 'building', 'rent_property'])
            ->whereNotNull('transaction_items.rent_days')
            ->select(
                'transaction_items.item_id',
                'transaction_items.item_type',
                'transaction_items.rent_days',
                'transactions.user_id'
            )
            ->get()
            ->groupBy(function ($item) {
                // Create unique key: item_id + item_type + rent_days
                return $item->item_id . '_' . $item->item_type . '_' . $item->rent_days;
            });

        // Mark cart items as booked if they match settled bookings
        $carts = $carts->map(function ($cart) use ($bookedDates, $userId) {
            // Only check for service, building, property types
            if (in_array($cart->type, ['service', 'building', 'property']) && $cart->rent_days) {
                // Normalize item_type for comparison
                $itemType = $cart->item_type;

                // Create key to match with booked dates
                $key = $cart->item_id . '_' . $itemType . '_' . $cart->rent_days;

                // Check if this combination is already booked
                if (isset($bookedDates[$key])) {
                    $bookingInfo = $bookedDates[$key]->first();

                    // Check if booked by another user (not current user)
                    if ($bookingInfo->user_id != $userId) {
                        $cart->is_booked_by_other = true;
                    }
                }
            }

            return $cart;
        });

        return Inertia::render('Cart/Index', [
            'carts' => $carts,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'item_id' => 'required|integer',
            'item_type' => 'required|string',
            'type' => 'required|string',
            'rent_days' => 'nullable|date|after:today',
            'item_qty' => 'nullable|integer|min:1',
        ]);

        $cart = Cart::where([
            'user_id' => auth()->id(),
            'item_id' => $data['item_id'],
            'item_type' => $data['item_type'],
            'rent_days' => $data['rent_days'] ?? null,
            'type' => $data['type'],
        ])->first();

        if ($cart) {
            if ($data['type'] === 'ticket') {
                $cart->update([
                    'item_qty' => $cart->item_qty + ($data['item_qty'] ?? 1),
                ]);
                
                $message = 'Quantity tiket berhasil ditambahkan';
                $statusCode = 200;
            } else {
                return response()->json([
                    'message' => 'Tanggal ini sudah ada di keranjang.',
                    'error' => 'DUPLICATE_DATE',
                ], 409);
            }
        } else {
            $cart = Cart::create([
                'user_id' => auth()->id(),
                'item_id' => $data['item_id'],
                'item_type' => $data['item_type'],
                'type' => $data['type'],
                'rent_days' => $data['rent_days'] ?? null,
                'item_qty' => $data['item_qty'] ?? 1,
            ]);
            
            $message = 'Item berhasil ditambahkan ke keranjang';
            $statusCode = 201;
        }

        try {
            $cartItems = Cart::where('user_id', auth()->id())
                ->with([
                    'item' => function (\Illuminate\Database\Eloquent\Relations\MorphTo $morphTo) {
                        $morphTo->morphWith([
                            Ticket::class => ['event'],
                            Service::class => [],
                            Building::class => [],
                            RentProperties::class => [],
                        ]);
                    }
                ])
                ->get()
                ->map(function ($cartItem) {
                    $item = $cartItem->item;
                    
                    if (!$item) {
                        return [
                            'cart_id' => $cartItem->id,
                            'id' => $cartItem->item_id,
                            'name' => 'Item Tidak Tersedia',
                            'type' => $cartItem->type,
                            'price' => 0,
                            'quantity' => $cartItem->item_qty,
                            'is_unavailable' => true,
                        ];
                    }

                    $event = null;
                    
                    if ($item instanceof Ticket) {
                        $event = $item->event;
                    }

                    $eventName = $event?->name ?? $item?->name;
                    $eventThumbnail = $event?->thumbnail ?? $item?->thumbnail;

                    return [
                        'cart_id' => $cartItem->id,
                        'id' => $cartItem->item_id,
                        'event_id' => $event?->id ?? null,
                        'name' => $eventName,
                        'ticket_name' => $item?->name,
                        'type' => $cartItem->type,
                        'price' => $item?->price,
                        'quantity' => $cartItem->item_qty,
                        'rent_days' => $cartItem->rent_days,
                        'is_unavailable' => $cartItem->is_unavailable ?? false,
                        'thumbnail' => $eventThumbnail,
                    ];
                });

            return response()->json([
                'message' => $message,
                'cart' => $cart,
                'cartData' => $cartItems,
            ], $statusCode);

        } catch (Exception $e) {
            
            return response()->json([
                'message' => 'Terjadi kesalahan saat memuat data keranjang.',
                'error' => 'CART_LOAD_ERROR',
                'exception' => [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ],
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $cart = Cart::where('id', $id)->where('user_id', auth()->id())->firstOrFail();

        $request->validate(['item_qty' => 'required|integer|min:1']);
        $cart->update(['item_qty' => $request->item_qty]);

        return response()->json($cart);
    }

    public function destroy($id)
    {
        $cart = Cart::where('id', $id)->where('user_id', auth()->id())->firstOrFail();
        $cart->delete();

        return response()->json(null, 204);
    }

    public function clearAfterCheckout(Request $request)
    {
        $cartIds = $request->input('cart_ids', []);

        if (!empty($cartIds)) {
            Cart::whereIn('id', $cartIds)
                ->where('user_id', auth()->id())
                ->delete();
        }

        return response()->json(['success' => true]);
    }
}
