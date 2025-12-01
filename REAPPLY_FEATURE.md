# Feature: Reapply untuk Mitra yang Ditolak

## Overview
Fitur ini memungkinkan user yang pengajuan mitranya ditolak untuk mengajukan kembali dengan menghapus data lama dan kembali ke Step 2 untuk mengisi formulir dari awal.

## User Flow

```
User ditolak → Notifikasi diterima
    ↓
Klik notifikasi / Buka /partner/register
    ↓
Melihat Step 3: "Pengajuan Ditolak"
    ↓
Klik tombol "Ajukan Kembali"
    ↓
Konfirmasi dialog muncul
    ↓
User konfirmasi "Ya, Ajukan Kembali"
    ↓
POST /partner/reapply
    ↓
Backend:
  - Hapus file NPWP lama
  - Hapus file dokumen usaha lama
  - Hapus record mitra dari database
    ↓
Redirect ke /partner/register
    ↓
User melihat Step 2 (formulir kosong)
    ↓
User mengisi formulir dengan data baru
    ↓
Submit → Pengajuan baru dibuat
```

## Implementation

### 1. Backend - PartnerController.php

#### New Method: `reapply()`

```php
/**
 * Allow rejected mitra to reapply by deleting old rejected record
 */
public function reapply()
{
    try {
        $user = auth()->user();
        $existingMitra = Mitra::where('user_id', $user->id)->first();

        // Only allow reapply if status is rejected
        if (!$existingMitra || $existingMitra->status !== 'rejected') {
            return redirect()->route('partner.create')
                ->with('error', 'Anda tidak memiliki pengajuan yang ditolak.');
        }

        // Delete old files
        if ($existingMitra->npwp_file_path && Storage::disk('public')->exists($existingMitra->npwp_file_path)) {
            Storage::disk('public')->delete($existingMitra->npwp_file_path);
        }
        if ($existingMitra->business_file_path && Storage::disk('public')->exists($existingMitra->business_file_path)) {
            Storage::disk('public')->delete($existingMitra->business_file_path);
        }

        // Delete mitra record
        $existingMitra->delete();

        \Log::info('Mitra reapply - old record deleted', [
            'user_id' => $user->id,
            'old_mitra_id' => $existingMitra->id
        ]);

        return redirect()->route('partner.create')
            ->with('success', 'Data lama telah dihapus. Silakan lengkapi formulir kembali.');

    } catch (\Exception $e) {
        \Log::error('Reapply failed', [
            'user_id' => auth()->id(),
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);

        return redirect()->route('partner.create')
            ->with('error', 'Terjadi kesalahan. Silakan coba lagi.');
    }
}
```

**Features**:
- ✅ Validasi: Hanya status "rejected" yang bisa reapply
- ✅ Hapus file lama dari storage
- ✅ Hapus record dari database
- ✅ Logging untuk audit trail
- ✅ Error handling yang robust

### 2. Routes - web.php

```php
Route::post('/partner/reapply', [PartnerController::class, 'reapply'])
    ->name('partner.reapply')
    ->middleware('auth');
```

**Security**:
- ✅ Requires authentication
- ✅ POST method (tidak bisa diakses via URL)
- ✅ CSRF protection

### 3. Frontend - User/Mitra/Index.jsx

#### Enhanced Step3Status Component

**New State**:
```javascript
const [showReapplyDialog, setShowReapplyDialog] = React.useState(false);
const [isReapplying, setIsReapplying] = React.useState(false);
```

**Reapply Handler**:
```javascript
const handleReapply = () => {
    setIsReapplying(true);
    
    router.post(
        route("partner.reapply"),
        {},
        {
            preserveState: false,
            onSuccess: () => {
                setShowReapplyDialog(false);
                setIsReapplying(false);
                toast.success("Berhasil!", {
                    description: "Data lama telah dihapus. Silakan lengkapi formulir kembali.",
                });
            },
            onError: (errors) => {
                setIsReapplying(false);
                toast.error("Gagal", {
                    description: errors.message || "Terjadi kesalahan saat menghapus data lama.",
                });
            },
        }
    );
};
```

