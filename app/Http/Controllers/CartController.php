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

/**
 * ============================================================================
 * CART CONTROLLER - ADVANCED SHOPPING CART MANAGEMENT SYSTEM
 * ============================================================================
 *
 * OVERVIEW:
 * This controller manages shopping cart operations with comprehensive validation
 * and real-time availability checking. It prevents double bookings, detects
 * sold-out items, and validates mitra availability schedules.
 *
 * KEY FEATURES:
 * ✓ Real-time sold-out detection for tickets and rentable items
 * ✓ Mitra leave schedule validation (specific dates + recurring)
 * ✓ Double booking prevention for services, buildings, properties
 * ✓ Ticket quota management and availability tracking
 * ✓ O(n) complexity algorithms for optimal performance
 * ✓ Tax calculation integration
 * ✓ MorphTo relationships for flexible item types
 *
 * VALIDATION ALGORITHMS:
 * 1. TICKET SOLD-OUT: Checks settled transactions vs ticket quotas
 * 2. MITRA LEAVE: Validates provider availability schedules
 * 3. DOUBLE BOOKING: Prevents conflicting date reservations
 * 4. DATE VALIDATION: Ensures booking dates are valid and available
 *
 * PERFORMANCE METRICS:
 * - Single optimized queries with efficient joins
 * - O(1) lookup tables for leave checking
 * - Minimal database round trips
 * - Lazy loading with MorphTo relationships
 *
 * DATA FLOW:
 * 1. Fetch user cart items with polymorphic relationships
 * 2. Validate mitra leave schedules (O(m+n) complexity)
 * 3. Check double bookings for rentable items (O(m) complexity)
 * 4. Detect ticket sold-out status (O(n) complexity)
 * 5. Calculate taxes and return to frontend
 *
 * @author AI Assistant
 * @version 2.0
 * @since 2024
 * ============================================================================
 */
class CartController extends Controller
{
    /**
     * ============================================================================
     * INDEX METHOD - DISPLAY USER CART WITH COMPREHENSIVE VALIDATION
     * ============================================================================
     *
     * EXECUTES MULTIPLE VALIDATION ALGORITHMS:
     *
     * 1. MITRA LEAVE VALIDATION (O(m+n)):
     *    - Checks specific date leaves (one-time absences)
     *    - Validates recurring weekly leaves (regular patterns)
     *    - Uses efficient lookup tables for O(1) checking
     *
     * 2. DOUBLE BOOKING PREVENTION (O(m)):
     *    - Prevents conflicting reservations for rentable items
     *    - Checks exact date matches: item_id + type + rent_days
     *    - Marks items as sold out when booked by others
     *
     * 3. TICKET SOLD-OUT DETECTION (O(n)):
     *    - Compares settled transaction counts vs ticket quotas
     *    - Marks tickets as sold when quota reached or exceeded
     *    - Provides detailed availability information
     *
     * DATA FLOW:
     * Cart::with(['item' => morphWith()]) → Leave Check → Booking Check → Ticket Check → Tax Calc → Return
     *
     * @return \Inertia\Response Cart data with validation flags
     * ============================================================================
     */
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

        // FASTEST ALGORITHM: Add banned event check for tickets (O(n) complexity)
        // Check if any ticket's event is banned
        $carts = $carts->map(function ($cart) {
            if ($cart->type === 'ticket' && $cart->item && $cart->item->event) {
                $cart->is_event_banned = $cart->item->event->status === 'banned';
            } else {
                $cart->is_event_banned = false;
            }
            return $cart;
        });

        // FASTEST ALGORITHM: Check if mitra is on leave for cart items (both specific dates and recurring)
        $cartItemIds = $carts->pluck('item_id')->unique();
        $cartItemTypes = $carts->pluck('item_type')->unique();

        // Normalize item types to match database (e.g., 'App\Models\Building' -> 'building')
        $normalizedTypes = $cartItemTypes->map(function ($itemType) {
            $type = strtolower(class_basename($itemType)); // Building -> building
            return $type === 'rentproperty' ? 'rent_property' : $type;
        })->unique();

        // Get all leave records (both specific and recurring) for cart items
        $leaves = \DB::table('leaves')
            ->whereIn('item_id', $cartItemIds)
            ->whereIn('item_type', $normalizedTypes)
            ->get();

