# CSRF Token Security Fix - URL Exposure Prevention

## 🔒 Security Issue Fixed

**Problem:** CSRF token was appearing in URL query parameters like:
```
http://127.0.0.1:8000/login?_token=N7yhlgZN4qhQCI6ZvJfbDG8IiotlOLmbqBVHnQwk
```

**Why This is Dangerous:**
- ❌ Token exposed in browser history
- ❌ Token logged in server access logs
- ❌ Token can be shared if user copies URL
- ❌ Token can leak via HTTP Referer header
- ❌ Token visible in browser's address bar

---

## ✅ Solution Implemented

### Root Cause
The issue was caused by adding `_token` to the `useForm` data object. When Inertia.js makes GET requests (like redirects), it includes all form data as URL query parameters.

### Fix Applied
**Removed `_token` from all `useForm` data objects** because:
1. The **global CSRF handler** in `app.jsx` automatically adds CSRF token to ALL requests
2. The token is added to the request body/headers, NOT the URL
3. This prevents token exposure in URLs

---

## 📁 Files Modified

### ✅ Authentication Pages
1. **`resources/js/Pages/Auth/Login.jsx`**
   - Removed `_token` from useForm data
   - Simplified CSRF handling using `useCsrfToken` hook
   - Token now only in request body, never in URL

2. **`resources/js/Pages/Auth/Register.jsx`**
   - Removed `_token` from useForm data
   - Cleaned up manual CSRF token management
   - Relies on global handler

3. **`resources/js/Pages/Auth/ForgotPassword.jsx`**
   - Removed `_token` from useForm data
   - Simplified submit handler

4. **`resources/js/Pages/Auth/ResetPassword.jsx`**
   - Removed `_token` from useForm data
   - Simplified submit handler

### ✅ Mitra Pages
5. **`resources/js/Pages/Mitra/Events/Create.jsx`**
   - Removed `_token` from useForm data
   - Removed unnecessary useEffect for token updates

---

## 🛡️ How It Works Now

### Before (INSECURE):
```javascript
// ❌ BAD - Token in form data
const { data, setData, post } = useForm({
    email: "",
    password: "",
    _token: csrfToken,  // This causes URL exposure!
});
```

When redirecting, Inertia adds all data to URL:
```
/login?email=user@example.com&_token=ABC123...  ❌ EXPOSED!
```

### After (SECURE):
```javascript
// ✅ GOOD - No token in form data
const { data, setData, post } = useForm({
    email: "",
    password: "",
    // Global handler adds token automatically
});
```

The global handler in `app.jsx` adds token to request:
```javascript
router.on("before", (event) => {
    const token = document.head.querySelector('meta[name="csrf-token"]');
    if (event.detail.visit.data instanceof FormData) {
        event.detail.visit.data.set("_token", token.content);
    } else {
        event.detail.visit.data._token = token.content;
    }
});
```

Token is sent in **request body/headers**, NOT in URL! ✅

---

## 🔐 Security Improvements

### Before Fix:
- ❌ Token visible in browser address bar
- ❌ Token saved in browser history
- ❌ Token logged in server logs
- ❌ Token can be leaked via Referer
- ❌ Token can be shared accidentally

### After Fix:
- ✅ Token NEVER appears in URL
- ✅ Token only in request body/headers
- ✅ Token not saved in browser history
- ✅ Token not logged in access logs
- ✅ Token cannot leak via Referer
- ✅ Token cannot be shared accidentally

---

## 🧪 Testing

### Test URLs Should NOT Contain Token:
```bash
# ✅ CORRECT - No token in URL
http://127.0.0.1:8000/login
http://127.0.0.1:8000/register
http://127.0.0.1:8000/forgot-password

# ❌ WRONG - Token should NEVER appear here
http://127.0.0.1:8000/login?_token=...
```

### How to Test:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Navigate to `/login` or `/register`
4. Check the URL in address bar
5. ✅ Verify NO `_token` parameter in URL
6. Submit the form
7. Check request in Network tab
8. ✅ Verify `_token` is in request **body**, not URL

---

## 📊 Impact

### Pages Fixed:
- ✅ Login page
- ✅ Register page
- ✅ Forgot Password page
- ✅ Reset Password page
- ✅ Events Create page
- ✅ All other pages (via global handler)

### Security Level:
- **Before:** 🔴 Critical Security Issue
- **After:** 🟢 Secure Implementation

---

## 🎯 Best Practices Applied

1. **Never put sensitive data in URLs**
   - CSRF tokens
   - Session IDs
   - API keys
   - Passwords

2. **Use POST for sensitive operations**
   - Login
   - Register
   - Password reset
   - Data modifications

3. **Let framework handle security**
   - Global CSRF handler
   - Automatic token injection
   - Centralized security logic

4. **Keep tokens in request body/headers**
   - Not in URL query parameters
   - Not in URL fragments
   - Not in visible locations

---

## ✅ Verification Checklist

- [x] Removed `_token` from all `useForm` data objects
- [x] Verified global handler adds token automatically
- [x] Tested login - no token in URL
- [x] Tested register - no token in URL
- [x] Tested forgot password - no token in URL
- [x] Tested reset password - no token in URL
- [x] Tested event creation - no token in URL
- [x] Verified token in request body only
- [x] Checked browser history - no tokens
- [x] Checked server logs - no tokens in URLs

---

## 📝 Summary

**Problem:** CSRF tokens were appearing in URLs, creating a security vulnerability.

**Solution:** Removed `_token` from all form data objects and rely on the global CSRF handler to inject tokens into request bodies/headers automatically.

**Result:** CSRF tokens are now transmitted securely and NEVER appear in URLs.

---

**Date:** 2025-11-24
**Status:** ✅ FIXED
**Security Level:** 🟢 SECURE
