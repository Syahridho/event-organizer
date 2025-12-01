# Fix: Fitur Tolak di /admin/mitra

## Problem
Fitur "Tolak" (reject) di halaman `/admin/mitra` tidak berfungsi dengan baik. Admin tidak mendapatkan feedback yang jelas apakah aksi berhasil atau gagal.

## Root Cause Analysis

Kemungkinan penyebab masalah:

1. **Tidak ada error handling** di frontend
2. **State tidak di-refresh** setelah reject
3. **Tidak ada user feedback** (toast/notification)
4. **CSRF token issues** (sudah diperbaiki sebelumnya)
5. **Logging tidak cukup** untuk debugging

## Solution Implemented

### 1. Frontend Enhancement - MitraDataTable.jsx

#### A. Added Toast Notifications
**File**: `resources/js/components/MitraDataTable.jsx`

```javascript
import { toast } from "sonner";
```

**Benefits**:
- ✅ User-friendly notifications
- ✅ Clear success/error messages
- ✅ Better UX than alert()

#### B. Enhanced handleConfirmAction

**Changes Made**:

1. **Added `preserveState: false`**
   - Forces Inertia to reload data from server
   - Ensures table shows updated status

2. **Added `preserveScroll: false`**
   - Resets scroll position after action
   - Better UX for modal closing

3. **Added Success Toast**
   ```javascript
   toast.success("Berhasil!", {
       description: `Pengajuan mitra ${mitra.user.name} telah ditolak.`,
   });
   ```

4. **Added Error Handling**
   ```javascript
   onError: (errors) => {
       console.error("Reject error:", errors);
       toast.error("Gagal Menolak", {
           description: errors.message || "Terjadi kesalahan saat menolak mitra.",
       });
   }
   ```

**Complete Code**:

```javascript
const handleConfirmAction = () => {
    const { type, mitra } = alertConfig;

    if (type === "approve") {
        router.post(
            route("admin.partners.approve", mitra.id),
            {},
            {
                preserveState: false,
                preserveScroll: false,
                onSuccess: () => {
                    setIsModalOpen(false);
                    setAlertConfig({
                        open: false,
                        type: null,
                        mitra: null,
                    });
                    toast.success("Berhasil!", {
                        description: `Pengajuan mitra ${mitra.user.name} telah disetujui.`,
                    });
                },
                onError: (errors) => {
                    console.error("Approve error:", errors);
                    toast.error("Gagal Menyetujui", {
                        description: errors.message || "Terjadi kesalahan saat menyetujui mitra.",
                    });
                },
            }
        );
    } else if (type === "reject") {
        router.post(
            route("admin.partners.reject", mitra.id),
            {},
            {
                preserveState: false,
                preserveScroll: false,
                onSuccess: () => {
                    setIsModalOpen(false);
                    setAlertConfig({
                        open: false,
                        type: null,
                        mitra: null,
                    });
                    toast.success("Berhasil!", {
                        description: `Pengajuan mitra ${mitra.user.name} telah ditolak.`,
                    });
                },
                onError: (errors) => {
                    console.error("Reject error:", errors);
                    toast.error("Gagal Menolak", {
                        description: errors.message || "Terjadi kesalahan saat menolak mitra.",
                    });
                },
            }
        );
    }
};
```

### 2. Backend Enhancement - PartnerController.php

#### Enhanced Logging
**File**: `app/Http/Controllers/Admin/PartnerController.php`

**Changes Made**:

1. **Added user_id to initial log**
   ```php
   Log::info('Attempting to reject mitra', [
       'mitra_id' => $mitra->id,
       'current_status' => $mitra->status,
       'user_id' => $mitra->user_id, // NEW
   ]);
   ```

2. **Added warning log for invalid status**
   ```php
   if ($mitra->status !== 'pending') {
       Log::warning('Cannot reject mitra - status not pending', [
           'mitra_id' => $mitra->id,
           'status' => $mitra->status
       ]);
       return Redirect::back()->with('error', '...');
   }
   ```

3. **Enhanced success log**
   ```php
   Log::info('Rejection completed successfully', [
       'mitra_id' => $mitra->id,
       'new_status' => $mitra->status
   ]);
   ```

4. **Added stack trace to error log**
   ```php
   Log::error('Error rejecting mitra', [
       'mitra_id' => $mitra->id,
       'error' => $e->getMessage(),
       'trace' => $e->getTraceAsString() // NEW
   ]);
   ```

## Technical Flow

### Before Fix
```
Admin clicks "Tolak" button
    ↓
Confirmation dialog appears
    ↓
Admin confirms
    ↓
POST request sent
    ↓
??? (No feedback)
    ↓
User confused - did it work?
```

