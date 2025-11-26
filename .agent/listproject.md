# List Proyek (Produk Akhir Penelitian)

Produk akhir dari penelitian ini berupa sistem web yang mengintegrasikan:

1. Penjualan tiket acara online
2. Penyewaan jasa vendor
3. Penyewaan gedung dan properti
4. Transaksi otomatis dengan Midtrans Payment Gateway
5. Dashboard kolaborasi berbasis Inertia React, Tailwind, dan shadcn/UI
6. Manajemen database MySQL yang terstruktur pada entitas pengguna, event, transaksi, dan ulasan

## Fitur Tambahan yang Sudah Tersedia di Proyek

-   Autentikasi dan verifikasi pengguna (Login, Register, Lupa Password, Reset Password, OTP, Verifikasi Email)
-   Manajemen profil dan dompet (Profile &amp; Wallet)
-   Keranjang belanja dan proses Checkout
-   Integrasi Midtrans lanjutan: pembuatan token pembayaran, callback status, halaman status pembayaran, pembatalan transaksi, tagihan biaya antar (delivery fee) terpisah per item
-   Manajemen alamat pengiriman (CRUD, set default) dengan integrasi RajaOngkir (provinsi/kota/kecamatan)
-   Notifikasi (daftar notifikasi, tandai dibaca, tandai semua dibaca)
-   Chat realtime berbasis Soketi (Pusher protocol) untuk Admin, Mitra, dan Pengguna
-   Dashboard Admin:
    -   Pengaturan sistem termasuk pajak
    -   Moderasi/banned Event, Service, Building, Rent
    -   Manajemen testimoni dan mitra/partner (review, approve/reject, lihat/unduh dokumen PDF)
    -   Manajemen penarikan dana (withdraw) dan verifikasi
    -   Chat Admin
    -   Laporan Kehadiran Event (Attendance) termasuk ekspor PDF/Excel
-   Dashboard Mitra (Vendor):
    -   CRUD Event, Service, Building, Rent Property
    -   Manajemen transaksi per item (confirm, cancel, otw, process, work, complete)
    -   Notifikasi dan Chat
    -   Manajemen Cuti/Ketersediaan (Leave) termasuk toggle mingguan dan bulk
    -   Pengajuan penarikan dana (withdraw)
-   Riwayat pembelian (Purchase) dengan tab status (unpaid, paid, shipped, completed, cancelled)
-   Tiket dan ketersediaan: cek ketersediaan dan kuota tiket; deteksi sold-out; validasi tanggal untuk layanan/gedung/properti
-   Pencarian dan halaman Listing (events, services, buildings, property)
-   Halaman konten umum (Terms, Maintenance, Error, Welcome)
-   Pembayaran pengantaran/pengambilan untuk properti (delivery/pickup) + pembuatan invoice biaya antar via Midtrans
-   Email OTP dan template PDF viewer untuk dokumen
-   Komponen UI lengkap (Inertia React, Tailwind, shadcn/UI) untuk form, dialog, tabel, sidebar, toast/sonner

## Fitur Tambahan yang Belum Tercantum (Ditambahkan)

-   Pendaftaran event gratis (subtotal Rp 0) tanpa Midtrans pada alur checkout
-   Ulasan dan rating (review &amp; rating) untuk transaksi dan produk
-   Input lokasi dan pemilihan koordinat dengan peta (location picker &amp; location input with map)
-   Kalender jadwal, kalender hari libur, dan pemilihan waktu (custom calendar, holiday calendar, calendar with time)
-   Ringkasan pembayaran dan lembar pembayaran di frontend (Payment Summary &amp; Payment Sheet)
-   Halaman Status Pembayaran dengan informasi Virtual Account dan Mandiri Bill (VA Number, Biller Code, Bill Key)
-   Pembatalan transaksi oleh pengguna (cancel order dari halaman Purchase)
-   Pengajuan penarikan dana oleh pengguna (Profile &gt; Withdraw)

## Fitur Lain yang Ditemukan di Proyek (Ditambahkan)

-   Halaman profil Mitra publik (akses profil mitra via URL username)
-   Pemeriksaan status transaksi Midtrans (cek status pembayaran per Order ID)
-   Pembaruan opsi pengiriman di keranjang (pickup/delivery) sebelum checkout
-   Status online/presence pengguna pada chat (indikator online realtime via Soketi)
-   Countdown waktu acara (komponen hitung mundur)
-   Penghapusan foto profil pengguna (hapus foto di halaman profil)
-   Halaman detail transaksi/pembelian (Purchase detail view)
-   Laporan Kehadiran Event (Attendance) untuk Mitra (tampilan kehadiran per event di dashboard Mitra)
