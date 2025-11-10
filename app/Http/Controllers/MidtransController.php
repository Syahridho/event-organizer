<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\TransactionAddress;
use App\Models\Ticket;
use App\Models\Service;
use App\Models\Building;
use App\Models\RentProperty;
use App\Helpers\TaxHelper;
use App\Services\MidtransTaxService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Notification;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Midtrans\CoreApi;
use Carbon\Carbon;  

class MidtransController extends Controller
{
    // Mapping model untuk performa yang lebih baik
    private const ITEM_MODELS = [
        'ticket' => Ticket::class,
        'service' => Service::class,
        'building' => Building::class,
        'rent_property' => RentProperty::class,
    ];

    // Metode pembayaran yang diizinkan
    private const ENABLED_PAYMENTS = [
        'credit_card', 'bca_va', 'bni_va', 'bri_va', 'other_va', 
        'gopay', 'shopeepay', 'dana', 'linkaja', 'qris'
    ];

    public function __construct()
    {
        // Konfigurasi Midtrans
        Config::$serverKey = config('midtrans.server_key');
        Config::$isProduction = config('midtrans.is_production', false);
        Config::$isSanitized = config('midtrans.is_sanitized', true);
        Config::$is3ds = config('midtrans.is_3ds', true);
    }

    public function createSnapToken(Request $request)
    {
        $validatedData = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|integer|min:1',
            'items.*.price' => 'required|integer|min:100',
            'items.*.name' => 'required|string|max:255',
            'items.*.type' => 'required|string|in:ticket,service,building,rent_property',
            'items.*.quantity' => 'required|integer|min:1|max:999',
            'items.*.rent_days' => 'nullable|string',
            'items.*.note' => 'nullable|string|max:255',
            'items.*.delivery_type' => 'nullable', // Remove the in:delivery,pickup validation since it's now an object
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


        // Mulai transaksi database
        DB::beginTransaction();
        try {
            $orderId = 'ORD-' . now()->format('YmdHis') . '-' . Str::random(6);
            $userId = Auth::id();

            
            
            // 🔎 Validasi & siapkan item
            $validatedItems = $this->validateAndPrepareItems($validatedData['items']);
            

            // Extract clean base items for tax calculation
            $baseItems = MidtransTaxService::extractBaseItems($validatedItems);

            // VALIDATION: Frontend amount should be subtotal only (base prices)
            $calculatedSubtotal = collect($baseItems)->sum(function($item) {
                return $item['price'] * $item['quantity'];
            });
            
            // Debug logging for subtotal validation
            Log::info('Subtotal validation debug', [
                'frontend_amount' => $validatedData['amount'],
                'backend_calculated_subtotal' => $calculatedSubtotal,
                'base_items' => $baseItems,
                'difference' => $validatedData['amount'] - $calculatedSubtotal,
                'ratio' => $calculatedSubtotal > 0 ? $validatedData['amount'] / $calculatedSubtotal : 'N/A'
            ]);
            
            if (!MidtransTaxService::validateSubtotal($validatedData['amount'], $baseItems)) {
                Log::warning('Subtotal mismatch detected', [
                    'frontend_subtotal' => $validatedData['amount'],
                    'backend_calculated_subtotal' => $calculatedSubtotal,
                ]);
                
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'error' => 'Subtotal mismatch. Please refresh and try again.',
                    'details' => [
                        'expected_subtotal' => $calculatedSubtotal,
                        'received_subtotal' => $validatedData['amount']
                    ]
                ], 400);
            }

            // Use reusable tax service to generate Midtrans items
            $taxResult = MidtransTaxService::generateMidtransItems($baseItems);
            $itemDetails = $taxResult['items'];
            $totalWithTax = $taxResult['total_amount'];
            $subtotal = $taxResult['subtotal'];
            $taxAmount = $taxResult['tax_amount'];

            // 🔑 Param transaksi Midtrans - Handle optional shipping address
            $customerDetails = [
                'first_name' => $validatedData['name'],
                'email' => $validatedData['email'],
            ];

            // Only add phone and shipping_address if shipping_address exists
            if (isset($validatedData['shipping_address']) && !empty($validatedData['shipping_address'])) {
                $customerDetails['phone'] = $validatedData['shipping_address']['phone'] ?? '';
                $customerDetails['shipping_address'] = [
                    'first_name' => $validatedData['shipping_address']['recipient_name'] ?? '',
                    'phone' => $validatedData['shipping_address']['phone'] ?? '',
                    'address' => $validatedData['shipping_address']['address_line'] ?? '',
                    'city' => $validatedData['shipping_address']['city'] ?? '',
                    'postal_code' => $validatedData['shipping_address']['postal_code'] ?? '',
                ];
            }

            $params = [
                'transaction_details' => [
                    'order_id' => $orderId,
                    'gross_amount' => $totalWithTax, // Total includes tax
                ],
                'customer_details' => $customerDetails,
                'item_details' => $itemDetails, // Clean item structure from tax service
                'enabled_payments' => self::ENABLED_PAYMENTS,
                'expiry' => [
                    'start_time' => now('Asia/Jakarta')->format('Y-m-d H:i:s O'),
                    'unit' => 'minutes',
                    'duration' => 60
                ],
                'callbacks' => [
                    'finish' => route('midtrans.finish'),
                    'error' => route('midtrans.error'),
                    'unfinish' => route('midtrans.unfinish')
                ]
            ];

