# OTP (One-Time Password) Implementation Documentation

## Overview

Fitur OTP telah diaktifkan kembali di aplikasi Event Organizer dengan algoritma yang lebih cepat dan ringan. Implementasi ini menggunakan cache untuk rate limiting dan verifikasi yang lebih efisien.

## Fitur yang Diimplementasikan

### 1. OTP Controller (`app/Http/Controllers/Auth/OtpController.php`)

-   **send()**: Mengirim OTP ke email user
-   **verify()**: Verifikasi OTP yang dimasukkan user
-   **resend()**: Mengirim ulang OTP dengan rate limiting
-   **showVerificationPage()**: Menampilkan halaman verifikasi OTP

### 2. Routes (`routes/auth.php`)

-   `POST /otp/send` - Mengirim OTP
-   `GET /otp/verify` - Menampilkan halaman verifikasi
-   `POST /otp/verify` - Verifikasi OTP
-   `POST /otp/resend` - Mengirim ulang OTP

### 3. Model & Migration

-   **OtpToken Model** (`app/Models/OtpToken.php`) - Sudah ada
-   **Migration** (`database/migrations/2025_07_09_210055_create_otp_tokens_table.php`) - Sudah ada

### 4. Email Notification

-   **OtpMail** (`app/Mail/OtpMail.php`) - Mailable class untuk OTP
-   **Email Template** (`resources/views/emails/otp.blade.php`) - Template email yang diperbaiki

### 5. Integrasi dengan Auth Flow

-   **Registrasi** (`app/Http/Controllers/Auth/RegisteredUserController.php`) - User diarahkan ke verifikasi OTP setelah registrasi
-   **Login** (`app/Http/Controllers/Auth/AuthenticatedSessionController.php`) - User perlu verifikasi email jika belum verified

## Optimasi yang Dilakukan

### 1. Penggunaan Cache

-   Rate limiting menggunakan cache instead of database queries
-   Verifikasi OTP lebih cepat dengan cache lookup
-   Mengurangi beban database

### 2. Efficient OTP Generation

-   Menggunakan `sprintf('%06d', random_int(0, 999999))` instead of `str_pad()`
-   Lebih cepat dan lebih sedikit memory usage

### 3. Queue untuk Email

-   Menggunakan queue untuk mengirim email (`Mail::to($email)->queue()`)
-   Tidak blocking request saat mengirim email
-   Lebih responsif untuk user

### 4. Rate Limiting yang Lebih Baik

-   Mencegah spam dengan cache-based rate limiting
-   Membatasi percobaan OTP (max 3 attempts)
-   TTL (Time To Live) yang jelas untuk cache

### 5. Error Handling yang Lebih Baik

-   Logging error yang lebih detail
-   Response yang lebih informatif
-   Status code HTTP yang tepat (400, 429, 500)

## Cara Penggunaan

### 1. Registrasi User Baru

1. User mengisi form registrasi
2. Setelah registrasi berhasil, OTP dikirim ke email user
3. User diarahkan ke halaman `/otp/verify?email=user@example.com`
4. User memasukkan OTP yang diterima via email
5. Setelah verifikasi berhasil, user dapat login

### 2. Login User Existing

1. User login dengan email dan password
2. Jika email belum verified, user diarahkan ke halaman OTP
3. OTP dikirim ke email user
4. User memasukkan OTP untuk verifikasi
5. Setelah verifikasi berhasil, user dapat melanjutkan login

### 3. Resend OTP

-   User dapat meminta ulang OTP dari halaman verifikasi
-   Rate limiting: 1 menit antara request
-   Maksimal 3 percobaan untuk setiap OTP

## Konfigurasi Environment

Pastikan environment variables berikut sudah diatur di `.env`:

```env
# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@eventorganizer.com
MAIL_FROM_NAME="Event Organizer"

# Cache Configuration (untuk optimasi OTP)
CACHE_DRIVER=redis  # atau file, database, dll
```

## Testing

### 1. Testing Registrasi dengan OTP

1. Buka halaman registrasi
2. Isi form dengan email yang valid
3. Periksa email untuk OTP
4. Kunjungi halaman OTP yang dikirim
5. Masukkan OTP dan verifikasi

### 2. Testing Login dengan OTP

1. Login dengan user yang sudah terdaftar tapi email belum verified
2. Pastikan diarahkan ke halaman OTP
3. Ikuti proses verifikasi

### 3. Testing Rate Limiting

1. Minta OTP beberapa kali dalam waktu singkat
2. Pastikan rate limiting berfungsi (tunggu 1 menit)
3. Coba OTP salah 3+ kali
4. Pastikan diblokir dan perlu minta OTP baru

## Troubleshooting

### 1. OTP Tidak Diterima

-   Periksa konfigurasi mail di `.env`
-   Periksa log Laravel: `php artisan log:tail`
-   Pastikan queue worker berjalan: `php artisan queue:work`

### 2. Rate Limiting Tidak Berfungsi

-   Pastikan cache driver sudah dikonfigurasi dengan benar
-   Restart cache service jika perlu

### 3. Performance Issues

-   Pastikan Redis atau cache driver yang cepat sudah dikonfigurasi
-   Monitor query performance dengan Laravel Debugbar atau Telescope

## Security Considerations

1. **OTP Expiration**: OTP kadaluarsa setelah 10 menit
2. **Rate Limiting**: Mencegah brute force attack
3. **Attempt Limiting**: Maksimal 3 percobaan per OTP
4. **Secure Random Generation**: Menggunakan `random_int()` yang cryptographically secure
5. **No OTP Reuse**: OTP dihapus setelah digunakan atau kadaluarsa

## Future Improvements

1. **SMS OTP**: Implementasi OTP via SMS untuk tanpa email
2. **TOTP**: Time-based One-Time Password dengan Google Authenticator
3. **Biometric**: Integrasi dengan fingerprint/face ID
4. **Push Notification**: OTP via push notification untuk mobile app
