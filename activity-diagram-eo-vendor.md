# Activity Diagram Proses Bisnis Sistem EO-Vendor

```plantuml
@startuml
!theme plain
title Activity Diagram Proses Bisnis EO-Vendor

start

:Login ke Sistem;
if (Kredensial Valid?) then (ya)
  :Menuju Dashboard;
else (tidak)
  :Tampilkan Pesan Error;
  :Kembali ke Halaman Login;
endif

:Jelajahi Daftar Vendor;
if (Ingin Mencari Vendor Spesifik?) then (ya)
  :Gunakan Fitur Pencarian;
  :Filter Berdasarkan Kategori/Lokasi;
  :Tampilkan Hasil Pencarian;
else (tidak)
  :Lihat Semua Vendor Tersedia;
endif

:Pilih Vendor;
:Lihat Detail Profil Vendor;
:Lihat Layanan yang Ditawarkan;
:Lihat Rating dan Ulasan Sebelumnya;

if (Ingin Melanjutkan Pemesanan?) then (ya)
  :Pilih Layanan yang Diinginkan;
  :Tentukan Tanggal dan Waktu;
  :Isi Form Pemesanan;
  :Konfirmasi Detail Pesanan;
else (tidak)
  :Kembali ke Daftar Vendor;
endif

:Proses ke Pembayaran;
if (Metode Pembayaran = Midtrans?) then (ya)
  :Redirect ke Halaman Midtrans;
  :Pilih Metode Pembayaran (Transfer/E-Wallet/CC);
  :Masukkan Detail Pembayaran;
  :Proses Pembayaran;
else (tidak)
  :Pilih Metode Lain;
endif

if (Pembayaran Berhasil?) then (ya)
  :Generate Invoice;
  :Kirim Konfirmasi Email;
  :Update Status Pesanan;
  :Tampilkan Halaman Sukses;
else (tidak)
  :Tampilkan Pesan Gagal;
  :Tawarkan Opsi Coba Lagi;
endif

:Tunggu Jadwal Layanan;
:Terima Notifikasi Pengingat;
:Layanan Dilaksanakan;

if (Layanan Selesai?) then (ya)
  :Tampilkan Form Ulasan dan Rating;
  :Beri Rating (1-5 Bintang);
  :Tulis Ulasan Text;
  :Upload Foto/Video (Opsional);
  :Submit Ulasan;
else (tidak)
  :Laporkan Masalah;
  :Hubungi Customer Service;
endif

:Ulasan Ditampilkan di Profil Vendor;
:Update Rating Vendor;
:Kirim Notifikasi ke Vendor;

stop

note right of :Pilih Vendor;
  **Kriteria Pemilihan:**
  - Rating
  - Harga
  - Lokasi
  - Ketersediaan
end note

note right of :Proses ke Pembayaran;
  **Integrasi Midtrans:**
  - Virtual Account
  - E-Wallet
  - Credit Card
  - QRIS
end note

note right of :Tampilkan Form Ulasan dan Rating;
  **Komponen Ulasan:**
  - Rating Bintang
  - Komentar Text
  - Media Upload
  - Rekomendasi
end note

@enduml
```