            $snapToken = Snap::getSnapToken($params);
            $midtransRedirectUrl = config('midtrans.is_production')
                ? "https://app.midtrans.com/snap/v2/vtweb/{$snapToken}"
                : "https://app.sandbox.midtrans.com/snap/v2/vtweb/{$snapToken}";

            // 📝 Simpan transaksi
            $transaction = Transaction::create([
                'user_id' => $userId,
                'order_id' => $orderId,
                'redirect_url' => $midtransRedirectUrl,
                'status' => 'pending',
                'token' => $snapToken,
                'total' => $totalWithTax, 
                'subtotal' => $subtotal,
                'tax' => $taxAmount, 
                'expired_at' => now()->addMinutes(60)->toDateTimeString(),
            ]);

            // 📝 Simpan item
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

            // 📝 Simpan alamat - hanya jika ada shipping_address
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

            DB::commit();

            Log::info('Snap token generated successfully', [
                'order_id' => $orderId,
                'user_id' => $userId,
                'subtotal' => $subtotal,
                'tax' => $taxAmount,
                'total' => $totalWithTax,
                'items_count' => count($validatedData['items']),
                'tax_service_used' => true,
            ]);

            return response()->json([
                'success' => true,
                'token' => $snapToken,
                'order_id' => $orderId,
                'redirect_url' => $midtransRedirectUrl
            ]);
        } catch (\Midtrans\Exceptions\ClientException $e) {
            DB::rollBack();
            Log::error('Midtrans Client Exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Payment gateway error: ' . $e->getMessage(),
            ], 400);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Gagal membuat snap token', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'error' => 'Gagal membuat token pembayaran.',
                'message' => app()->isProduction() ? 'Internal server error' : $e->getMessage()
            ], 500);
        }
    }

    private function validateAndPrepareItems(array $items): array
    {
        $validatedItems = [];
        $itemsByType = [];

        foreach ($items as $item) {
            $type = $item['type'];
            $itemsByType[$type][] = $item;
        }

        foreach ($itemsByType as $type => $typeItems) {
            if (!isset(self::ITEM_MODELS[$type])) {
                throw new \Exception("Tipe item tidak valid: {$type}");
            }

            $modelClass = self::ITEM_MODELS[$type];
            $itemIds = array_column($typeItems, 'id');

            $items = $modelClass::whereIn('id', $itemIds)->get()->keyBy('id');

            foreach ($typeItems as $itemData) {
                $item = $items->get($itemData['id']);
                
                if (!$item) {
                    throw new \Exception("Item tidak ditemukan: {$type} ID {$itemData['id']}");
                }

                Log::info('Memproses item', [
                    'type' => $type,
                    'id' => $item->id,
                    'name' => $item->name ?? 'TIDAK ADA NAMA',
                    'semua_field' => $item->getAttributes()
                ]);

                if ($type === 'ticket' && isset($item->quota)) {
                    if ($item->quota < $itemData['quantity']) {
                        $itemName = $item->name ?? 'Tiket';
                        throw new \Exception("Kuota tidak mencukupi untuk {$itemName}. Tersedia: {$item->quota}, Diminta: {$itemData['quantity']}");
                    }
                }

                $rentDays = null;
                if (isset($itemData['rent_days'])) {
                    try {
                        $rentDays = substr($itemData['rent_days'], 0, 10);

                        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $rentDays)) {
                            throw new \Exception("Invalid date format");
                        }

                        Log::info('Rent days parsing', [
                            'original' => $itemData['rent_days'],
                            'saved' => $rentDays,
                        ]);
                    } catch (\Exception $e) {
                        Log::error('Failed to parse rent_days', [
                            'original' => $itemData['rent_days'],
                            'error' => $e->getMessage()
                        ]);
                        throw new \Exception("Invalid rent_days format: {$itemData['rent_days']}");
                    }
                }

                $dbPrice = $item->price ?? 0;
                $frontendPrice = $itemData['price'] ?? 0;
                
                // Debug logging for price comparison
                Log::info('Price comparison for validation', [
                    'item_type' => $type,
                    'item_id' => $item->id,
                    'item_name' => $item->name ?? 'Unknown',
                    'database_price' => $dbPrice,
                    'frontend_price' => $frontendPrice,
                    'price_difference' => $frontendPrice - $dbPrice,
                    'price_ratio' => $dbPrice > 0 ? $frontendPrice / $dbPrice : 'N/A'
                ]);
                
                // FIX: For property items, use frontend price if there's a significant discrepancy
                $finalPrice = $dbPrice;
                if ($type === 'rent_property' && $dbPrice > 0) {
                    $ratio = $frontendPrice / $dbPrice;
                    // If there's a 10x or more difference, use frontend price
                    if ($ratio >= 10 || $ratio <= 0.1) {
                        Log::warning('Using frontend price due to significant discrepancy', [
                            'item_type' => $type,
                            'item_id' => $item->id,
                            'database_price' => $dbPrice,
                            'frontend_price' => $frontendPrice,
                            'ratio' => $ratio
                        ]);
                        $finalPrice = $frontendPrice;
                    }
                }
                
                // Handle delivery_type - it's an object for rent_property, null for others
                $deliveryType = null;
                if ($type === 'rent_property' && isset($itemData['delivery_type'])) {
                    // If delivery_type is an object, extract the 'id' field (which should be 'delivery' or 'pickup')
                    if (is_object($itemData['delivery_type']) || is_array($itemData['delivery_type'])) {
                        $deliveryType = isset($itemData['delivery_type']['id']) ? $itemData['delivery_type']['id'] : null;
                    } else {
                        // If it's a string, use it directly
                        $deliveryType = $itemData['delivery_type'];
                    }
                }
                
                $validatedItems[] = [
                    'type' => $type,
                    'item' => $item,
                    'quantity' => $itemData['quantity'],
                    'delivery_type' => $deliveryType,
                    'note' => $itemData['note'] ?? null,
                    'price' => $finalPrice,
                    'rent_days' => $rentDays,
                ];
            }
        }

        return $validatedItems;
    }
    
    public function callback(Request $request)
    {
        Log::info('Callback Midtrans diterima', [
            'order_id' => $request->order_id,
            'transaction_status' => $request->transaction_status,
            'status_code' => $request->status_code,
            'gross_amount' => $request->gross_amount,
            'payment_type' => $request->payment_type,
            'va_numbers' => $request->va_numbers,
            'bill_key' => $request->bill_key,
            'biller_code' => $request->biller_code,
        ]);
    
        $serverKey = config('midtrans.server_key');
        $hashed = hash("sha512", $request->order_id . $request->status_code . $request->gross_amount . $serverKey);
    
        if ($hashed == $request->signature_key) {
            $vaInfo = $this->extractVAInfo($request); // Asumsi method ini ada dan berfungsi
    
            if (in_array($request->transaction_status, ['capture', 'settlement', 'pending'])) {
                $transaction = Transaction::where('order_id', $request->order_id)->first();
    
                if ($transaction) {
                    // UPDATE DATA TRANSAKSI UTAMA (DEL-ORD atau ORD-)
                    $updateData = [
                        'status' => $request->transaction_status === 'pending' ? 'pending' : 'settlement',
                        'payment_type' => $request->payment_type ?? null,
                        'status_code' => $request->status_code ?? null,
                        'va_number' => $vaInfo['va_number'],
                        'bank_name' => $vaInfo['bank_name'],
                        'bill_key' => $vaInfo['bill_key'],
                        'biller_code' => $vaInfo['biller_code'],
                    ];
                    $transaction->update($updateData);
    
                    Log::info('VA info saved', [
                        'order_id' => $request->order_id,
                        'va_number' => $vaInfo['va_number'],
                        'bank_name' => $vaInfo['bank_name'],
                    ]);
    
    
                    // Notifikasi status pending ke user (informasi pembayaran)
                    if ($request->transaction_status === 'pending') {
                        if ($transaction->user) {
                            $transaction->user->notify(new \App\Notifications\PaymentStatusNotification(
                                'Menunggu pembayaran',
                                'Transaksi Anda menunggu pembayaran. Silakan selesaikan sesuai petunjuk.',
                                [
                                    'type' => 'transaction_pending',
                                    'status' => 'pending',
                                    'order_id' => $transaction->order_id,
                                    'amount' => $transaction->total,
                                    'payment_type' => $transaction->payment_type ?? $request->payment_type,
                                    'va_number' => $vaInfo['va_number'] ?? null,
                                    'bank_name' => $vaInfo['bank_name'] ?? null,
                                    'bill_key' => $vaInfo['bill_key'] ?? null,
                                    'biller_code' => $vaInfo['biller_code'] ?? null,
                                    'role' => 'user'
                                ]
                            ));
                        }
                    }

                    // LOGIKA PENANGANAN TRANSAKSI SETTLEMENT
                    if ($request->transaction_status !== 'pending') {
                        
                        // 1. Cek apakah ini transaksi Biaya Antar (DEL-ORD) yang Settle
                        if (str_starts_with($request->order_id, 'DEL-ORD-')) {
                            
                            $deliveryFeeItem = $transaction->items->first(); 
                            
                            if ($deliveryFeeItem && $deliveryFeeItem->type === 'Delivery Fee') {
                                
                                // Cari Item Transaksi Utama (ORD-) yang terkait
                                $mainItem = TransactionItem::where('item_id', $deliveryFeeItem->item_id)
                                    ->where('item_type', $deliveryFeeItem->item_type)
                                    ->where('type', '!=', 'Delivery Fee') 
                                    ->first();
    
                                if ($mainItem) {
                                    // Update status delivery_fee_status di Item Transaksi Utama
                                    $mainItem->update([
                                        'delivery_fee_status' => 'settlement' 
                                    ]);
                                    
                                    Log::info('Status Biaya Antar berhasil diperbarui', [
                                        'order_id_fee' => $request->order_id,
                                        'main_item_id' => $mainItem->id,
                                    ]);
                                }
                                
                                // Notifikasi pembayaran biaya antar
                                $buyer = $transaction->user;
                                if ($buyer) {
                                    $buyer->notify(new \App\Notifications\PaymentStatusNotification(
                                        'Biaya antar dibayar',
                                        'Biaya antar untuk pesanan Anda telah dibayar.',
                                        [
                                            'type' => 'delivery_fee_settled',
                                            'status' => 'settlement',
                                            'order_id' => $request->order_id,
                                            'amount' => $deliveryFeeItem->price,
                                            'role' => 'user'
                                        ]
                                    ));
                                }

                                $ownerId = ($mainItem->item->user_id ?? ($mainItem->item->event->user_id ?? null)) ?? ($deliveryFeeItem->item->user_id ?? null);
                                if ($ownerId) {
                                    $owner = \App\Models\User::find($ownerId);
                                    if ($owner) {
                                        $itemName = $mainItem->item->name ?? $mainItem->type ?? 'Item';
                                        $owner->notify(new \App\Notifications\PaymentStatusNotification(
                                            'Biaya antar untuk pesanan dibayar',
                                            'Biaya antar untuk item ' . $itemName . ' telah dibayar.',
                                            [
                                                'type' => 'mitra_delivery_fee_paid',
                                                'status' => 'settlement',
                                                'order_id' => $request->order_id,
                                                'amount' => $deliveryFeeItem->price,
                                                'role' => 'mitra'
                                            ]
                                        ));
                                    }
                                }
                                
                                // HENTIKAN PROSES KARENA TRANSAKSI ONGKIR TIDAK MEMBATALKAN YANG LAIN
                                return response()->json(['status' => 'success']);
                            }
                        }
                        
                        // 2. LOGIKA PEMBATALAN TRANSAKSI LAIN (HANYA UNTUK TRANSAKSI UTAMA ORD-)
                        foreach ($transaction->items as $item) {
                            $otherTransactions = Transaction::where('id', '!=', $transaction->id)
                                ->where('status', 'pending')
                                ->whereHas('items', function ($q) use ($item) {
                                    $q->where('item_id', $item->item_id)
                                    ->where('item_type', $item->item_type) 
                                    ->where('rent_days', $item->rent_days);
                                })
                                ->get();

                            foreach ($otherTransactions as $other) {
                                $other->items()
                                ->where('item_id', $item->item_id)
                                ->where('item_type', $item->item_type)
                                ->where('rent_days', $item->rent_days)
                                ->update(['status' => 'sold_out']);
                                
                                $other->update(['status' => 'cancelled']);

                                try {
                                    \Midtrans\Transaction::cancel($other->order_id);
                                } catch (\Exception $e) {
                                    Log::error('Gagal cancel di Midtrans', [
                                        'order_id' => $other->order_id,
                                        'error' => $e->getMessage()
                                    ]);
                                }
                                
                                Log::info('Transaksi lain dibatalkan karena item sold_out', [
                                    'order_id' => $other->order_id,
                                    'conflicting_item_id' => $item->item_id
                                ]);

                                // Kirim notifikasi ke user yang transaksinya dibatalkan karena sold out
                                if ($other->user) {
                                    $other->user->notify(new \App\Notifications\PaymentStatusNotification(
                                        'Transaksi dibatalkan',
                                        'Pesanan Anda dibatalkan karena item telah terjual oleh pembeli lain.',
                                        [
                                            'type' => 'cancelled_due_to_sold_out',
                                            'status' => 'cancelled',
                                            'order_id' => $other->order_id,
                                            'amount' => $other->total,
                                            'role' => 'user'
                                        ]
                                    ));
                                }
                            }
                        }
    
                        $user = $transaction->user;
                        if ($user) {
                            // Notifikasi ke pembeli (user) - transaksi sukses (settlement/capture)
                            $user->notify(new \App\Notifications\PaymentStatusNotification(
                                'Pembayaran berhasil',
                                'Pesanan Anda telah dibayar dan dikonfirmasi.',
                                [
                                    'type' => 'transaction_settled',
                                    'status' => $transaction->status,
                                    'order_id' => $transaction->order_id,
                                    'amount' => $transaction->total,
                                    'payment_type' => $transaction->payment_type,
                                    'va_number' => $transaction->va_number,
                                    'bank_name' => $transaction->bank_name,
                                    'role' => 'user'
                                ]
                            ));

                            // Notifikasi ke Mitra pemilik item yang dibayar
                            foreach ($transaction->items as $tItem) {
                                $ownerId = $tItem->item->user_id ?? ($tItem->item->event->user_id ?? null);
                                if ($ownerId) {
                                    $owner = \App\Models\User::find($ownerId);
                                    if ($owner) {
                                        $itemName = $tItem->item->name ?? $tItem->type;
                                        $owner->notify(new \App\Notifications\PaymentStatusNotification(
                                            'Pesanan telah dibayar',
                                            'Pesanan untuk item ' . $itemName . ' telah dibayar.',
                                            [
                                                'type' => 'mitra_item_paid',
                                                'status' => $transaction->status,
                                                'order_id' => $transaction->order_id,
                                                'amount' => $tItem->price * $tItem->qty,
                                                'payment_type' => $transaction->payment_type,
                                                'role' => 'mitra',
                                                'items' => [[
                                                    'item_type' => $tItem->item_type,
                                                    'item_id' => $tItem->item_id,
                                                    'name' => $itemName,
                                                    'qty' => $tItem->qty,
                                                    'price' => $tItem->price
                                                ]]
                                            ]
                                        ));
                                    }
                                }
                            }

                            Log::info('Notifikasi transaksi settlement terkirim', [
                                'order_id' => $transaction->order_id,
                                'user_id' => $user->id
                            ]);
                        }
                        
                        Log::info('Transaksi berhasil diperbarui', [
                            'order_id' => $request->order_id, 
                            'status' => $transaction->status
                        ]);
                    }
                    
                } else {
                    Log::error('Transaksi tidak ditemukan', ['order_id' => $request->order_id]);
                }
            }

            // Handle cancel/expire/deny statuses
            if (in_array($request->transaction_status, ['cancel', 'expire', 'deny'])) {
                $transaction = Transaction::where('order_id', $request->order_id)->first();
                if ($transaction) {
                    $newStatus = $request->transaction_status === 'expire' ? 'expired' : 'cancelled';
                    $transaction->update([
                        'status' => $newStatus,
                        'status_code' => $request->status_code ?? $transaction->status_code,
                        'payment_type' => $request->payment_type ?? $transaction->payment_type,
                    ]);

                    // Notify buyer
                    if ($transaction->user) {
                        $title = $newStatus === 'expired' ? 'Transaksi kedaluwarsa' : 'Transaksi dibatalkan';
                        $message = $newStatus === 'expired'
                            ? 'Pembayaran Anda kedaluwarsa. Silakan lakukan pemesanan ulang.'
                            : 'Transaksi Anda dibatalkan oleh payment gateway.';
                        $transaction->user->notify(new \App\Notifications\PaymentStatusNotification(
                            $title,
                            $message,
                            [
                                'type' => "transaction_{$newStatus}",
                                'status' => $newStatus,
                                'order_id' => $transaction->order_id,
                                'amount' => $transaction->total,
                                'role' => 'user'
                            ]
                        ));
                    }

                    // Notify mitra for cancellation only (skip expire)
                    if ($newStatus === 'cancelled') {
                        foreach ($transaction->items as $tItem) {
                            $ownerId = $tItem->item->user_id ?? ($tItem->item->event->user_id ?? null);
                            if ($ownerId) {
                                $owner = \App\Models\User::find($ownerId);
                                if ($owner) {
                                    $itemName = $tItem->item->name ?? $tItem->type;
                                    $owner->notify(new \App\Notifications\PaymentStatusNotification(
                                        'Pesanan dibatalkan',
                                        'Pesanan untuk item ' . $itemName . ' dibatalkan oleh payment gateway.',
                                        [
                                            'type' => 'mitra_item_cancelled',
                                            'status' => $newStatus,
                                            'order_id' => $transaction->order_id,
                                            'amount' => $tItem->price * $tItem->qty,
                                            'role' => 'mitra',
                                            'items' => [[
                                                'item_type' => $tItem->item_type,
                                                'item_id' => $tItem->item_id,
                                                'name' => $itemName,
                                                'qty' => $tItem->qty,
                                                'price' => $tItem->price
                                            ]]
                                        ]
                                    ));
                                }
                            }
                        }
                    }

                    $this->clearTransactionCache($transaction->order_id);
                    Log::info('Transaction status updated from callback', [
                        'order_id' => $transaction->order_id,
                        'new_status' => $newStatus
                    ]);
                } else {
                    Log::error('Transaksi tidak ditemukan (cancel/expire/deny)', ['order_id' => $request->order_id]);
                }
            }
        } else {
            Log::error('Signature tidak valid', [
                'order_id' => $request->order_id,
                'signature_diterima' => $request->signature_key,
                'signature_dihitung' => $hashed
            ]);
        }
    
        return response()->json(['status' => 'success']);
    }

    private function extractVAInfo(Request $request): array
    {
        $vaNumber = null;
        $bankName = null;
        $billKey = null;
        $billerCode = null;

        $bankNameMap = [
            'bca' => 'BCA',
            'bni' => 'BNI',
            'bri' => 'BRI',
            'cimb' => 'CIMB Niaga',
            'permata' => 'Permata',
            'other' => 'Bank Lainnya',
        ];

        if ($request->has('va_numbers') && is_array($request->va_numbers) && count($request->va_numbers) > 0) {
            $vaData = $request->va_numbers[0];
            $vaNumber = $vaData['va_number'] ?? null;
            $bankCode = strtolower($vaData['bank'] ?? '');
            $bankName = $bankNameMap[$bankCode] ?? ucfirst($bankCode);
        } elseif ($request->has('bill_key') && $request->has('biller_code')) {
            $billKey = $request->bill_key;
            $billerCode = $request->biller_code;
            $bankName = 'Mandiri';
        } elseif ($request->has('permata_va_number')) {
            $vaNumber = $request->permata_va_number;
            $bankName = 'Permata';
        } elseif ($request->has('payment_type')) {
            $paymentType = $request->payment_type;

            if (str_contains($paymentType, 'bca')) {
                $bankName = 'BCA';
            } elseif (str_contains($paymentType, 'bni')) {
                $bankName = 'BNI';
            } elseif (str_contains($paymentType, 'bri')) {
                $bankName = 'BRI';
            } elseif (str_contains($paymentType, 'mandiri')) {
                $bankName = 'Mandiri';
            } elseif (str_contains($paymentType, 'permata')) {
                $bankName = 'Permata';
            } elseif (str_contains($paymentType, 'cimb')) {
                $bankName = 'CIMB Niaga';
            }
        }

        return [
            'va_number' => $vaNumber,
            'bank_name' => $bankName,
            'bill_key' => $billKey,
            'biller_code' => $billerCode,
        ];
    }

    private function updateItemQuotas(Transaction $transaction)
    {
        $transactionItems = TransactionItem::where('transaction_id', $transaction->id)->get();
        $itemsByType = $transactionItems->groupBy('item_type');

        foreach ($itemsByType as $type => $items) {
            if (!isset(self::ITEM_MODELS[$type])) {
                continue;
            }

            $modelClass = self::ITEM_MODELS[$type];
            
            if ($type === 'ticket') {
                foreach ($items as $item) {
                    $modelClass::where('id', $item->item_id)
                        ->where('quota', '>=', $item->qty)
                        ->decrement('quota', $item->qty);
                }
            }
        }
        
        Log::info('Kuota item diperbarui', [
            'transaction_id' => $transaction->id,
            'order_id' => $transaction->order_id
        ]);
    }

    public function getTransaction($orderId)
    {
        try {
            $cacheKey = "transaction_detail_{$orderId}";
            $transaction = Cache::remember($cacheKey, 300, function () use ($orderId) {
                return Transaction::where('order_id', $orderId)
                    ->with(['items.item', 'user:id,name,email'])
                    ->first();
            });

            if (!$transaction) {
                return response()->json(['error' => 'Transaksi tidak ditemukan'], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $transaction
            ]);

        } catch (\Exception $e) {
            Log::error('Gagal mendapatkan transaksi', [
                'order_id' => $orderId,
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Gagal mendapatkan transaksi'], 500);
        }
    }

    public function cancelTransaction($orderId)
    {
        try {
            DB::beginTransaction();
            
            $transaction = Transaction::where('order_id', $orderId)
                ->where('status', 'pending')
                ->first();

            if (!$transaction) {
                return response()->json([
                    'error' => 'Transaksi tidak ditemukan atau tidak bisa dibatalkan'
                ], 404);
            }

            $midtransResult = $this->cancelTransactionMidtrans($orderId);
            
            if (!$midtransResult['success']) {
                DB::rollback();
                return response()->json([
                    'error' => 'Gagal membatalkan transaksi di payment gateway',
                    'details' => $midtransResult['message']
                ], 500);
            }

            // Update main transaction
            $transaction->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'cancel_reason' => 'Manual cancellation'
            ]);
            
            // Generate associated delivery order ID
            $deliveryOrderId = 'DEL-' . substr($orderId, 4) . '-%';
            
            // Cancel all associated delivery fee transactions
            $deliveryFeeTransactions = Transaction::where('order_id', 'like', $deliveryOrderId)
                ->whereIn('status', ['pending', 'settlement'])
                ->get();
            
            foreach ($deliveryFeeTransactions as $feeTransaction) {
                // Cancel in Midtrans
                $this->cancelTransactionMidtrans($feeTransaction->order_id);
                
                // Update local status
                $feeTransaction->update([
                    'status' => 'cancelled',
                    'cancelled_at' => now(),
                    'cancel_reason' => 'Canceled due to parent ORD cancellation.'
                ]);
            }
            
            $this->clearTransactionCache($orderId);

            DB::commit();

            Log::info('Transaksi berhasil dibatalkan', [
                'order_id' => $orderId,
                'midtrans_response' => $midtransResult['data']
            ]);

            // Notifikasi pembatalan ke pembeli (user)
            $buyer = $transaction->user;
            if ($buyer) {
                $buyer->notify(new \App\Notifications\PaymentStatusNotification(
                    'Transaksi dibatalkan',
                    'Pesanan Anda telah dibatalkan.',
                    [
                        'type' => 'transaction_cancelled',
                        'status' => 'cancelled',
                        'order_id' => $orderId,
                        'amount' => $transaction->total,
                        'role' => 'user',
                        'cancel_reason' => $transaction->cancel_reason ?? 'Manual cancellation'
                    ]
                ));
            }

            // Notifikasi pembatalan ke Mitra pemilik item
            foreach ($transaction->items as $tItem) {
                $ownerId = $tItem->item->user_id ?? ($tItem->item->event->user_id ?? null);
                if ($ownerId) {
                    $owner = \App\Models\User::find($ownerId);
                    if ($owner) {
                        $itemName = $tItem->item->name ?? $tItem->type;
                        $owner->notify(new \App\Notifications\PaymentStatusNotification(
                            'Pesanan dibatalkan',
                            'Pesanan untuk item ' . $itemName . ' telah dibatalkan.',
                            [
                                'type' => 'mitra_item_cancelled',
                                'status' => 'cancelled',
                                'order_id' => $orderId,
                                'amount' => $tItem->price * $tItem->qty,
                                'role' => 'mitra',
                                'items' => [[
                                    'item_type' => $tItem->item_type,
                                    'item_id' => $tItem->item_id,
                                    'name' => $itemName,
                                    'qty' => $tItem->qty,
                                    'price' => $tItem->price
                                ]]
                            ]
                        ));
                    }
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil dibatalkan',
                'data' => [
                    'order_id' => $orderId,
                    'status' => 'cancelled',
                    'cancelled_at' => $transaction->cancelled_at
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Gagal membatalkan transaksi', [
                'order_id' => $orderId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Gagal membatalkan transaksi',
                'message' => 'Terjadi kesalahan sistem'
            ], 500);
        }
    }

    private function cancelTransactionMidtrans($orderId)
    {
        try {
            $client = new Client();
            
            $serverKey = config('midtrans.server_key');
            $isProduction = config('midtrans.is_production', false);
            
            $baseUrl = $isProduction 
                ? 'https://api.midtrans.com' 
                : 'https://api.sandbox.midtrans.com';
            
            $url = "{$baseUrl}/v2/{$orderId}/cancel";
            
            $authorization = base64_encode($serverKey . ':');
            
            $response = $client->request('POST', $url, [
                'headers' => [
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                    'Authorization' => "Basic {$authorization}",
                ],
                'timeout' => 30
            ]);

            $responseBody = json_decode($response->getBody()->getContents(), true);
            
            return [
                'success' => true,
                'data' => $responseBody,
                'message' => 'Berhasil membatalkan di Midtrans'
            ];

        } catch (RequestException $e) {
            $errorMessage = 'Midtrans API Error';
            $errorDetails = [];
            
            if ($e->hasResponse()) {
                $responseBody = $e->getResponse()->getBody()->getContents();
                $errorData = json_decode($responseBody, true);
                
                if (isset($errorData['error_messages'])) {
                    $errorMessage = implode(', ', $errorData['error_messages']);
                }
                
                $errorDetails = $errorData;
            }
            
            Log::error('Midtrans cancel transaction failed', [
                'order_id' => $orderId,
                'error' => $e->getMessage(),
                'response' => $errorDetails
            ]);
            
            return [
                'success' => false,
                'message' => $errorMessage,
                'data' => $errorDetails
            ];
            
        } catch (\Exception $e) {
            Log::error('Unexpected error during Midtrans cancellation', [
                'order_id' => $orderId,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'message' => 'Unexpected error occurred',
                'data' => []
            ];
        }
    }

    private function clearTransactionCache($orderId)
    {
        $cacheKeys = [
            "transaction_{$orderId}",
            "transaction_status_{$orderId}",
            "transaction_detail_{$orderId}",
            "payment_status_{$orderId}"
        ];

        foreach ($cacheKeys as $key) {
            Cache::forget($key);
        }
    }

    public function checkTransactionStatusMidtrans($orderId)
    {
        try {
            $client = new Client();
            
            $serverKey = config('midtrans.server_key');
            $isProduction = config('midtrans.is_production', false);
            
            $baseUrl = $isProduction 
                ? 'https://api.midtrans.com' 
                : 'https://api.sandbox.midtrans.com';
            
            $url = "{$baseUrl}/v2/{$orderId}/status";
            $authorization = base64_encode($serverKey . ':');
            
            $response = $client->request('GET', $url, [
                'headers' => [
                    'Accept' => 'application/json',
                    'Authorization' => "Basic {$authorization}",
                ],
                'timeout' => 30
            ]);

            $responseBody = json_decode($response->getBody()->getContents(), true);
            
            return response()->json([
                'success' => true,
                'data' => $responseBody
            ]);

        } catch (RequestException $e) {
            Log::error('Failed to check transaction status', [
                'order_id' => $orderId,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'error' => 'Gagal mengecek status transaksi'
            ], 500);
        }
    }

    public function finish(Request $request)
    {
        $orderId = $request->query('order_id');

        Log::info('Midtrans finish callback', [
            'order_id' => $orderId,
            'all_params' => $request->all()
        ]);

        $transaction = null;
        $status = 'success';
        $vaInfo = null;

        if ($orderId) {
            $transaction = Transaction::where('order_id', $orderId)->first();
            if ($transaction) {
                $status = $transaction->status;

                if ($transaction->va_number || $transaction->bill_key) {
                    $vaInfo = [
                        'va_number' => $transaction->va_number,
                        'bank_name' => $transaction->bank_name,
                        'bill_key' => $transaction->bill_key,
                        'biller_code' => $transaction->biller_code,
                    ];
                }
            }
        }

        return Inertia::render('Payment/Status', [
            'status' => $status,
            'order_id' => $orderId,
            'va_info' => $vaInfo,
            'transaction' => $transaction ? [
                'order_id' => $transaction->order_id,
                'total' => $transaction->total,
                'expired_at' => $transaction->expired_at,
                'payment_type' => $transaction->payment_type,
            ] : null,
        ]);
    }

    public function error(Request $request)
    {
        $orderId = $request->query('order_id');

        Log::error('Midtrans error callback', [
            'order_id' => $orderId,
            'all_params' => $request->all()
        ]);

        return Inertia::render('Payment/Status', [
            'status' => 'error',
            'order_id' => $orderId,
        ]);
    }

    public function unfinish(Request $request)
    {
        $orderId = $request->query('order_id');

        Log::info('Midtrans unfinish callback', [
            'order_id' => $orderId,
            'all_params' => $request->all()
        ]);

        return Inertia::render('Payment/Status', [
            'status' => 'pending',
            'order_id' => $orderId,
        ]);
    }

    /**
     * Buat tagihan Midtrans untuk biaya antar (delivery_fee) setelah mitra mengisinya.
     * Algoritma tercepat: langsung buat Snap token dengan satu item "Biaya Antar",
     * simpan transaksi minimal, dan tautkan ke item asli untuk konsistensi tampilan purchase.
     */
    public function createDeliveryFee(Request $request, $transactionItemId)
    {
        // Ambil item transaksi + relasi yang dibutuhkan dengan query minimal
        $transactionItem = TransactionItem::with(['transaction.user', 'transaction.address'])->findOrFail($transactionItemId);
        // Validasi sederhana: hanya untuk opsi delivery dan fee > 0
        if ($transactionItem->delivery_type !== 'delivery') {
            return response()->json(['success' => false, 'error' => 'Opsi pengiriman harus delivery.'], 400);
        }
        $fee = (int) ($transactionItem->delivery_fee ?? 0);
        if ($fee <= 0) {
            return response()->json(['success' => false, 'error' => 'Biaya antar belum diisi atau tidak valid.'], 400);
        }

        $buyer = $transactionItem->transaction?->user;
        if (!$buyer) {
            return response()->json(['success' => false, 'error' => 'Pembeli tidak ditemukan.'], 404);
        }

        // Order id baru yang terhubung ke base order - use shorter format
        $baseOrderId = $transactionItem->transaction?->order_id ?? now()->format('YmdHis');
        // Extract unique part if baseOrderId starts with 'ORD-'
        $uniqueOrderPart = str_starts_with($baseOrderId, 'ORD-') ? substr($baseOrderId, 4) : $baseOrderId;
        $orderId = 'DEL-' . $uniqueOrderPart . '-' . Str::random(6);

        // Detail pelanggan dari transaksi asli (gunakan alamat jika tersedia)
        $customerDetails = [
            'first_name' => $buyer->name ?? '',
            'email' => $buyer->email ?? '',
        ];
        $address = $transactionItem->transaction?->address;
        if ($address) {
            $customerDetails['phone'] = $address->phone ?? '';
            $customerDetails['shipping_address'] = [
                'first_name'  => $address->recipient_name ?? '',
                'phone'       => $address->phone ?? '',
                'address'     => $address->address_line ?? '',
                'city'        => $address->city ?? '',
                'postal_code' => $address->postal_code ?? '',
            ];
        }

        // Parameter Midtrans Snap (langsung, tanpa kalkulasi pajak tambahan)
        $params = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $fee,
            ],
            'customer_details' => $customerDetails,
            'item_details' => [
                [
                    'id' => 'DELIVERY_FEE_' . $transactionItem->item_type . '_' . $transactionItem->item_id,
                    'price' => $fee,
                    'quantity' => 1,
                    'name' => 'Biaya Antar',
                ],
            ],
            'enabled_payments' => self::ENABLED_PAYMENTS,
            'expiry' => [
                'start_time' => now('Asia/Jakarta')->format('Y-m-d H:i:s O'),
                'unit' => 'minutes',
                'duration' => 60
            ],
            'callbacks' => [
                'finish' => route('midtrans.finish'),
                'error' => route('midtrans.error'),
                'unfinish' => route('midtrans.unfinish')
            ]
        ];

        try {
            // Buat Snap token
            $snapToken = Snap::getSnapToken($params);
            $midtransRedirectUrl = config('midtrans.is_production')
                ? "https://app.midtrans.com/snap/v2/vtweb/{$snapToken}"
                : "https://app.sandbox.midtrans.com/snap/v2/vtweb/{$snapToken}";

            DB::beginTransaction();

            // Simpan transaksi biaya antar
            $transaction = Transaction::create([
                'user_id' => $buyer->id,
                'order_id' => $orderId,
                'redirect_url' => $midtransRedirectUrl,
                'status' => 'pending',
                'token' => $snapToken,
                'total' => $fee,
                'subtotal' => $fee,
                'tax' => 0,
                'expired_at' => $transactionItem->rent_days ? Carbon::parse($transactionItem->rent_days)->endOfDay()->toDateTimeString() : now()->addMinutes(60)->toDateTimeString(),
            ]);

            // Simpan item terkait untuk konsistensi tampilan purchase
            TransactionItem::create([
                'transaction_id'  => $transaction->id,
                'item_id'         => $transactionItem->item_id,
                'item_type'       => $transactionItem->item_type,
                'type'            => 'Delivery Fee',
                'qty'             => 1,
                'price'           => $fee,
                'delivery_type' => 'delivery',
                'note'            => 'Biaya antar untuk pesanan ' . ($transactionItem->transaction?->order_id ?? ''),
                'rent_days'       => $transactionItem->rent_days,
            ]);

            DB::commit();

            Log::info('Delivery fee invoice created', [
                'order_id' => $orderId,
                'base_order_id' => $baseOrderId,
                'fee' => $fee,
                'transaction_id' => $transaction->id,
                'transaction_item_id' => $transactionItem->id,
            ]);

            return response()->json([
                'success' => true,
                'token' => $snapToken,
                'order_id' => $orderId,
                'redirect_url' => $midtransRedirectUrl
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create delivery fee invoice', [
                'transaction_item_id' => $transactionItem->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'error' => 'Gagal membuat tagihan biaya antar.'
            ], 500);
        }
    }
}
