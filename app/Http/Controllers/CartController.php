<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Event;
use App\Models\Ticket;
use App\Models\Service;
use App\Models\Building;
use App\Models\RentProperty;
use App\Helpers\TaxHelper;
use App\Helpers\DateValidationHelper;
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
                    RentProperty::class => [],
                ]);
            }
        ])
        ->where('user_id', $userId)
        ->get();

        // OPTIMIZED: Single query to get all settled bookings with exact match validation
        // This prevents double booking by checking DB in O(n) time
        $bookedDates = \DB::table('transaction_items')
            ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
            ->where('transactions.status', 'settlement')
            ->whereIn('transaction_items.item_type', ['service', 'building', 'rent_property', 'property'])
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

        // SOLD-OUT DETECTION: Mark cart items as booked/sold-out if settled by ANY user
        $carts = $carts->map(function ($cart) use ($bookedDates, $userId) {
            // Only check for service, building, property types (rentable items)
            if (in_array($cart->type, ['service', 'building', 'property']) && $cart->rent_days) {
                // CRITICAL FIX: Normalize item_type from class name to lowercase string
                // Cart stores: App\Models\Building, App\Models\Service, App\Models\RentProperty
                // Transaction stores: building, service, rent_property
                $normalizedType = $this->normalizeItemType($cart->item_type, $cart->type);

                // Create key to match with booked dates
                $key = $cart->item_id . '_' . $normalizedType . '_' . $cart->rent_days;

                // Check if this exact combination (item + date) is already booked
                if (isset($bookedDates[$key])) {
                    $bookingInfo = $bookedDates[$key]->first();

                    // If booked by another user → SOLD OUT (cannot be purchased)
                    if ($bookingInfo->user_id != $userId) {
                        $cart->is_booked_by_other = true;
                        $cart->is_sold_out = true; // Mark as sold out
                    }
                    // If booked by current user → Just mark as already booked (for info)
                    else {
                        $cart->is_already_booked_by_me = true;
                    }
                }
            }

            return $cart;
        });

        // Calculate tax info
        $taxInfo = TaxHelper::getTaxInfo();

        // dd($carts);

        return Inertia::render('Cart/Index', [
            'carts' => $carts,
            'taxInfo' => $taxInfo,
        ]);
    }

    /**
     * CRITICAL: Normalize item_type for consistent matching between cart and transactions
     *
     * @param string $itemType Fully qualified class name (e.g., App\Models\Building)
     * @param string $type Short type name (e.g., building, service, property)
     * @return string Normalized type for transaction_items table
     */
    private function normalizeItemType($itemType, $type)
    {
        // Map cart type to transaction_items item_type
        $typeMapping = [
            'building' => 'building',
            'service' => 'service',
            'property' => 'rent_property', // Important: property in cart = rent_property in transactions
        ];

        return $typeMapping[$type] ?? $type;
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'item_id' => 'required|integer',
            'item_type' => 'required|string',
            'type' => 'required|string',
            'rent_days' => 'nullable|date|after:today',
            'delivery_type' => 'nullable|string|in:pickup,delivery',
            'item_qty' => 'nullable|integer|min:1',
        ]);

        // CRITICAL: Date validation before adding to cart (FAST ALGORITHM)
        // Load the item to validate
        $itemModel = $data['item_type'];
        $item = $itemModel::find($data['item_id']);

        if (!$item) {
            return response()->json([
                'message' => 'Item tidak ditemukan.',
                'error' => 'ITEM_NOT_FOUND',
            ], 404);
        }

        // Validate product dates using optimized helper (O(1) complexity)
        $validation = DateValidationHelper::validateProductPurchase(
            $item,
            $data['type'],
            $data['rent_days'] ?? null
        );

        if (!$validation['valid']) {
            return response()->json([
                'message' => $validation['message'],
                'error' => $validation['code'],
            ], 400);
        }

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
                'delivery_type' => $data['delivery_type'] ?? 'pickup',
                'delivery_address' => $data['delivery_address'] ?? null,
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
                            RentProperty::class => [],
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
                            'is_unavailable' => 'unavailable',
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
                        'is_unavailable' => $cartItem->is_unavailable ?? 'available',
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

    public function updateDeliveryType(Request $request)
    {
        $validated = $request->validate([
            'cart_id' => 'required|integer|exists:carts,id,user_id,'.auth()->id(),
            'delivery_type' => 'required|string|in:pickup,delivery'
        ]);

        $cart = Cart::where('id', $validated['cart_id'])
                    ->where('user_id', auth()->id())
                    ->firstOrFail();

        $cart->update(['delivery_type' => $validated['delivery_type']]);

        return response()->json(['success' => true]);
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