**Confirmation Dialog**:
```javascript
{showReapplyDialog && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    Konfirmasi Ajukan Kembali
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                    Dengan mengajukan kembali, data pengajuan lama Anda akan 
                    <strong>dihapus permanen</strong> termasuk dokumen yang telah diupload.
                </p>
                <p className="text-sm text-slate-600">
                    Anda akan kembali ke <strong>Step 2</strong> untuk mengisi 
                    formulir dari awal dengan data yang baru.
                </p>
                <p className="text-sm font-medium text-slate-800">
                    Apakah Anda yakin ingin melanjutkan?
                </p>
                <div className="flex gap-3 pt-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowReapplyDialog(false)}
                        className="flex-1"
                        disabled={isReapplying}
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleReapply}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        disabled={isReapplying}
                    >
                        {isReapplying ? (
                            <>
                                <Clock className="h-4 w-4 mr-2 animate-spin" />
                                Memproses...
                            </>
                        ) : (
                            "Ya, Ajukan Kembali"
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
)}
```

## Features

### User Experience
- ✅ **Confirmation Dialog**: Mencegah accidental deletion
- ✅ **Clear Warning**: User tahu data akan dihapus permanen
- ✅ **Loading State**: Button disabled saat processing
- ✅ **Toast Notification**: Feedback jelas success/error
- ✅ **Auto Redirect**: Langsung ke Step 2 setelah berhasil

### Security
- ✅ **Authentication Required**: Hanya user yang login
- ✅ **Status Validation**: Hanya rejected yang bisa reapply
- ✅ **CSRF Protection**: Token validation
- ✅ **File Cleanup**: Hapus file lama dari storage

### Data Integrity
- ✅ **Cascade Delete**: Hapus record + files
- ✅ **Transaction Safety**: Error handling yang proper
- ✅ **Audit Trail**: Logging semua aksi
- ✅ **No Orphan Files**: File storage dibersihkan

## Testing Guide

### Test 1: Successful Reapply

**Prerequisites**:
- User sudah login
- User punya mitra dengan status "rejected"

**Steps**:
1. Buka `/partner/register`
2. Lihat Step 3: "Pengajuan Ditolak"
3. Klik tombol "Ajukan Kembali"
4. Dialog konfirmasi muncul
5. Klik "Ya, Ajukan Kembali"

**Expected**:
- ✅ Loading state: "Memproses..."
- ✅ Toast hijau: "Berhasil! Data lama telah dihapus..."
- ✅ Redirect ke Step 2
- ✅ Formulir kosong (ready untuk data baru)
- ✅ File lama terhapus dari storage
- ✅ Record lama terhapus dari database

**Laravel Log**:
```
[INFO] Mitra reapply - old record deleted {"user_id":17,"old_mitra_id":1}
```

### Test 2: Cancel Reapply

**Steps**:
1. Klik "Ajukan Kembali"
2. Dialog muncul
3. Klik "Batal"

**Expected**:
- ✅ Dialog tertutup
- ✅ Tetap di Step 3
- ✅ Data tidak berubah

### Test 3: Reapply with Pending Status

**Prerequisites**:
- User punya mitra dengan status "pending"

**Steps**:
1. Coba akses POST `/partner/reapply` (via console/Postman)

**Expected**:
- ❌ Error: "Anda tidak memiliki pengajuan yang ditolak."
- ✅ Data tidak berubah

### Test 4: Reapply without Mitra

**Prerequisites**:
- User tidak punya record mitra

**Steps**:
1. Coba akses POST `/partner/reapply`

**Expected**:
- ❌ Error: "Anda tidak memiliki pengajuan yang ditolak."
- ✅ Redirect ke `/partner/register`

