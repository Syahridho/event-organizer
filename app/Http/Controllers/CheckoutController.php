<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Cart;
use App\Models\Transaction;
use App\Helpers\TaxHelper;
use App\Helpers\DateValidationHelper;

class CheckoutController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'cart_ids' => 'required|array',
            'cart_ids.*' => 'integer|exists:carts,id',
            'items' => 'required|array',
            'total' => 'required|numeric|min:0'
        ]);

        // Verify cart ownership dan availability
        $cartIds = $request->cart_ids;
        $userId = Auth::id();

        $carts = Cart::with(['item.event'])
            ->where('user_id', $userId)
            ->whereIn('id', $cartIds)
            ->get();

        if ($carts->count() !== count($cartIds)) {
            return redirect()->back()->withErrors([
                'message' => 'Beberapa item tidak ditemukan atau bukan milik Anda.'
            ]);
        }

        // CRITICAL: Real-time double booking prevention (RACE CONDITION PROTECTION)
        // Check if any rentable items (service/building/property) are already booked by others
        $bookedDates = DB::table('transaction_items')
            ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
            ->where('transactions.status', 'settlement')
            ->whereIn('transaction_items.item_type', ['service', 'building', 'rent_property'])
            ->whereNotNull('transaction_items.rent_days')
            ->select(
                'transaction_items.item_id',
                'transaction_items.item_type',
                'transaction_items.rent_days',
                'transactions.user_id'
            )
            ->get()
            ->groupBy(function ($item) {
                return $item->item_id . '_' . $item->item_type . '_' . $item->rent_days;
            });

        // Validate each cart item for double booking
        foreach ($carts as $cart) {
            if (in_array($cart->type, ['service', 'building', 'property']) && $cart->rent_days) {
                $normalizedType = $this->normalizeItemType($cart->item_type, $cart->type);
                $key = $cart->item_id . '_' . $normalizedType . '_' . $cart->rent_days;

                // If this exact date is already booked by ANYONE (except self), reject checkout
                if (isset($bookedDates[$key])) {
                    $bookingInfo = $bookedDates[$key]->first();

                    // Block if booked by another user
                    if ($bookingInfo->user_id != $userId) {
                        $itemName = $cart->item->name ?? 'Item';
                        $date = date('d F Y', strtotime($cart->rent_days));

                        return redirect()->route('cart.index')->withErrors([
                            'message' => "Maaf, {$itemName} untuk tanggal {$date} sudah dibooking oleh user lain. Silakan pilih tanggal lain atau hapus dari keranjang."
                        ]);
                    }
                }
            }
        }

        // CRITICAL: Date validation - prevent checkout of expired products (FAST ALGORITHM)
        // Prepare cart items for validation
        $cartItemsForValidation = $carts->map(function ($cart) {
            return [
                'item' => $cart->item,
                'type' => $cart->type,
                'rent_days' => $cart->rent_days,
            ];
        })->toArray();

        // Use optimized bulk validation with early return pattern (O(n) complexity)
        $dateValidation = DateValidationHelper::validateCartItems($cartItemsForValidation);

        if (!$dateValidation['valid']) {
            $invalidCount = count($dateValidation['invalid_items']);
            $firstInvalidItem = $dateValidation['invalid_items'][0] ?? null;

            $errorMessage = $invalidCount > 1
                ? "Terdapat {$invalidCount} item yang sudah tidak valid. " . ($firstInvalidItem['reason'] ?? 'Silakan periksa keranjang Anda.')
                : ($firstInvalidItem['reason'] ?? 'Item tidak valid untuk checkout.');

            return redirect()->route('cart.index')->withErrors([
                'message' => $errorMessage
            ]);
        }

        // Prepare checkout data with tax info
        $taxInfo = TaxHelper::getTaxInfo();


        $checkoutData = [
            'cart_ids' => $cartIds,
            'items' => $request->items,
            'total' => $request->total
        ];

        return Inertia::render('Checkout/Index', [
            'checkoutData' => $checkoutData,
            'user' => Auth::user(),
            'taxInfo' => $taxInfo,
        ]);
    }

    private function normalizeItemType($itemType, $type)
    {
        $typeMapping = [
            'building' => 'building',
            'service' => 'service',
            'property' => 'rent_property', 
        ];

        return $typeMapping[$type] ?? $type;
    }

    public function show(Request $request)
    {
        $request->validate([
            'cart_ids' => 'required|array',
            'cart_ids.*' => 'integer|exists:carts,id',
            'items' => 'required|array',
            'total' => 'required|numeric|min:0'
        ]);

        $cartIds = $request->cart_ids;
        $taxInfo = TaxHelper::getTaxInfo();

        $checkoutData = [
            'cart_ids' => $cartIds,
            'items' => $request->items,
            'total' => $request->total
        ];

        return Inertia::render('Checkout/Index', [
            'checkoutData' => $checkoutData,
            'user' => Auth::user(),
            'taxInfo' => $taxInfo,
        ]);
    }

    /**
     * Show checkout review page for a created transaction
     * Accepts route-model-bound Transaction and eager loads relations.
     */
    public function showByTransaction(Request $request, Transaction $transaction)
    {
        $transaction->load([
            'items.item',
            'user',
            'address',
        ]);

        return Inertia::render('Checkout/Show', [
            'transaction' => $transaction,
        ]);
    }
}
