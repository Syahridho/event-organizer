@startuml
left to right direction
skinparam usecase {
BackgroundColor #FAFAFA
BorderColor #555
}
skinparam actorStyle awesome

actor "Visitor/Guest" as Guest
actor "User (Member)" as User
actor "Mitra (Partner)" as Mitra
actor "Admin" as Admin

actor "Midtrans" as Midtrans <<external>>
actor "RajaOngkir" as RajaOngkir <<external>>
actor "Email Provider" as Email <<external>>
actor "Soketi (Realtime WS)" as Soketi <<external>>

User <|-- Mitra
User <|-- Admin

rectangle "mmsDocs" {
package "Auth & Keamanan" {
(Registrasi Akun) as UC_Register
(Login) as UC_Login
(Logout) as UC_Logout
(Verifikasi Email) as UC_VerifikasiEmail
(Lupa/Reset Password) as UC_ResetPassword
}

package "Navigasi & Pencarian" {
(Lihat Katalog/Listing) as UC_Browse
(Pencarian) as UC_Search
(Lihat Detail Item) as UC_ViewItem
(Lihat Profil Mitra) as UC_ViewMitra
(Lihat Halaman Informasi) as UC_InfoPages
}

package "Keranjang, Booking & Pesanan" {
(Kelola Keranjang) as UC_Cart
(Kelola Alamat Pengiriman) as UC_Address
(Hitung Ongkir) as UC_ShippingCost
(Validasi Stok/Slot) as UC_ValidateStock
(Pilih Metode Pembayaran) as UC_PilihMetodeBayar
(Checkout) as UC_Checkout
(Buat Pesanan) as UC_CreateOrder
(Kelola Pesanan/Pembelian) as UC_Orders
}

package "Pembayaran" {
(Inisiasi Pembayaran) as UC_PaymentInit
(Pembayaran via Midtrans) as UC_PayMidtrans
(Cek Status Transaksi) as UC_PaymentStatus
(Batalkan Transaksi) as UC_PaymentCancel
(Terima Webhook Midtrans) as UC_MidtransWebhook
(Refund/Partial Refund) as UC_PaymentRefund
}

package "Dokumen/Media" {
(Unggah Dokumen/Media) as UC_UploadMedia
}

package "Chat & Notifikasi" {
(Kirim/Pantau Pesan) as UC_Chat
(Berlangganan Kanal Realtime) as UC_RealtimeSub
(Kirim Notifikasi (Email/SMS/Push)) as UC_SendNotification
(Kelola Notifikasi) as UC_ManageNotification
}

package "Mitra/Partner" {
(Onboarding Mitra) as UC_MitraOnboard
(Kelola Produk/Layanan) as UC_MitraProduct
(Kelola Ketersediaan/Jadwal) as UC_MitraAvailability
(Proses Pesanan) as UC_MitraFulfill
(Kelola Penarikan Dana) as UC_MitraWithdraw
}

package "Profil & Preferensi" {
(Kelola Profil & Preferensi) as UC_Profile
(Kelola Wallet) as UC_Wallet
(Kelola Ulasan) as UC_Review
}

package "Admin" {
(Kelola Pengguna & Peran) as UC_AdminUsers
(Moderasi Konten/Ulasan) as UC_AdminModeration
(Kelola Mitra) as UC_AdminPartners
(Kelola Pengaturan & Pajak) as UC_AdminSettings
(Kelola Penarikan) as UC_AdminWithdraw
(Kelola Testimoni) as UC_AdminTestimonials
(Chat Admin) as UC_AdminChat
(Laporan & Analitik) as UC_Reports
}
}

' Relasi Aktor -> Use Case
Guest --> UC_Register
Guest --> UC_Login
Guest --> UC_Browse
Guest --> UC_Search
Guest --> UC_ViewItem
Guest --> UC_ViewMitra
Guest --> UC_InfoPages

User --> UC_Logout
User --> UC_ResetPassword
User --> UC_Browse
User --> UC_Search
User --> UC_ViewItem
User --> UC_ViewMitra
User --> UC_Cart
User --> UC_Address
User --> UC_Checkout
User --> UC_CreateOrder
User --> UC_Orders
User --> UC_PayMidtrans
User --> UC_PaymentStatus
User --> UC_PaymentCancel
User --> UC_Profile
User --> UC_Wallet
User --> UC_Review
User --> UC_Chat
User --> UC_RealtimeSub
User --> UC_ManageNotification

Mitra --> UC_MitraOnboard
Mitra --> UC_MitraProduct
Mitra --> UC_MitraAvailability
Mitra --> UC_MitraFulfill
Mitra --> UC_MitraWithdraw
Mitra --> UC_Chat
Mitra --> UC_RealtimeSub
Mitra --> UC_Reports

Admin --> UC_AdminUsers
Admin --> UC_AdminModeration
Admin --> UC_AdminPartners
Admin --> UC_AdminSettings
Admin --> UC_AdminWithdraw
Admin --> UC_AdminTestimonials
Admin --> UC_AdminChat
Admin --> UC_Reports

' Integrasi Eksternal
Midtrans --> UC_PayMidtrans
Midtrans --> UC_MidtransWebhook
Midtrans --> UC_PaymentStatus
Midtrans --> UC_PaymentRefund

RajaOngkir --> UC_ShippingCost

Email --> UC_VerifikasiEmail
Email --> UC_SendNotification

Soketi --> UC_Chat
Soketi --> UC_RealtimeSub

' Include / Extend sesuai mmsDocs
UC_Checkout .> UC_ShippingCost : <<include>>
UC_Checkout .> UC_ValidateStock : <<include>>
UC_Checkout .> UC_PilihMetodeBayar : <<include>>
UC_PayMidtrans .> UC_PaymentInit : <<include>>
UC_PayMidtrans ..> UC_PaymentRefund : <<extend>>
UC_CreateOrder .> UC_SendNotification : <<include>>
UC_VerifikasiEmail ..> UC_Register : <<extend>>
UC_MitraProduct .> UC_UploadMedia : <<include>>
UC_AdminModeration ..> UC_Review : <<extend>>

' Catatan Webhook/Async
note right of UC_MidtransWebhook
Dipicu oleh webhook Midtrans
end note

note right of UC_SendNotification
Dapat dijalankan via queue/scheduler
end note

note right of UC_RealtimeSub
Menggunakan Soketi (Pusher protocol) untuk WebSocket
end note

@enduml