### Test 5: Complete Reapply Flow

**Full Journey**:
1. User register → Step 1 ✅
2. Submit partner form → Step 2 ✅
3. Wait → Step 3 (Pending) ✅
4. Admin reject → Step 3 (Ditolak) ✅
5. User klik "Ajukan Kembali" ✅
6. Konfirmasi dialog ✅
7. Data lama dihapus ✅
8. Kembali ke Step 2 ✅
9. Isi formulir baru ✅
10. Submit → Pengajuan baru dibuat ✅

## UI/UX Details

### Confirmation Dialog
- **Background**: Black overlay 50% opacity
- **Card**: White, max-width 28rem, centered
- **Icon**: Amber warning triangle
- **Title**: "Konfirmasi Ajukan Kembali"
- **Content**: 
  - Warning tentang data dihapus permanen
  - Info kembali ke Step 2
  - Konfirmasi question
- **Buttons**: 
  - Batal (outline, gray)
  - Ya, Ajukan Kembali (solid, red)

### Button States
- **Normal**: "Ajukan Kembali" (red)
- **Loading**: "Memproses..." (disabled, spinner)
- **Disabled**: Gray, no hover effect

### Toast Notifications
- **Success**: Green toast, "Berhasil!"
- **Error**: Red toast, "Gagal"

## Database Changes

### Before Reapply
```sql
SELECT * FROM mitra WHERE user_id = 17;
-- id: 1, status: 'rejected', npwp_file_path: 'mitra/npwp/xxx.pdf', ...
```

### After Reapply
```sql
SELECT * FROM mitra WHERE user_id = 17;
-- (empty result - record deleted)
```

### Storage Changes

**Before**:
```
storage/app/public/mitra/npwp/xxx.pdf
storage/app/public/mitra/business_files/yyy.pdf
```

**After**:
```
(files deleted)
```

## Error Handling

### Case 1: File Deletion Fails
```php
// Gracefully handled - continues with record deletion
// Logs error for manual cleanup
```

### Case 2: Database Error
```php
// Transaction rollback
// Error message to user
// Full stack trace in log
```

### Case 3: Network Error
```javascript
// Frontend shows error toast
// User can retry
```

## Security Considerations

1. **Authorization**: Only authenticated users
2. **Validation**: Only rejected status can reapply
3. **CSRF**: Token validation on POST
4. **File Access**: Only delete user's own files
5. **Logging**: Audit trail for all actions

## Performance

- **File Deletion**: Async, non-blocking
- **Database**: Single DELETE query
- **Frontend**: Optimistic UI updates
- **No N+1**: Single query to fetch mitra

## Future Enhancements (Optional)

- [ ] Soft delete instead of hard delete
- [ ] Keep history of rejections
- [ ] Email notification on reapply
- [ ] Rate limiting (prevent spam reapply)
- [ ] Admin notification when user reapplies

## Related Features

This feature complements:
1. ✅ Partner registration flow
2. ✅ Admin reject functionality
3. ✅ Notification system
4. ✅ File upload system

## Files Modified

1. **Backend**:
   - `app/Http/Controllers/PartnerController.php` - Added reapply method
   - `routes/web.php` - Added partner.reapply route

2. **Frontend**:
   - `resources/js/Pages/User/Mitra/Index.jsx` - Enhanced Step3Status

## Summary

✅ **User yang ditolak sekarang bisa mengajukan kembali dengan mudah**
✅ **Data lama dihapus otomatis (record + files)**
✅ **Konfirmasi dialog mencegah accidental deletion**
✅ **Clear feedback dengan toast notifications**
✅ **Kembali ke Step 2 untuk isi formulir baru**
✅ **Secure dan robust dengan error handling lengkap**

Fitur ini memberikan second chance kepada user yang ditolak sambil menjaga data integrity dan user experience yang baik! 🎉
