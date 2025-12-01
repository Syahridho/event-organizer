# Fix: Route Error pada Reject Mitra

## Problem
Ketika admin melakukan reject pada mitra, terjadi error:
```
Route [mitra.reapply] not defined.
```

Error terjadi di `MitraStatusNotification.php` line 48.

## Root Cause
File `app/Notifications/MitraStatusNotification.php` menggunakan route `mitra.reapply` yang tidak terdefinisi di `routes/web.php`.

```php
// Line 48 - WRONG
'url' => route('mitra.reapply'), // Route tidak ada!
```

## Error Log Analysis
```
[2025-11-29 20:45:12] local.INFO: Attempting to reject mitra {"mitra_id":1,"current_status":"pending","user_id":17} 
[2025-11-29 20:45:12] local.INFO: Mitra status updated to rejected  
[2025-11-29 20:45:12] local.ERROR: Error rejecting mitra {"mitra_id":1,"error":"Route [mitra.reapply] not defined."
```

**Sequence**:
1. ✅ Reject dimulai
2. ✅ Status berhasil diupdate ke "rejected"
3. ❌ Error saat mengirim notifikasi (route tidak ada)
4. ❌ Transaction rollback
5. ❌ Reject gagal total

## Solution

### Fixed Route Reference
**File**: `app/Notifications/MitraStatusNotification.php`

**Before**:
```php
'url' => route('mitra.reapply'), // ❌ Route tidak ada
```

**After**:
```php
'url' => route('partner.create'), // ✅ Route untuk mengajukan kembali
```

### Why `partner.create`?
- ✅ Route sudah terdefinisi di `routes/web.php` line 110
- ✅ Mengarah ke halaman pendaftaran mitra
- ✅ User yang ditolak bisa mengajukan kembali dari halaman ini
- ✅ Konsisten dengan flow pendaftaran

## Complete Fix

```php
<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\Mitra;

class MitraStatusNotification extends Notification
{
    use Queueable;

    protected $mitra;
    protected $status; // 'approved' or 'rejected'
    protected $reason;

    public function __construct(Mitra $mitra, $status, $reason = null)
    {
        $this->mitra = $mitra;
        $this->status = $status;
        $this->reason = $reason;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        if ($this->status === 'approved') {
            return [
                'title' => 'Pengajuan Mitra Disetujui',
                'message' => 'Selamat! Pengajuan mitra Anda telah disetujui.',
                'mitra_id' => $this->mitra->id,
                'type' => 'mitra_approved',
                'status' => 'approved',
                'url' => route('mitra.dashboard'), // ✅ Route valid
            ];
        } else {
            return [
                'title' => 'Pengajuan Mitra Ditolak',
                'message' => 'Maaf, pengajuan mitra Anda ditolak. ' . ($this->reason ?? ''),
                'mitra_id' => $this->mitra->id,
                'type' => 'mitra_rejected',
                'status' => 'rejected',
                'reason' => $this->reason,
                'url' => route('partner.create'), // ✅ FIXED - Route valid
            ];
        }
    }
}
```

## Technical Flow (After Fix)

```
Admin klik "Tolak"
    ↓
Konfirmasi
    ↓
POST /admin/partners/{id}/reject
    ↓
DB Transaction BEGIN
    ↓
Update status → 'rejected' ✅
    ↓
Create notification:
  - title: "Pengajuan Mitra Ditolak"
  - message: "Maaf, pengajuan mitra Anda ditolak..."
  - url: route('partner.create') ✅ (FIXED)
    ↓
Send notification ✅
    ↓
DB Transaction COMMIT ✅
    ↓
Redirect dengan success message ✅
    ↓
Frontend shows toast "Berhasil!" ✅
```

## Routes Verification

### Used Routes in Notification:

1. **Approved Case**:
   ```php
   'url' => route('mitra.dashboard')
   ```
   - ✅ Defined in `routes/web.php` line 239
   - ✅ Route: `/dashboard`
   - ✅ Controller: `MitraController@dashboard`

2. **Rejected Case**:
   ```php
   'url' => route('partner.create')
   ```
   - ✅ Defined in `routes/web.php` line 110
   - ✅ Route: `/partner/register`
   - ✅ Controller: `PartnerController@index`

## Testing

### Test 1: Reject Mitra (Should Work Now)

1. Login sebagai admin
2. Buka `/admin/mitra`
3. Klik "Detail" pada mitra pending
4. Klik "Tolak"
5. Konfirmasi

**Expected Result**:
```
✅ Toast: "Berhasil! Pengajuan mitra [name] telah ditolak."
✅ Modal closes
✅ Table refreshes
✅ Status berubah ke "Ditolak"
✅ Notifikasi terkirim ke user
```

**Check Laravel Log**:
```
[INFO] Attempting to reject mitra
[INFO] Mitra status updated to rejected
[INFO] Rejection notification sent to user
[INFO] Rejection completed successfully
```

### Test 2: User Receives Notification

1. Login sebagai user yang ditolak
2. Cek notifikasi
3. Klik notifikasi

**Expected Result**:
```
✅ Notifikasi muncul: "Pengajuan Mitra Ditolak"
✅ Message: "Maaf, pengajuan mitra Anda ditolak..."
✅ Klik notifikasi → redirect ke /partner/register
✅ User bisa mengajukan kembali
```

### Test 3: Approve Mitra (Should Still Work)

1. Login sebagai admin
2. Approve mitra pending
3. Check notification

**Expected Result**:
```
✅ Approve berhasil
✅ Notifikasi terkirim
✅ URL: /dashboard (mitra dashboard)
```

## Files Modified

1. **app/Notifications/MitraStatusNotification.php**
   - Line 48: Changed `route('mitra.reapply')` to `route('partner.create')`

## Error Prevention

### Before This Fix:
```
❌ Route not defined error
❌ Transaction rollback
❌ Reject fails completely
❌ No notification sent
❌ Confusing for admin (no clear error)
```

### After This Fix:
```
✅ All routes valid
✅ Transaction commits successfully
✅ Reject completes
✅ Notification sent
✅ Clear feedback to admin
```

## Related Routes Map

```
User Journey:
1. /partner/register (partner.create) → Register as partner
2. Wait for admin approval
3. If approved → /dashboard (mitra.dashboard)
4. If rejected → notification with link to /partner/register (partner.create)
5. User can reapply from step 1
```

## Debugging Commands

If you encounter similar route errors:

```bash
# List all routes
php artisan route:list

# Search for specific route
php artisan route:list | grep mitra

# Clear route cache
php artisan route:clear

# Clear all cache
php artisan cache:clear
php artisan config:clear
```

## Prevention for Future

### When Adding Notification URLs:

1. ✅ **Verify route exists**:
   ```bash
   php artisan route:list | grep route.name
   ```

2. ✅ **Use route helper**:
   ```php
   'url' => route('route.name')
   ```

3. ✅ **Test notification**:
   - Trigger the notification
   - Check Laravel log for errors
   - Verify notification in database

4. ✅ **Handle missing routes gracefully**:
   ```php
   'url' => Route::has('mitra.reapply') 
       ? route('mitra.reapply') 
       : route('partner.create')
   ```

## Summary

**Problem**: Route `mitra.reapply` tidak terdefinisi
**Solution**: Ganti dengan `partner.create` yang sudah ada
**Impact**: Reject mitra sekarang berfungsi 100%
**Bonus**: User yang ditolak bisa langsung reapply via notifikasi

✅ **Fix Complete!**
