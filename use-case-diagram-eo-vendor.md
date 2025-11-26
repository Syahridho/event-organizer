@startuml
!theme plain
left to right direction

' ==========================
' KONFIGURASI TAMPILAN
' ==========================
skinparam defaultFontName "Serif"
skinparam actorStyle awesome
skinparam usecase {
BackgroundColor #FFFFFF
BorderColor #000000
FontName "Serif"
}
skinparam note {
BackgroundColor #FFFFEE
BorderColor #000000
FontName "Serif"
}
skinparam rectangle {
FontName "Serif"
}
skinparam ArrowFontName "Serif"

' ==========================
' DEFINISI AKTOR
' ==========================
actor Admin as admin
actor Mitra as vendor
actor Pengguna as pengguna

' ==========================
' SISTEM UTAMA
' ==========================
rectangle "Sistem EO–Vendor" {
usecase "Registrasi Akun" as UC1
usecase "Login" as UC2
usecase "Pemesanan Layanan Vendor" as UC3
usecase "Pembayaran Midtrans" as UC4
usecase "Ulasan dan Rating" as UC5
usecase "Validasi Vendor" as UC6
usecase "Moderasi Konten" as UC7
usecase "Manajemen Event" as UC8
usecase "Manajemen Layanan" as UC9
usecase "Manajemen Profil" as UC10
usecase "Dashboard Admin" as UC11
usecase "Laporan Transaksi" as UC12
usecase "Notifikasi Sistem" as UC13
usecase "Pencarian Layanan" as UC14
usecase "Kelola Jadwal" as UC15
}

' ==========================
' HUBUNGAN AKTOR - USE CASE
' ==========================
admin --> UC2
admin --> UC6
admin --> UC7
admin --> UC11
admin --> UC12

vendor --> UC1
vendor --> UC2
vendor --> UC9
vendor --> UC10
vendor --> UC15
vendor --> UC13

pengguna --> UC1
pengguna --> UC2
pengguna --> UC3
pengguna --> UC4
pengguna --> UC5
pengguna --> UC10
pengguna --> UC13
pengguna --> UC14

' ==========================
' HUBUNGAN ANTAR USE CASE
' ==========================
UC3 --> UC4 : <<include>>
UC3 --> UC5 : <<extend>>
UC8 --> UC3 : <<include>>
UC9 --> UC6 : <<include>>

' ==========================
' GENERALIZATION & CATATAN
' ==========================
UC1 <|-- UC2 : <<extend>>

note right of UC6 : "Admin memvalidasi\nvendor yang terdaftar"
note right of UC7 : "Admin melakukan\nmoderasi konten"
note left of UC3 : "Pengguna memesan\nlayanan vendor"
note left of UC4 : "Integrasi dengan\npayment gateway"
note left of UC5 : "Pengguna memberikan\nulasan setelah layanan"

@enduml