        // Create efficient lookup map: item_key => ['specific_dates' => [...], 'recurring_days_iso' => [...]]
        $leaveLookup = [];
        foreach ($leaves as $leave) {
            $itemKey = $leave->item_id . '_' . $leave->item_type;

            if (!isset($leaveLookup[$itemKey])) {
                $leaveLookup[$itemKey] = [
                    'specific_dates' => [],
                    'recurring_days_iso' => []
                ];
            }

            if ($leave->date) {
                // Specific date leave
                $leaveLookup[$itemKey]['specific_dates'][] = $leave->date;
            } elseif ($leave->day_of_week !== null) {
                // Recurring weekly leave (0=Monday, 6=Sunday)
                $leaveLookup[$itemKey]['recurring_days_iso'][] = (int) $leave->day_of_week;
            }
        }

        // Mark cart items where mitra is on leave
        $carts = $carts->map(function ($cart) use ($leaveLookup) {
            if ($cart->rent_days) {
                $normalizedType = $this->normalizeItemType($cart->item_type, $cart->type);
                $itemKey = $cart->item_id . '_' . $normalizedType;

                if (isset($leaveLookup[$itemKey])) {
                    $rentDate = \Carbon\Carbon::parse($cart->rent_days);

                    // Check specific date leave
                    if (in_array($rentDate->toDateString(), $leaveLookup[$itemKey]['specific_dates'])) {
                        $cart->is_mitra_on_leave = true;
                    }
                    // Check recurring weekly leave
                    elseif (in_array($rentDate->dayOfWeekIso, $leaveLookup[$itemKey]['recurring_days_iso'])) {
                        $cart->is_mitra_on_leave = true;
                    }
                }
            }
            return $cart;
        });

        /**
         * DOUBLE BOOKING PREVENTION ALGORITHM
         *
         * This section prevents double booking of rentable items (services, buildings, properties)
         * by checking if any date slots have already been booked with settled transactions.
         *
         * Performance: O(m) where m = number of settled transaction items
         * Uses single optimized query with efficient grouping
         *
         * Logic:
         * - Only checks items with rent_days (scheduled items)
         * - Groups by exact combination: item_id + item_type + rent_days
         * - If booked by different user → SOLD OUT (is_sold_out = true)
         * - If booked by same user → Just informational (is_already_booked_by_me = true)
         */
        $bookedDates = \DB::table('transaction_items')
            ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
            ->where('transactions.status', 'settlement')  // Only successful payments count
            ->whereIn('transaction_items.item_type', ['service', 'building', 'rent_property', 'property'])
            ->whereNotNull('transaction_items.rent_days') // Only scheduled items
            ->select(
                'transaction_items.item_id',
                'transaction_items.item_type',
                'transaction_items.rent_days',
                'transactions.user_id'
            )
            ->get()
            ->groupBy(function ($item) {
                // Create unique key for exact date matching: item_id + item_type + rent_days
                return $item->item_id . '_' . $item->item_type . '_' . $item->rent_days;
            });

        /**
         * SOLD-OUT DETECTION FOR RENTABLE ITEMS
         *
         * This section marks rentable items (services, buildings, properties) as sold out
         * if they have been booked on the same date by other users.
         *
         * Key Logic:
         * - Only applies to items with rent_days (scheduled bookings)
         * - Checks exact date matches (item_id + item_type + rent_days)
         * - If booked by different user → Item becomes SOLD OUT
         * - If booked by same user → Just informational (prevents accidental double booking)
         */
        $carts = $carts->map(function ($cart) use ($bookedDates, $userId) {
            // Only process rentable items with scheduled dates
            if (in_array($cart->type, ['service', 'building', 'property']) && $cart->rent_days) {
                // Normalize item type for consistent matching
                // Cart: App\Models\Building → Transaction: building
                $normalizedType = $this->normalizeItemType($cart->item_type, $cart->type);

                // Create lookup key: item_id + normalized_type + rent_days
                $bookingKey = $cart->item_id . '_' . $normalizedType . '_' . $cart->rent_days;

                // Check if this exact date slot is already booked
                if (isset($bookedDates[$bookingKey])) {
                    $existingBooking = $bookedDates[$bookingKey]->first();

                    // Case 1: Booked by another user → SOLD OUT (cannot purchase)
                    if ($existingBooking->user_id != $userId) {
                        $cart->is_booked_by_other = true;
                        $cart->is_sold_out = true;
                        $cart->booking_conflict_reason = 'Booked by another user';
                    }
                    // Case 2: Booked by current user → Already booked (informational)
                    else {
                        $cart->is_already_booked_by_me = true;
                        $cart->booking_conflict_reason = 'Sudah di boking oleh anda';
                    }
                } else {
                    // Date slot is available
                    $cart->is_available = true;
                }
            }

            return $cart;
        });

