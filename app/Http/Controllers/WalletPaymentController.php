<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\TransactionAddress;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\Withdraw;
use App\Helpers\TaxHelper;
use App\Services\MidtransTaxService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;

class WalletPaymentController extends Controller
{
    /**
     * Create a transaction using wallet balance
     */
    public function createWalletTransaction(Request $request)
    {
        // Log request data for debugging
        Log::info('Wallet payment request data', [
            'request_data' => $request->all(),
            'user_id' => Auth::id()
        ]);

        $validatedData = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|integer|min:1',
            'items.*.price' => 'required|integer|min:100',
            'items.*.name' => 'required|string|max:255',
            'items.*.type' => 'required|string|in:ticket,service,building,rent_property',
            'items.*.quantity' => 'required|integer|min:1|max:999',
            'items.*.rent_days' => 'nullable|string',
            'items.*.note' => 'nullable|string|max:255',
            'items.*.delivery_type' => 'nullable',
            'amount' => 'required|numeric|min:1000',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'shipping_address' => 'nullable|array',
            'shipping_address.recipient_name' => 'nullable|string|max:255',
            'shipping_address.phone' => 'nullable|string|max:20',
            'shipping_address.address_line' => 'nullable|string|max:500',
            'shipping_address.city' => 'nullable|string|max:255',
            'shipping_address.province' => 'nullable|string|max:255',
            'shipping_address.postal_code' => 'nullable|string|max:10',
            'shipping_address.note' => 'nullable|string|max:500',
        ]);

        DB::beginTransaction();
        try {
            $orderId = 'WALLET-' . now()->format('YmdHis') . '-' . Str::random(6);
            $userId = Auth::id();

            // Validate items and calculate total
            try {
                $validatedItems = $this->validateAndPrepareItems($validatedData['items']);
                $baseItems = MidtransTaxService::extractBaseItems($validatedItems);
                $calculatedSubtotal = collect($baseItems)->sum(function($item) {
                    return $item['price'] * $item['quantity'];
                });
                
                Log::info('Items validation successful', [
                    'validated_items' => $validatedItems,
                    'base_items' => $baseItems,
                    'calculated_subtotal' => $calculatedSubtotal
                ]);
            } catch (\Exception $e) {
                Log::error('Item validation failed', [
                    'error' => $e->getMessage(),
                    'items' => $validatedData['items']
                ]);
                throw $e;
            }

            if (!MidtransTaxService::validateSubtotal($validatedData['amount'], $baseItems)) {
                DB::rollBack();
                $errorMessage = 'Subtotal mismatch. Please refresh and try again.';
                
                if ($request->inertia()) {
                    return back()->withErrors(['error' => $errorMessage]);
                }
                
                return response()->json([
                    'success' => false,
                    'error' => $errorMessage,
                ], 400);
            }

            $taxResult = MidtransTaxService::generateMidtransItems($baseItems);
            $totalWithTax = $taxResult['total_amount'];
            $subtotal = $taxResult['subtotal'];
            $taxAmount = $taxResult['tax_amount'];

            // Check wallet balance and pending withdrawals
            $wallet = Wallet::where('user_id', $userId)->first();
            if (!$wallet) {
                DB::rollBack();
                $errorMessage = 'Wallet not found.';
                
                if ($request->inertia()) {
                    return back()->withErrors(['error' => $errorMessage]);
                }
                
                return response()->json([
                    'success' => false,
                    'error' => $errorMessage,
                ], 400);
            }

            // Check for pending withdrawals
            $pendingWithdrawals = Withdraw::where('user_id', $userId)
                ->where('status', 'pending')
                ->sum('amount');

            $availableBalance = $wallet->balance - $pendingWithdrawals;
            if ($availableBalance < $totalWithTax) {
                DB::rollBack();
                $errorMessage = 'Saldo tidak mencukupi. Saldo tersedia: ' . number_format($availableBalance, 0, ',', '.');
                
                if ($request->inertia()) {
                    return back()->withErrors(['error' => $errorMessage]);
                }
                
                return response()->json([
                    'success' => false,
                    'error' => $errorMessage,
                    'available_balance' => $availableBalance,
                    'required_amount' => $totalWithTax,
                ], 400);
            }

            // Deduct from wallet
            $wallet->decrement('balance', $totalWithTax);

            // Create transaction with status settlement
            $transaction = Transaction::create([
                'user_id' => $userId,
                'order_id' => $orderId,
                'redirect_url' => '', // Empty string for wallet payments
                'status' => 'settlement',
                'token' => $orderId, // Use order_id as token for wallet payments
                'total' => $totalWithTax,
                'subtotal' => $subtotal,
                'tax' => $taxAmount,
                'expired_at' => now()->addMinutes(60)->toDateTimeString(),
                'payment_type' => 'wallet',
            ]);

            // Save transaction items
            foreach ($validatedItems as $validatedItem) {
                TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'item_id'        => $validatedItem['item']->id,
                    'item_type'      => $validatedItem['type'],
                    'type'           => $validatedItem['item']->name ?? ucfirst($validatedItem['type']),
                    'qty'            => $validatedItem['quantity'],
                    'price'          => $validatedItem['price'],
                    'delivery_type'=> $validatedItem['delivery_type'] ?? null,
                    'note'           => $validatedItem['note'] ?? null,
                    'rent_days'      => $validatedItem['rent_days'] ?? null,
                ]);
            }

            // Save address if provided
            if (isset($validatedData['shipping_address']) && !empty($validatedData['shipping_address'])) {
                TransactionAddress::create([
                    'transaction_id' => $transaction->id,
                    'user_id' => $userId,
                    'recipient_name' => $validatedData['shipping_address']['recipient_name'] ?? null,
                    'phone' => $validatedData['shipping_address']['phone'] ?? null,
                    'address_line' => $validatedData['shipping_address']['address_line'] ?? null,
                    'city' => $validatedData['shipping_address']['city'] ?? null,
                    'province' => $validatedData['shipping_address']['province'] ?? null,
                    'postal_code' => $validatedData['shipping_address']['postal_code'] ?? null,
                    'note' => $validatedData['shipping_address']['note'] ?? null,
                ]);
            }

            // Create wallet transaction record
            WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'user_id' => $userId,
                'amount' => $totalWithTax,
                'type' => 'DEBIT',
                'reference_type' => 'transaction',
                'reference_id' => $transaction->id,
                'description' => 'Pembayaran transaksi #' . $orderId,
            ]);

            // Credit event creator wallet if applicable
            $this->creditEventCreatorWallet($transaction);

            DB::commit();

            Log::info('Wallet transaction created successfully', [
                'order_id' => $orderId,
                'user_id' => $userId,
                'amount' => $totalWithTax,
                'wallet_balance_after' => $wallet->fresh()->balance,
            ]);

            $successData = [
                'success' => true,
                'order_id' => $orderId,
                'transaction_id' => $transaction->id,
                'status' => 'settlement',
                'message' => 'Pembayaran berhasil menggunakan saldo.',
            ];
            
            if ($request->inertia()) {
                // For Inertia requests, redirect to the purchase page with flash data
                return redirect()->route('purchase.show', $transaction->id)
                    ->with('success', $successData['message']);
            }
            
            return response()->json($successData);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Gagal membuat transaksi wallet', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            
            $errorMessage = 'Gagal membuat transaksi: ' . $e->getMessage();
            
            if ($request->inertia()) {
                return back()->withErrors(['error' => $errorMessage]);
            }
            
            return response()->json([
                'success' => false,
                'error' => $errorMessage,
                'message' => app()->isProduction() ? 'Internal server error' : $e->getMessage(),
                'debug_info' => app()->isProduction() ? null : [
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]
            ], 500);
        }
    }

    /**
     * Validate and prepare items (reuse from MidtransController)
     */
    private function validateAndPrepareItems(array $items): array
    {
        $validatedItems = [];
        $itemsByType = [];

        foreach ($items as $item) {
            $type = $item['type'];
            $itemsByType[$type][] = $item;
        }

        $itemModels = [
            'ticket' => \App\Models\Ticket::class,
            'service' => \App\Models\Service::class,
            'building' => \App\Models\Building::class,
            'rent_property' => \App\Models\RentProperty::class,
        ];

        foreach ($itemsByType as $type => $typeItems) {
            if (!isset($itemModels[$type])) {
                throw new \Exception("Tipe item tidak valid: {$type}");
            }

            $modelClass = $itemModels[$type];
            $itemIds = array_column($typeItems, 'id');

            $items = $modelClass::whereIn('id', $itemIds)->get()->keyBy('id');

            foreach ($typeItems as $itemData) {
                $item = $items->get($itemData['id']);
                
                if (!$item) {
                    throw new \Exception("Item tidak ditemukan: {$type} ID {$itemData['id']}");
                }

                if ($type === 'ticket' && isset($item->quota)) {
                    if ($item->quota < $itemData['quantity']) {
                        $itemName = $item->name ?? 'Tiket';
                        throw new \Exception("Kuota tidak mencukupi untuk {$itemName}. Tersedia: {$item->quota}, Diminta: {$itemData['quantity']}");
                    }
                }

                $rentDays = null;
                if (isset($itemData['rent_days'])) {
                    $rentDays = substr($itemData['rent_days'], 0, 10);
                    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $rentDays)) {
                        throw new \Exception("Invalid rent_days format: {$itemData['rent_days']}");
                    }
                }

                $deliveryType = null;
                if ($type === 'rent_property' && isset($itemData['delivery_type'])) {
                    if (is_object($itemData['delivery_type']) || is_array($itemData['delivery_type'])) {
                        $deliveryType = isset($itemData['delivery_type']['id']) ? $itemData['delivery_type']['id'] : null;
                    } else {
                        $deliveryType = $itemData['delivery_type'];
                    }
                }
                
                $validatedItems[] = [
                    'type' => $type,
                    'item' => $item,
                    'quantity' => $itemData['quantity'],
                    'delivery_type' => $deliveryType,
                    'note' => $itemData['note'],
                    'price' => $item->price ?? $itemData['price'],
                    'rent_days' => $rentDays,
                ];
            }
        }

        return $validatedItems;
    }

    /**
     * Credit event creator wallet (reuse from MidtransController)
     */
    private function creditEventCreatorWallet(Transaction $transaction)
    {
        $transactionItems = TransactionItem::where('transaction_id', $transaction->id)
            ->where('item_type', 'ticket')
            ->with(['item.event.user'])
            ->get();

        if ($transactionItems->isEmpty()) {
            return;
        }

        $revenueByOwner = [];
        $transactionItemsByOwner = [];

        foreach ($transactionItems as $tItem) {
            $eventCreatorId = $tItem->item?->event?->user_id;
            
            if (!$eventCreatorId) {
                continue;
            }

            $revenue = $tItem->price * $tItem->qty;

            if (!isset($revenueByOwner[$eventCreatorId])) {
                $revenueByOwner[$eventCreatorId] = 0;
                $transactionItemsByOwner[$eventCreatorId] = [];
            }
            
            $revenueByOwner[$eventCreatorId] += $revenue;
            $transactionItemsByOwner[$eventCreatorId][] = $tItem;
        }

        foreach ($revenueByOwner as $ownerId => $totalRevenue) {
            try {
                DB::beginTransaction();

                $wallet = Wallet::firstOrCreate(
                    ['user_id' => $ownerId],
                    ['balance' => 0]
                );

                $wallet->increment('balance', $totalRevenue);

                foreach ($transactionItemsByOwner[$ownerId] as $tItem) {
                    $itemRevenue = $tItem->price * $tItem->qty;
                    
                    WalletTransaction::create([
                        'wallet_id' => $wallet->id,
                        'user_id' => $ownerId,
                        'amount' => $itemRevenue,
                        'type' => 'CREDIT',
                        'reference_type' => 'transaction_item',
                        'reference_id' => $tItem->id,
                        'description' => "Pendapatan dari penjualan tiket: {$tItem->item->name} (Order: {$transaction->order_id})"
                    ]);
                }

                DB::commit();

                Log::info('Wallet event creator berhasil dikreditkan', [
                    'owner_id' => $ownerId,
                    'total_revenue' => $totalRevenue,
                    'order_id' => $transaction->order_id,
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Gagal mengkreditkan wallet event creator', [
                    'owner_id' => $ownerId,
                    'total_revenue' => $totalRevenue,
                    'order_id' => $transaction->order_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Check wallet balance and pending withdrawals
     */
    public function checkBalance(Request $request)
    {
        $userId = Auth::id();
        $wallet = Wallet::where('user_id', $userId)->first();
        if (!$wallet) {
            $errorData = [
                'success' => false,
                'error' => 'Wallet not found.',
            ];
            
            if ($request->inertia()) {
                return back()->withErrors(['error' => $errorData['error']]);
            }
            
            return response()->json($errorData, 404);
        }

        $pendingWithdrawals = Withdraw::where('user_id', $userId)
            ->where('status', 'pending')
            ->sum('amount');

        // Ensure pending withdrawals is numeric
        $pendingWithdrawals = (float) $pendingWithdrawals;
        $walletBalance = (float) $wallet->balance;
        $availableBalance = $walletBalance - $pendingWithdrawals;

        // If pending withdrawals exceed balance, available balance should not be negative
        if ($availableBalance < 0) {
            $availableBalance = 0;
        }

        $balanceData = [
            'success' => true,
            'balance' => $walletBalance,
            'pending_withdrawals' => $pendingWithdrawals,
            'available_balance' => $availableBalance,
        ];
        
        if ($request->inertia()) {
            // For Inertia requests, we need to return the data as props
            return Inertia::render('Wallet/Balance', $balanceData);
        }
        
        return response()->json($balanceData);
    }
}
