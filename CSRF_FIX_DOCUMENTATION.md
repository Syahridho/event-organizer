# CSRF Token Error Fix - Partner Registration

## Problem
Ada error CSRF token yang muncul di Step 2 (/partner/register) dengan pesan:
```
csrf: "Your session has expired. Please refresh the page and try again."
```

## Root Cause
1. Ketika user menyelesaikan Step 1 (registrasi akun), Laravel meregenerasi session
2. Session regeneration menyebabkan CSRF token lama menjadi invalid
3. Step 2 (form partner) tidak me-refresh CSRF token sebelum submit
4. Server menolak request karena CSRF token sudah expired

## Solution (Algoritma Tercepat)

### 1. Enhanced `useCsrfToken` Hook
**File**: `resources/js/hooks/useCsrfToken.js`

- Mengubah `refreshToken()` menjadi **async function**
- Fetch CSRF token baru dari server endpoint `/csrf-token` sebelum form submission
- Update meta tag dan state dengan token terbaru
- Fallback ke meta tag jika fetch gagal

**Keuntungan**:
- Token selalu fresh sebelum submit
- Mencegah race condition
- Automatic retry mechanism

### 2. Updated Step1RegisterAccount
**File**: `resources/js/Pages/User/Mitra/Index.jsx`

- Import `useCsrfToken` hook
- Gunakan `await refreshToken()` sebelum submit
- Handle CSRF error dengan refresh token otomatis

### 3. Updated Step2PartnerForm
**File**: `resources/js/Pages/User/Mitra/Index.jsx`

- Import `useCsrfToken` hook
- Gunakan `await refreshToken()` sebelum submit
- Tampilkan error message yang lebih jelas untuk CSRF error
- Auto-refresh token jika terjadi CSRF error

### 4. Updated Register.jsx
**File**: `resources/js/Pages/Auth/Register.jsx`

- Konsistensi dengan pattern yang sama
- Async submit dengan await refreshToken()

## Technical Flow

```
User fills form → Submit button clicked
    ↓
Async submit handler triggered
    ↓
await refreshToken() - Fetch fresh token from /csrf-token endpoint
    ↓
Update meta tag with new token
    ↓
Global handler in app.jsx adds token to request data
    ↓
POST request sent with fresh CSRF token
    ↓
✅ Success OR ❌ CSRF Error
    ↓ (if CSRF error)
Auto refresh token & show user-friendly message
```

## Key Changes Summary

1. **useCsrfToken.js**: 
   - `refreshToken()` now async and fetches from server
   
2. **User/Mitra/Index.jsx**:
   - Step1: Added `useCsrfToken` hook + async submit
   - Step2: Added `useCsrfToken` hook + async submit + better error handling
   
3. **Auth/Register.jsx**:
   - Async submit with await refreshToken()

## Testing Checklist

- [ ] Step 1: Register new account → Should work without CSRF error
- [ ] Step 2: Submit partner form → Should work without CSRF error
- [ ] Regular registration page → Should work without CSRF error
- [ ] Error handling: Force CSRF error → Should show proper message and auto-refresh token

## Why This is the Fastest Solution

1. **No Backend Changes**: Hanya perlu update frontend code
2. **Reuses Existing Infrastructure**: Menggunakan endpoint `/csrf-token` yang sudah ada
3. **Minimal Code Changes**: Hanya 4 file yang diubah
4. **Automatic**: User tidak perlu refresh page manual
5. **Robust**: Handle edge cases dengan fallback mechanism

## Prevention

Perubahan ini juga mencegah CSRF error di masa depan karena:
- Token selalu di-refresh sebelum setiap form submission
- Auto-recovery jika terjadi CSRF error
- Consistent pattern across all forms