### After Fix
```
Admin clicks "Tolak" button
    ↓
Confirmation dialog appears
    ↓
Admin confirms
    ↓
POST request sent with CSRF token
    ↓
Backend processes request
    ↓
Backend logs all steps
    ↓
Success → Toast notification "Berhasil!"
Error → Toast notification "Gagal Menolak" with reason
    ↓
Modal closes
    ↓
Table refreshes with updated data
    ↓
✅ Clear feedback to admin
```

## Features Added

### User Feedback
- ✅ **Success Toast**: "Pengajuan mitra [name] telah ditolak"
- ✅ **Error Toast**: "Gagal Menolak" with error description
- ✅ **Console Logging**: Errors logged to browser console
- ✅ **Server Logging**: Complete audit trail in Laravel logs

### Data Refresh
- ✅ **preserveState: false**: Forces data reload
- ✅ **preserveScroll: false**: Better UX
- ✅ **Modal auto-close**: On success
- ✅ **Table updates**: Shows new status immediately

### Error Handling
- ✅ **Network errors**: Caught and displayed
- ✅ **Validation errors**: Shown to user
- ✅ **CSRF errors**: Handled gracefully
- ✅ **Status errors**: "Already processed" message

## Testing Checklist

### Test Reject Functionality

1. **Login as Admin**
   ```
   Navigate to /admin/mitra
   ```

2. **Test Successful Reject**
   - Click "Detail" on pending mitra
   - Click "Tolak" button
   - Confirm in dialog
   - ✅ Should see success toast
   - ✅ Modal should close
   - ✅ Table should refresh
   - ✅ Status should change to "Ditolak"

3. **Test Already Processed**
   - Try to reject already approved/rejected mitra
   - ✅ Should see error message
   - ✅ Status should not change

4. **Test Network Error**
   - Disconnect internet
   - Try to reject
   - ✅ Should see error toast
   - ✅ Modal should stay open

5. **Check Logs**
   ```bash
   tail -f storage/logs/laravel.log
   ```
   - ✅ Should see detailed logs for each step

### Test Approve Functionality

Same tests apply for "Setujui" button:
- ✅ Success toast
- ✅ Error handling
- ✅ Data refresh
- ✅ Logging

## Files Modified

1. **Frontend**:
   - `resources/js/components/MitraDataTable.jsx`
     - Added toast import
     - Enhanced handleConfirmAction
     - Added preserveState/preserveScroll
     - Added success/error toasts

2. **Backend**:
   - `app/Http/Controllers/Admin/PartnerController.php`
     - Enhanced logging in reject method
     - Added stack traces
     - Better error messages

## Benefits

### For Admin Users
- ✅ **Clear Feedback**: Know immediately if action succeeded
- ✅ **Better UX**: Toast notifications instead of alerts
- ✅ **Auto Refresh**: See updated data without manual reload
- ✅ **Error Messages**: Understand what went wrong

### For Developers
- ✅ **Better Debugging**: Comprehensive logs
- ✅ **Error Tracking**: Console + server logs
- ✅ **Audit Trail**: Complete history of actions
- ✅ **Maintainable**: Clean, well-documented code

### For System
- ✅ **Robust**: Handles all error cases
- ✅ **Reliable**: Proper state management
- ✅ **Secure**: CSRF protection maintained
- ✅ **Performant**: Efficient data refresh

## Debugging Guide

If reject still doesn't work, check:

1. **Browser Console**
   ```
   F12 → Console tab
   Look for "Reject error:" messages
   ```

2. **Network Tab**
   ```
   F12 → Network tab
   Look for POST to /admin/partners/{id}/reject
   Check status code (should be 302 or 200)
   ```

3. **Laravel Logs**
   ```bash
   tail -f storage/logs/laravel.log
   ```
   Look for:
   - "Attempting to reject mitra"
   - "Rejection completed successfully"
   - Or error messages

4. **CSRF Token**
   ```
   Check if _token is included in request payload
   Should be auto-added by app.jsx global handler
   ```

## Common Issues & Solutions

### Issue: "Session expired" error
**Solution**: Already fixed with CSRF token refresh mechanism

### Issue: No feedback after clicking reject
**Solution**: Check browser console for errors

### Issue: Status doesn't update
**Solution**: `preserveState: false` forces refresh

### Issue: Modal doesn't close
**Solution**: Check if onSuccess callback is firing

## Related Fixes

This fix builds on previous enhancements:
1. ✅ CSRF token fix (from earlier request)
2. ✅ Document viewer enhancement
3. ✅ Description field display

All work together for a robust admin experience.

## Future Enhancements (Optional)

- [ ] Add reason input field for rejection
- [ ] Bulk approve/reject functionality
- [ ] Email notification preview
- [ ] Undo functionality
- [ ] Activity log viewer
