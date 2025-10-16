<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\TransactionAddress;
use App\Models\Ticket;
use App\Models\Service;
use App\Models\Building;
use App\Models\RentProperties;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
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
        'rent_property' => RentProperties::class,
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
            'items.*.rent_days' => 'nullable|date|after:today',
            'amount' => 'required|numeric|min:1',
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

            // 🔎 Validasi & siapkan item (pakai methodmu)
            $validatedItems = $this->validateAndPrepareItems($validatedData['items']);

            // Format item untuk Midtrans
            $itemDetails = collect($validatedData['items'])->map(function ($item) {
                return [
                    'id' => 'ITEM_' . $item['id'],
                    'name' => $item['name'],
                    'price' => (int) $item['price'],
                    'quantity' => (int) $item['quantity'],
                ];
            })->toArray();

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
                    'gross_amount' => (int) $validatedData['amount'],
                ],
                'customer_details' => $customerDetails,
                'item_details' => $itemDetails,
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
                'total' => $validatedData['amount'],
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

            return response()->json([
                'success' => true,
                'token' => $snapToken,
                'order_id' => $orderId,
                'redirect_url' => $midtransRedirectUrl
            ]);
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
                    // OPTIMIZED: Parse date string langsung tanpa timezone conversion
                    try {
                        // Ambil hanya tanggal YYYY-MM-DD, buang timezone info
                        $rentDays = substr($itemData['rent_days'], 0, 10);

                        // Validasi format
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

                $validatedItems[] = [
                    'type' => $type,
                    'item' => $item,
                    'quantity' => $itemData['quantity'],
                    'price' => $itemData['price'] ?? $item->price ?? 0, 
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
            'gross_amount' => $request->gross_amount
        ]);

        $serverKey = config('midtrans.server_key');
        $hashed = hash("sha512", $request->order_id . $request->status_code . $request->gross_amount . $serverKey);

        if ($hashed == $request->signature_key) {
            if (in_array($request->transaction_status, ['capture', 'settlement'])) {
                $transaction = Transaction::where('order_id', $request->order_id)->first();

                if ($transaction) {
                    // Tandai transaksi ini berhasil
                    $transaction->update([
                        'status' => 'settlement',
                        'payment_type' => $request->payment_type ?? null,
                        'status_code' => $request->status_code ?? null
                    ]);

                    // Ambil semua item transaksi yang berhasil
                    foreach ($transaction->items as $item) {
                        // Cari transaksi lain dengan jasa & tanggal sama
                        $otherTransactions = Transaction::where('id', '!=', $transaction->id)
                            ->where('status', 'pending')
                            ->whereHas('items', function ($q) use ($item) {
                                $q->where('item_id', $item->item_id)
                                    ->where('rent_days', $item->rent_days);
                            })
                            ->get();

                        foreach ($otherTransactions as $other) {
                            $other->update([
                                'status' => 'expired' // atau "cancelled"
                            ]);

                            // Cancel di Midtrans juga
                            try {
                                \Midtrans\Transaction::cancel($other->order_id);
                            } catch (\Exception $e) {
                                Log::error('Gagal cancel di Midtrans', [
                                    'order_id' => $other->order_id,
                                    'error' => $e->getMessage()
                                ]);
                            }

                            Log::info('Transaksi lain dibatalkan karena jasa di tanggal sama sudah dipakai', [
                                'order_id' => $other->order_id,
                                'item_id' => $item->item_id,
                                'rent_days' => $item->rent_days
                            ]);
                        }
                    }

                    // Kirim notifikasi ke user
                    $user = $transaction->user;
                    if ($user) {
                        $user->notify(new TransactionSettled($transaction));
                        Log::info('Notifikasi transaksi berhasil dikirim', [
                            'order_id' => $transaction->order_id,
                            'user_id' => $user->id
                        ]);
                    } else {
                        Log::warning('User tidak ditemukan untuk notifikasi', [
                            'order_id' => $transaction->order_id
                        ]);
                    }

                    Log::info('Transaksi berhasil diperbarui', [
                        'order_id' => $request->order_id,
                        'status' => 'settlement'
                    ]);
                } else {
                    Log::error('Transaksi tidak ditemukan', ['order_id' => $request->order_id]);
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

    /**
     * Update kuota item secara efisien
     */
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
            
            // Cek transaksi di database lokal
            $transaction = Transaction::where('order_id', $orderId)
                ->where('status', 'pending')
                ->first();

            if (!$transaction) {
                return response()->json([
                    'error' => 'Transaksi tidak ditemukan atau tidak bisa dibatalkan'
                ], 404);
            }

            // Batalkan transaksi di Midtrans
            $midtransResult = $this->cancelTransactionMidtrans($orderId);
            
            if (!$midtransResult['success']) {
                DB::rollback();
                return response()->json([
                    'error' => 'Gagal membatalkan transaksi di payment gateway',
                    'details' => $midtransResult['message']
                ], 500);
            }

            // Update status di database lokal
            $transaction->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'cancel_reason' => 'Manual cancellation'
            ]);
            
            // Hapus cache terkait
            $this->clearTransactionCache($orderId);

            DB::commit();

            Log::info('Transaksi berhasil dibatalkan', [
                'order_id' => $orderId,
                'midtrans_response' => $midtransResult['data']
            ]);

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

    /**
     * Batalkan transaksi melalui Midtrans API
     */
    private function cancelTransactionMidtrans($orderId)
    {
        try {
            $client = new Client();
            
            // Ambil konfigurasi dari .env
            $serverKey = config('midtrans.server_key');
            $isProduction = config('midtrans.is_production', false);
            
            // Tentukan URL berdasarkan environment
            $baseUrl = $isProduction 
                ? 'https://api.midtrans.com' 
                : 'https://api.sandbox.midtrans.com';
            
            $url = "{$baseUrl}/v2/{$orderId}/cancel";
            
            // Encode server key untuk authorization
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

    /**
     * Hapus cache terkait transaksi
     */
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

    /**
     * Cek status transaksi dari Midtrans
     */
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
        Log::info('Midtrans finish callback', $request->all());
        return redirect()->route('home')->with('success', 'Pembayaran selesai.');
    }

    public function error(Request $request)
    {
        Log::error('Midtrans error callback', $request->all());
        return redirect()->route('home')->with('error', 'Pembayaran gagal.');
    }

    public function unfinish(Request $request)
    {
        Log::info('Midtrans unfinish callback', $request->all());
        return redirect()->route('home')->with('info', 'Pembayaran belum selesai.');
    }
}