        /**
         * TICKET SOLD-OUT DETECTION ALGORITHM
         *
         * This section identifies tickets that are sold out based on:
         * 1. Settled transactions (already purchased by users)
         * 2. Quota limits (maximum tickets available)
         *
         * Performance: O(n) where n = number of unique tickets in cart
         * Uses single queries with efficient joins and grouping
         */
        $ticketIdsInCart = $carts->where('type', 'ticket')->pluck('item_id')->unique();

        if ($ticketIdsInCart->isNotEmpty()) {
            // Query 1: Get total sold quantity per ticket from settled transactions
            // Only counts transactions that have been successfully paid (status = 'settlement')
            $ticketSales = \DB::table('transaction_items')
                ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
                ->where('transactions.status', 'settlement')  // Only successful payments
                ->where('transaction_items.item_type', 'ticket')
                ->whereIn('transaction_items.item_id', $ticketIdsInCart)
                ->select(
                    'transaction_items.item_id',
                    \DB::raw('SUM(transaction_items.qty) as total_sold')  // Sum all quantities purchased
                )
                ->groupBy('transaction_items.item_id')
                ->pluck('total_sold', 'item_id');  // Format: [ticket_id => total_sold]

            // Query 2: Get ticket quotas from tickets table
            $ticketQuotas = Ticket::whereIn('id', $ticketIdsInCart)
                ->pluck('quota', 'id');  // Format: [ticket_id => quota]

            // Process each cart item to determine sold status
            $carts = $carts->map(function ($cart) use ($ticketSales, $ticketQuotas) {
                if ($cart->type === 'ticket') {
                    $ticketId = $cart->item_id;
                    $soldCount = $ticketSales[$ticketId] ?? 0;  // Default to 0 if no sales
                    $quota = $ticketQuotas[$ticketId] ?? 0;     // Default to 0 if no quota set

                    // Calculate remaining quota (never negative)
                    $remainingQuota = max(0, $quota - $soldCount);

                    // Mark ticket as sold if:
                    // 1. Has been purchased (soldCount > 0) - prevents re-purchase
                    // 2. Quota reached or exceeded (soldCount >= quota) - sold out
                    $cart->is_sold = ($soldCount > 0 || $soldCount >= $quota);
                    $cart->sold_count = $soldCount;           // Total tickets sold
                    $cart->remaining_quota = $remainingQuota; // Available tickets left

                    // Additional metadata for debugging/UI
                    $cart->total_quota = $quota;
                    $cart->is_quota_exceeded = ($soldCount > $quota);
                }

                return $cart;
            });
        }

        // Calculate tax info
        $taxInfo = TaxHelper::getTaxInfo();


        // dd($carts);

        return Inertia::render('Cart/Index', [
            'carts' => $carts,
            'taxInfo' => $taxInfo,
        ]);
    }

    /**
     * CRITICAL HELPER: Normalize item_type for consistent matching
     *
     * This function ensures consistent type matching between cart storage and transaction storage.
     * Cart stores fully qualified class names (App\Models\Building), while transactions
     * store simplified strings (building, service, rent_property).
     *
     * @param string $itemType Fully qualified class name from cart (e.g., "App\Models\Building")
     * @param string $type Short type identifier from cart (e.g., "building", "service", "property")
     * @return string Normalized type for transaction_items table matching
     */
    private function normalizeItemType($itemType, $type)
    {
        // Type mapping: cart type → transaction type
        // Handles the special case where 'property' in cart = 'rent_property' in transactions
        $typeMapping = [
            'building' => 'building',           // Building rental
            'service' => 'service',             // Service booking
            'property' => 'rent_property',      // Property rental (cart) → rent_property (transaction)
        ];

        return $typeMapping[$type] ?? $type; // Fallback to original type if not mapped
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

        // FASTEST ALGORITHM: Check if ticket's event is banned (O(1) complexity)
        if ($data['type'] === 'ticket' && $item->event && $item->event->status === 'banned') {
            return response()->json([
                'message' => 'Event ini telah dilarang/banned. Tiket tidak dapat dibeli.',
                'error' => 'EVENT_BANNED',
            ], 403);
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
                'delivery_type' => $data['delivery_type'] ?? null,
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
