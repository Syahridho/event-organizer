<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Event;
use App\Models\Building;
use App\Models\RentProperties;
use App\Models\Service;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CartController extends Controller
{
    public function index()
    {
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
        ->where('user_id', auth()->id())
        ->get();

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
        // dd($data);

        $cart = Cart::where([
            'user_id' => auth()->id(),
            'item_id' => $data['item_id'],
            'item_type' => $data['item_type'],
            'rent_days' => $data['rent_days'] ?? null,
            'type' => $data['type'],
        ])->first();

        if ($cart) {
            $cart->update([
                'item_qty' => $cart->item_qty + ($data['item_qty'] ?? 1),
            ]);
        } else {
            $cart = Cart::create([
                'user_id' => auth()->id(),
                'item_id' => $data['item_id'],
                'item_type' => $data['item_type'],
                'type' => $data['type'],
                'rent_days' => $data['rent_days'] ?? null,
                'item_qty' => $data['item_qty'] ?? 1,
            ]);
        }

        return response()->json($cart, 201);
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
