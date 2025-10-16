<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Cart;

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
        $carts = Cart::with(['item.event'])
            ->where('user_id', Auth::id())
            ->whereIn('id', $cartIds)
            ->get();

        if ($carts->count() !== count($cartIds)) {
            return redirect()->back()->withErrors([
                'message' => 'Beberapa item tidak ditemukan atau bukan milik Anda.'
            ]);
        }
        // dd($carts);

        // Verify stock availability
        // foreach ($carts as $cart) {
        //     if ($cart->item->stock < $cart->item_qty) {
        //         return redirect()->back()->withErrors([
        //             'message' => "Stock tidak cukup untuk item: {$cart->item->name}"
        //         ]);
        //     }
        // }

        // Prepare checkout data
        $checkoutData = [
            'cart_ids' => $cartIds,
            'items' => $request->items,
            'total' => $request->total
        ];
        // dd($checkoutData);

        return Inertia::render('Checkout/Index', [
            'checkoutData' => $checkoutData,
            'user' => Auth::user()
        ]);
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

        $checkoutData = [
            'cart_ids' => $cartIds,
            'items' => $request->items,
            'total' => $request->total
        ];

        return Inertia::render('Checkout/Index', [
            'checkoutData' => $checkoutData,
            'user' => Auth::user()
        ]);
    }
}
