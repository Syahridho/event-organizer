# Implementasi Wallet untuk Event Creator

## 📋 Ringkasan
Sistem telah diperbarui untuk secara otomatis mengkreditkan wallet mitra pembuat event ketika user membeli tiket. **Pajak tidak dihitung** - hanya harga tiket murni yang masuk ke wallet.

## 🚀 Fitur Utama

### 1. **Automatic Wallet Credit**
- Ketika transaksi tiket berhasil (status: `settlement` atau `capture`)
- Uang tiket otomatis masuk ke wallet pembuat event
- Pajak **TIDAK** termasuk dalam perhitungan

### 2. **Algoritma Tercepat**
Implementasi menggunakan algoritma optimal dengan karakteristik:

#### a. **Eager Loading**
```php
->with(['item.event.user']) // Menghindari N+1 query problem
```

#### b. **Batch Processing**
- Group revenue berdasarkan owner
- Single query per owner untuk update wallet
- Mengurangi jumlah database transactions

#### c. **Atomic Operations**
```php
$wallet->increment('balance', $totalRevenue); // Atomic, race-condition safe
```

## 📊 Alur Kerja

```
User Membeli Tiket
    ↓
Midtrans Callback (Settlement)
    ↓
creditEventCreatorWallet() dipanggil
    ↓
1. Query semua transaction items (tiket saja)
2. Eager load: item → event → user
3. Group revenue by event creator
4. Batch update wallet per creator
5. Log wallet transactions
    ↓
Wallet Creator Terkredit ✅
```

## 💾 Struktur Data

### Transaction Item
```php
[
    'item_type' => 'ticket',
    'price' => 100000,  // Harga per tiket (tanpa pajak)
    'qty' => 2,         // Jumlah tiket
]
```

### Perhitungan Revenue
```php
$revenue = $price * $qty;  // 100000 * 2 = 200000
// Pajak TIDAK ditambahkan
```

### Wallet Transaction Record
```php
[
    'wallet_id' => 1,
    'user_id' => 5,              // Event creator ID
    'amount' => 200000,          // Revenue (tanpa pajak)
    'type' => 'CREDIT',
    'reference_type' => 'transaction_item',
    'reference_id' => 123,       // Transaction item ID
    'description' => 'Pendapatan dari penjualan tiket: VIP Ticket (Order: ORD-xxx)'
]
```

## 🔧 Perubahan File

### 1. **MidtransController.php**
- ✅ Import `Wallet` dan `WalletTransaction` models
- ✅ Method baru: `creditEventCreatorWallet()`
- ✅ Integrasi di `callback()` method

### 2. **Transaction.php**
- ✅ Tambah `subtotal` ke fillable array

## 📝 Logging

Sistem mencatat setiap aktivitas wallet:

### Success Log
```php
Log::info('Wallet event creator berhasil dikreditkan', [
    'owner_id' => 5,
    'total_revenue' => 200000,
    'order_id' => 'ORD-xxx',
    'wallet_balance' => 500000  // Balance setelah kredit
]);
```

### Error Log
```php
Log::error('Gagal mengkreditkan wallet event creator', [
    'owner_id' => 5,
    'total_revenue' => 200000,
    'order_id' => 'ORD-xxx',
    'error' => 'Error message',
    'trace' => 'Stack trace'
]);
```

## 🎯 Keunggulan Algoritma

### 1. **Performance**
- **O(n)** complexity untuk n transaction items
- Single query untuk eager loading
- Batch processing mengurangi database hits

### 2. **Reliability**
- Database transactions untuk consistency
- Atomic increment untuk race-condition safety
- Error handling dengan rollback

### 3. **Scalability**
- Efficient untuk multiple tickets dalam satu order
- Efficient untuk multiple event creators
- Minimal memory footprint

### 4. **Maintainability**
- Clean separation of concerns
- Comprehensive logging
- Self-documenting code

## 🔍 Contoh Skenario

### Skenario 1: Single Event Creator
```
User membeli:
- 2x VIP Ticket @ Rp 100.000 = Rp 200.000
- 1x Regular Ticket @ Rp 50.000 = Rp 50.000
Total: Rp 250.000 (subtotal)
Pajak: Rp 27.500 (11%)
Grand Total: Rp 277.500

Wallet Event Creator: +Rp 250.000 ✅
(Pajak Rp 27.500 TIDAK masuk wallet)
```

### Skenario 2: Multiple Event Creators
```
User membeli tiket dari 2 event berbeda:
Event A (Creator ID: 5):
- 1x Ticket @ Rp 100.000

Event B (Creator ID: 7):
- 2x Ticket @ Rp 75.000 = Rp 150.000

Hasil:
- Wallet Creator 5: +Rp 100.000 ✅
- Wallet Creator 7: +Rp 150.000 ✅
```

## ⚠️ Catatan Penting

1. **Hanya Tiket**: Sistem hanya memproses `item_type = 'ticket'`
2. **Tanpa Pajak**: Revenue = price × qty (pajak tidak termasuk)
3. **Settlement Only**: Wallet hanya dikredit saat status `settlement`/`capture`
4. **Automatic**: Tidak perlu intervensi manual
5. **Traceable**: Semua transaksi tercatat di `wallet_transactions`

## 🧪 Testing

Untuk menguji implementasi:

1. Buat event dengan tiket
2. User membeli tiket
3. Simulasi payment settlement via Midtrans callback
4. Cek wallet event creator di database:
   ```sql
   SELECT * FROM wallets WHERE user_id = [event_creator_id];
   SELECT * FROM wallet_transactions WHERE user_id = [event_creator_id];
   ```

## 📈 Monitoring

Monitor performa dengan:
```sql
-- Total revenue per event creator
SELECT 
    user_id,
    SUM(amount) as total_revenue,
    COUNT(*) as transaction_count
FROM wallet_transactions
WHERE type = 'CREDIT'
GROUP BY user_id;

-- Recent wallet activities
SELECT * FROM wallet_transactions
ORDER BY created_at DESC
LIMIT 10;
```

---

**Implementasi Selesai** ✅  
Sistem sekarang otomatis mengkreditkan wallet event creator dengan algoritma tercepat dan paling efisien.
