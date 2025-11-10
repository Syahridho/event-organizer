# Blueprint Skripsi: Event Marketplace Indonesia (Laravel + Inertia React)

Dokumen ini merumuskan analisis kesenjangan fitur, usulan pengembangan, rancangan arsitektur, non-fungsional, integrasi, pengujian, dan roadmap untuk platform marketplace event yang menggabungkan penjualan tiket, penyewaan jasa vendor, penyewaan venue/properti, serta pembayaran otomatis melalui Midtrans. Fokus pada nilai akademik, kebaruan, dan kompleksitas yang layak untuk skripsi.

## 1. Cakupan Saat Ini (Ringkas) dan Kesenjangan

Cakupan saat ini mencakup: autentikasi, listing event/vendor/venue, keranjang, checkout, integrasi pembayaran Midtrans (token, callback, status), alamat dan ongkir via RajaOngkir, notifikasi dasar, chat realtime dengan Soketi, dashboard Admin dan Mitra, ulasan dan rating, pembatalan, wallet untuk refund, serta purchase tabs.

Kesenjangan utama terhadap target marketplace komprehensif:

-   Tata kelola tiket lanjut: pemetaan kursi interaktif, tier harga dinamis, kuota per tier, antrian dan waiting list, transfer/resell aman, voucher, bundling, gift card, check-in offline QR, badge, sertifikat kehadiran.
-   Marketplace vendor end-to-end: RFQ dan negosiasi, chat terintegrasi ke pesanan, kontrak dan e-signature, escrow dan pembayaran bertahap, payout terjadwal, verifikasi KYC, rating dengan moderasi.
-   Manajemen venue: kalender ketersediaan real-time, deposit dan kebijakan pembatalan, penanganan sengketa, inventaris fasilitas dan perlengkapan, integrasi peta, denah, dan tur virtual.
-   Event hybrid: integrasi Zoom, Google Meet, atau YouTube Live termasuk distribusi akses dan pelacakan kehadiran online.
-   Marketing dan growth: kampanye email dan WhatsApp, push notification, UTM tracking, referral dan afiliasi, promosi, kupon, dynamic pricing, rekomendasi personalisasi.
-   Konten dan CMS: halaman statis, blog, FAQ, knowledge base.
-   Keuangan dan perpajakan: laporan operasional dan keuangan, rekonsiliasi dan settlement, PPN, eFaktur, NPWP dan identitas hukum.
-   Pencarian tingkat lanjut: filter geospasial, saran cerdas, indexing dengan Meilisearch atau Elasticsearch.
-   Non-fungsional: kepatuhan UU PDP, praktik PCI-DSS, enkripsi, RBAC granular, audit log, rate limiting, observabilitas, performa dan skalabilitas.

## 2. Usulan Fitur Tambahan Bernilai Skripsi

2.1 Tata Kelola Tiket Lanjut

-   Pemetaan kursi interaktif per venue, dukungan tier harga dan kuota per sektor, dynamic pricing berdasarkan permintaan dan waktu.
-   Antrian dan waiting list ketika sold out; pemberitahuan otomatis jika kuota terbuka.
-   Transfer dan resell tiket yang aman (dengan escrow dan batasan anti-fraud).
-   Voucher, bundling paket, dan gift card dengan tanggal kedaluwarsa dan aturan stacking.
-   Check-in on-site dengan QR tahan offline, sinkronisasi ketika online, cetak badge, sertifikat kehadiran.

    2.2 Marketplace Vendor End-to-End

-   RFQ dan negosiasi, lampiran berkas, penawaran multi-tahap.
-   Kontrak dan e-signature, arsip legal, audit trail.
-   Escrow dan pembayaran bertahap (milestone), dispute resolution, payout terjadwal.
-   KYC vendor, verifikasi legal dan kepatuhan, rating dengan moderasi.

    2.3 Manajemen Venue

-   Kalender ketersediaan real-time, aturan deposit dan pembatalan.
-   Inventaris fasilitas, layout dan denah tempat, tur virtual.
-   Penanganan sengketa dan jaminan.

    2.4 Event Hybrid

-   Integrasi Zoom, Google Meet, YouTube Live; manajemen akses dan pelacakan kehadiran online.

    2.5 Marketing dan Pertumbuhan

-   Kampanye email dan WhatsApp, push notification berbasis segmentasi dan event.
-   Referral dan afiliasi, kupon, promo terjadwal, dynamic pricing.
-   Rekomendasi personalisasi berbasis data.

    2.6 Konten dan CMS

-   Halaman statis, blog, FAQ, knowledge base dengan editor kaya, preview, dan versi.

    2.7 Keuangan dan Perpajakan

-   Laporan operasional dan keuangan, rekonsiliasi otomatis, settlement.
-   PPN, eFaktur, manajemen NPWP dan entitas hukum.

    2.8 Pencarian Lanjut

-   Meilisearch atau Elasticsearch untuk pencarian cepat, saran cerdas, dan filter geospasial.

    2.9 Observabilitas dan Keamanan

-   Logging terstruktur, tracing, metrics, alerting.
-   RBAC granular, audit log menyeluruh, rate limiting, anti-abuse.

Catatan akademik: fitur-fitur ini membuka ruang eksperimen pada antrian tiket dan dynamic pricing, desain idempotensi transaksi, konsistensi data offline-online, serta evaluasi kinerja search engine dan caching.

## 3. Tujuan Bisnis dan Teknis per Fitur (Ringkas)

-   Pemetaan kursi: meningkatkan pendapatan per kursi premium; teknis: model seat map, locking kursi idempoten saat checkout, konsistensi stok.
-   Antrian dan waiting list: memaksimalkan konversi saat kuota terbuka; teknis: job queue, prioritas, notifikasi, TTL.
-   Transfer dan resell: memperluas pasar sekunder yang aman; teknis: escrow, verifikasi kepemilikan, re-issue barcode, pembatasan harga.
-   Voucher, bundling, gift card: meningkatkan AOV; teknis: engine promosi, aturan kombinasi, validasi pada server.
-   Check-in offline: kelancaran operasional; teknis: cache lokal terenkripsi, sinkronisasi konflik, toleransi duplikasi.
-   RFQ, kontrak, e-signature: meningkatkan kepercayaan; teknis: template kontrak, tanda tangan digital, audit trail.
-   Escrow dan payout: mitigasi risiko; teknis: dompet terpisah, pelepasan bertahap, rekonsiliasi otomatis.
-   Venue availability: menghindari double booking; teknis: kalender, locking rentang tanggal, indeks waktu.
-   Hybrid event: skalabilitas akses online; teknis: provisioning link, whitelisting peserta, pelacakan hadir.
-   Marketing: pertumbuhan; teknis: scheduler, segmentasi, tracking UTM, integrasi WhatsApp.
-   CMS: edukasi dan SEO; teknis: role-based publishing, preview, versioning.
-   Keuangan/perpajakan: compliance; teknis: hitung pajak, eFaktur, jurnal otomatis.
-   Pencarian: discovery; teknis: indeks denormal, analyzer bahasa Indonesia, geo-index.

## 4. Skenario Utama dan Edge Case (Contoh)

-   Seat locking: user memesan 5 menit, server memastikan lock unik per seat dan order; edge: timeout, refresh, multi-tab.
-   Waiting list: kuota terbuka karena pembayaran expired, sistem notifikasi batch; edge: race notifikasi, idempotensi klaim.
-   Transfer tiket: pembeli A mentransfer ke B, sistem revoke QR lama, terbitkan QR baru; edge: double-claim saat offline.
-   RFQ: buyer edit spesifikasi saat negosiasi berlanjut; edge: sinkron perubahan, versi penawaran.
-   Escrow: milestone gagal, sebagian refund; edge: rounding, biaya admin, chargeback.
-   Venue deposit: pembatalan H-3 kena penalti X%; edge: zona waktu, daylight saving di luar negeri.
-   Hybrid: link streaming bocor; edge: rate limiting akses, token sekali pakai.

## 5. Alur Pengguna per Peran

-   Admin: moderasi, pengaturan pajak, laporan, settlement, sengketa.
-   Penyelenggara event: kelola tiket, seat map, check-in, laporan.
-   Vendor: kelola RFQ, kontrak, milestone, payout.
-   Pemilik venue: kelola kalender, deposit, inventaris.
-   Pelanggan: cari, beli, antri, transfer, check-in.
-   Tim keuangan: rekonsiliasi, pajak, invoice.
-   Dukungan: moderasi ulasan, tangani sengketa.

## 6. Perubahan Skema Database (MySQL)

6.1 Tiket dan Seat Map

-   Tabel seats: id, venue_id, section, row, number, tier_id, status, created_at.
-   Tabel seat_maps: id, venue_id, version, json_layout, checksum, created_at.
-   Tabel ticket_tiers: id, event_id, name, base_price, quota, dynamic_rule_id, created_at.
-   Tabel seat_locks: id, seat_id, order_id, locked_until, user_id, status, created_at (indeks seat_id, locked_until).
-   Tabel vouchers: id, code unik, type, value, max_uses, per_user_limit, valid_from, valid_to, rules_json, created_at (indeks code, valid_to).
-   Tabel gift_cards: id, code, balance, currency, expires_at, purchaser_id, created_at.

    6.2 Marketplace Vendor

-   Tabel rfqs: id, buyer_id, category, spec_json, status, created_at.
-   Tabel rfq_offers: id, rfq_id, vendor_id, price, terms_json, status, version, created_at.
-   Tabel contracts: id, rfq_id atau order_id, vendor_id, file_path, signed_at, audit_json.
-   Tabel milestones: id, contract_id, name, amount, due_date, status.
-   Tabel escrows: id, order_id, balance, locked, released, currency.

    6.3 Venue

-   Tabel venue_availabilities: id, venue_id, start_at, end_at, rule, created_at (indeks range waktu).
-   Tabel venue_deposits: id, venue_id, policy_json, amount, currency.
-   Tabel equipments: id, venue_id, name, qty, spec_json.

    6.4 Hybrid dan Akses

-   Tabel virtual_accesses: id, event_id, user_id, provider, join_url, access_token_hash, expires_at, attendance_log_json.

    6.5 Marketing

-   Tabel campaigns: id, name, channel, audience_json, schedule_at, status.
-   Tabel referrals: id, user_id, code unik, referred_user_id, reward_status.
-   Tabel coupons: id, code, discount_type, discount_value, min_spend, valid_from, valid_to, usage_count.

    6.6 Observabilitas dan Audit

-   Tabel audit_logs: id, actor_id, actor_role, action, subject_type, subject_id, before_json, after_json, ip, ua, created_at (indeks actor, subject, waktu).
-   Tabel idempotency_keys: id, key unik, scope, request_hash, response_json, status, created_at (indeks key).

Catatan migrasi: gunakan migrasi bertahap backward compatible, tambahkan kolom nullable dahulu, isi data, lalu enforce constraint. Gunakan transaksi migrasi bila aman, dan hindari lock panjang pada tabel besar.

## 7. Antarmuka Layanan

Pola idempotensi: header Idempotency-Key pada permintaan mutasi; simpan hash body dan respons untuk deduplikasi.
Retry: exponential backoff dengan jitter; batas maksimal percobaan; semua handler harus idempoten.

Endpoint REST (contoh ringkas):

-   POST orders untuk membuat pesanan dengan voucher, seat, atau milestone.
-   POST seat-locks untuk lock kursi sementara.
-   POST transfers untuk transfer tiket; validasi kepemilikan dan biaya.
-   POST rfqs dan POST rfq-offers untuk negosiasi.
-   POST contracts untuk unggah dan tandatangan.
-   POST escrows/release untuk rilis escrow per milestone.
-   GET venues/{id}/availability untuk melihat ketersediaan.
-   POST campaigns/send untuk kirim kampanye terjadwal.

Webhook dan event:

-   Midtrans: callback pembayaran, verifikasi signature, update status order dan escrow, notifikasi.
-   Webhook internal: event order_paid, seat_released, refund_issued, payout_scheduled.

## 8. Komponen UI (Inertia React, Tailwind, shadcn)

-   SeatMapCanvas: pemilihan kursi, zoom, status (available, locked, sold), a11y dengan fokus dan ARIA.
-   TicketTierSelector: pilih tier, kuota dan harga; validasi kuantitas dan stok.
-   WaitingListDialog: daftar antrian, status dan SLA.
-   TransferTicketFlow: form validasi identitas penerima, biaya, ringkasan.
-   RFQBuilder: form dinamis spesifikasi dan lampiran.
-   NegotiationThread: percakapan per RFQ terhubung dengan penawaran.
-   ContractViewer: pratinjau kontrak dan e-sign.
-   EscrowProgress: status milestone dan dana.
-   VenueCalendar: kalender ketersediaan, drag-n-drop rentang tanggal.
-   CampaignComposer: segmentasi, jadwal, konten multi-bahasa.
-   AnalyticsDashboard: ringkasan KPI.

Status, validasi, notifikasi:

-   Gunakan state loading, success, error yang konsisten; form validation client dan server; toast dan alert; i18n bahasa Indonesia dan Inggris; aksesibilitas WCAG 2.2 AA.

## 9. Integrasi Pihak Ketiga (Konteks Indonesia)

-   Midtrans untuk pembayaran; verifikasi signature, retry aman.
-   WhatsApp Business API atau Fonnte untuk notifikasi WA.
-   Email transactional (Mailgun, Sendinblue) untuk kampanye.
-   Video (Zoom, Google Meet, YouTube Live) untuk event hybrid.
-   Peta (Google Maps) untuk venue dan rute.
-   Pencarian (Meilisearch atau Elasticsearch) untuk indexing.
-   CDN (Cloudflare) untuk aset statis.

## 10. Non-Fungsional

Keamanan dan kepatuhan: patuhi UU PDP, minimasi data, enkripsi in transit (TLS) dan at rest (kolom sensitif), praktik PCI-DSS (tokenisasi kartu oleh Midtrans), RBAC granular, audit log, KYC.
Rate limiting dan anti-abuse: throttling per IP dan per user, captcha berbobot, blokir pola anomali, deteksi brute force.
Pengelolaan webhook Midtrans: verifikasi signature, idempotensi per order, retry dengan backoff, dead-letter queue.

Kinerja dan skalabilitas: caching Redis, job queue untuk tugas berat (kirim kampanye, generasi sertifikat), denormalisasi terukur untuk listing dan pencarian, Meilisearch atau Elasticsearch, CDN, optimisasi aset, websocket untuk chat dan notifikasi realtime.
SSR vs CSR pada Inertia: pertimbangkan server-side rendering untuk halaman publik yang SEO krusial, CSR untuk dashboard; lazy-loading dan code-splitting.

Observabilitas: logging terstruktur (JSON), metrics (p95, error rate, throughput), tracing (OpenTelemetry), dashboard dan alert (Grafana, Prometheus), SLO dan error budget.

Aksesibilitas dan internasionalisasi: target WCAG 2.2 AA, dukungan id dan en, mata uang IDR default, multi-timezone, format tanggal lokal.

Pengujian dan kualitas: unit, integrasi, end-to-end dengan Playwright, kontrak API, pengujian keamanan (SAST, DAST), beban dengan k6, UAT terstruktur.

DevOps dan deployment: CI/CD, staging, manajemen variabel lingkungan, secrets, strategi rollback, backup dan restore, target RPO 15 menit dan RTO 60 menit.

## 11. ERD dan Alur Sekuens (Deskripsi)

ERD tingkat tinggi mencakup entitas: users, events, tickets, ticket_tiers, seats, orders, order_items, vouchers, gift_cards, rfqs, rfq_offers, contracts, milestones, escrows, venues, venue_availabilities, campaigns, audit_logs, idempotency_keys.

Alur pembelian tiket: pengguna memilih kursi atau tier, sistem lock kursi, menghitung harga dan voucher, membuat order, menginisiasi pembayaran Midtrans, menerima callback, menetapkan status settled, merilis lock, mengirim e-ticket dan akses virtual.

Alur penyewaan vendor: buyer membuat rfq, vendor menawar, kontrak ditandatangani, escrow dibuka, milestone dipenuhi, dana dirilis bertahap, rating dan ulasan.

Alur penyewaan venue: cek ketersediaan, deposit ditahan, konfirmasi jadwal, pelaksanaan, pengembalian deposit atau penalti sesuai kebijakan.

Callback pembayaran Midtrans: verifikasi signature, idempotensi, update status order dan escrow, log audit, notifikasi.

Proses check-in: scanner QR offline mencatat kedatangan, sinkronisasi saat online, deteksi duplikasi QR.

Refund dan sengketa: aturan kebijakan, perhitungan pro-rata, catatan audit dan komunikasi, penyelesaian dan laporan.

## 12. Idempotensi, Audit, Rekonsiliasi

-   Idempotensi berbasis kunci unik per permintaan, simpan hasil terakhir; semua handler mutasi harus idempoten.
-   Audit log untuk setiap perubahan penting, simpan before dan after, aktor, waktu, IP.
-   Rekonsiliasi harian: tarik status pembayaran, bandingkan dengan catatan internal, perbaiki selisih, laporan ke tim keuangan.

## 13. Prioritas dan Roadmap

MoSCoW:

-   Must: seat map dan tier, idempotensi transaksi, verifikasi webhook, audit log, availability venue, RFQ dasar, escrow dasar, laporan pembayaran, kampanye notifikasi dasar, Meilisearch.
-   Should: waiting list, transfer tiket, e-sign, payout terjadwal, deposit venue, hybrid dasar.
-   Could: bundling, gift card, rekomendasi personalisasi, tur virtual.
-   Won't (fase ini): dynamic pricing penuh, eFaktur produksi.

RICE (ringkas): seat map (R tinggi, I tinggi, C sedang, E menengah), escrow (R tinggi, I tinggi, C sedang, E menengah), Meilisearch (R tinggi, I menengah, C sedang, E rendah), waiting list (R menengah, I menengah, C rendah, E menengah).

Roadmap 4 sprint (2 minggu):

-   Sprint 1: ERD baru, migrasi dasar, seat lock, idempotensi, webhook hardened.
-   Sprint 2: seat map UI, tier, RFQ dasar, Meilisearch indexing.
-   Sprint 3: escrow dasar, contract viewer, venue availability, check-in offline MVP.
-   Sprint 4: waiting list, transfer tiket, kampanye notifikasi, observabilitas baseline.

## 14. Metrik Keberhasilan dan Acceptance Criteria

Contoh metrik: conversion rate checkout, waktu p95 generate seat map, keberhasilan check-in offline tanpa duplikasi, akurasi rekonsiliasi harian 100 persen, error rate callback di bawah 0,1 persen, latency pencarian p95 di bawah 150 ms.

Acceptance criteria (contoh):

-   Seat locking menolak booking kedua pada seat sama selama masa lock dan melepaskannya saat timeout.
-   Callback Midtrans dengan signature salah diabaikan dan di-log.
-   RFQ mendukung minimal 3 iterasi penawaran dengan versi.
-   Escrow merilis dana saat milestone lengkap dan tidak double-release (idempoten).
-   Offline QR check-in menyimpan antrian sinkronisasi dan mencegah duplikasi QR saat online.
-   Pencarian menampilkan hasil relevan dalam 150 ms p95 untuk kata kunci populer.

## 15. Penutup dan Rencana Evaluasi Penelitian

Riset akan mengevaluasi: efektivitas idempotensi transaksi, konsistensi check-in offline, dampak Meilisearch terhadap UX pencarian, dan efisiensi rekonsiliasi harian. Hasil diukur dengan metrik di atas dan uji A B terbatas bila memungkinkan.

---

# Lampiran Spesifikasi Lengkap (Detail Implementatif untuk Skripsi)

Dokumen ini melengkapi blueprint utama dengan rincian per fitur: tujuan bisnis dan teknis, skenario dan edge case, alur RBAC, skema database, kontrak layanan, UI Inertia React (Tailwind, shadcn/UI), integrasi pihak ketiga, non-fungsional, observabilitas, pengujian, DevOps, arsitektur, risiko, serta metrik dan kriteria penerimaan. Bahasa, regulasi, dan ekosistem mengikuti konteks Indonesia.

## A. Tujuan Bisnis dan Teknis per Fitur (Detail)

1. Pemetaan Kursi Interaktif (Seat Map)

-   Bisnis: monetisasi premium seating, pengalaman pembelian transparan, mengurangi sengketa kursi ganda.
-   Teknis: representasi kursi via layout JSON per venue, status kursi (available/locked/sold), seat lock idempoten selama window waktu, atomic release on timeout/success. Optimisasi query dengan indeks kursi per venue/section/tier. Concurrency via row-level locking.

2. Ticket Tier, Kuota, Dynamic Pricing

-   Bisnis: segmentasi harga, promosi FOMO, optimasi pendapatan.
-   Teknis: tabel tier dengan quota tracking, aturan dynamic pricing berbasis waktu/permintaan, cache snapshot untuk listing. Validasi kuota di server-side pada order creation dan pada callback setel.

3. Waiting List dan Antrian

-   Bisnis: konversi saat stok kembali tersedia, komunitas antusias.
-   Teknis: struktur antrean FIFO dengan prioritas; TTL pendaftaran; batch notify via queue; endpoint klaim stok idempoten; proteksi race.

4. Transfer dan Resell Tiket

-   Bisnis: pasar sekunder yang aman; tambah jangkauan event; biaya layanan.
-   Teknis: ownership model tiket; revoke QR lama dan terbitkan QR baru; escrow optional untuk resell; batasan harga; anti-fraud rule (velocity, device fingerprint).

5. Voucher, Bundling, Gift Card

-   Bisnis: tingkatkan AOV, retensi, kampanye musiman.
-   Teknis: rules engine untuk stacking, prioritas, black/whitelist produk; verifikasi masa berlaku dan penggunaan per user; kalkulasi di server; idempoten pada apply.

6. Check-in Offline QR, Badge, Sertifikat

-   Bisnis: operasional lancar walau internet tidak stabil; branding.
-   Teknis: cache daftar QR valid terenkripsi pada perangkat; penandaan scan lokal dengan queue sinkronisasi; deteksi duplikasi on-merge; generator badge dan sertifikat (PDF) via job.

7. RFQ dan Negosiasi Vendor

-   Bisnis: kecocokan kebutuhan spesifik; nilai tambah marketplace B2B/B2C.
-   Teknis: thread negosiasi versi-berbasis; lampiran aman; audit trail perubahan; SLA respons.

8. Kontrak & E-signature

-   Bisnis: legalitas dan kepercayaan; siklus penjualan lebih cepat.
-   Teknis: templating kontrak; integrasi penyedia e-sign; webhook status; arsip hash; audit lengkap.

9. Escrow, Pembayaran Bertahap, Payout

-   Bisnis: kurangi risiko sengketa; kelola arus kas vendor.
-   Teknis: ledger internal escrow; aturan release per milestone; penjadwalan payout; rekonsiliasi otomatis dengan pembayaran.

10. Manajemen Venue

-   Bisnis: utilisasi aset maksimal; pengurangan double booking.
-   Teknis: kalender ketersediaan dengan aturan berulang; deposit dan penalti pembatalan; inventaris dan layout.

11. Event Hybrid (Zoom/Meet/YouTube Live)

-   Bisnis: perluas audiens; pendapatan tambahan streaming.
-   Teknis: provisi link akses; token sekali pakai; pelacakan kehadiran; rate limit akses.

12. Marketing & Growth

-   Bisnis: akuisisi dan retensi; penguatan brand.
-   Teknis: kampanye email/WhatsApp; segmentasi; push notification; UTM tracking; referral/afiliasi; rekomendasi berbasis data.

13. CMS Konten

-   Bisnis: SEO dan edukasi; kurangi beban dev untuk konten.
-   Teknis: halaman statis, blog, FAQ, KB; approval workflow; preview; versi.

14. Keuangan & Perpajakan

-   Bisnis: kepatuhan pajak; transparansi laporan.
-   Teknis: PPN, eFaktur (integrasi DJP/mitra), NPWP/entitas hukum; jurnal otomatis; rekonsiliasi harian.

15. Pencarian Lanjut

-   Bisnis: discovery lebih baik; konversi lebih tinggi.
-   Teknis: Meilisearch/Elasticsearch; analyzer Bahasa Indonesia; geo filter; suggestion/typo tolerance.

## B. Skenario Inti dan Edge Case (Per Fitur)

1. Seat Locking

-   Skenario: user pilih seat A,B; sistem lock 5 menit; kadaluarsa melepas lock; pembayaran sukses menandai sold.
-   Edge: multi-tab sama akun; dua user kursi sama; refresh saat hampir timeout; jaringan terputus saat bayar.

2. Waiting List

-   Skenario: user daftar WL; stok terbuka; notifikasi; user klaim dalam jendela waktu.
-   Edge: banyak user klik bersamaan; notifikasi tertunda; user tidak memenuhi syarat (mis. blacklist).

3. Transfer/Resell

-   Skenario: pemilik transfer ke user B; QR lama invalid; fee diterapkan; log audit.
-   Edge: B menolak; A mencoba tarik kembali; resell melebihi batas; chargeback paska transfer.

4. RFQ-Negosiasi

-   Skenario: RFQ; vendor kirim penawaran; revisi spesifikasi; persetujuan kontrak.
-   Edge: penawaran kadaluarsa; lampiran virus; vendor spam; perubahan scope saat proses.

5. Escrow/Milestone

-   Skenario: dana masuk escrow; milestone complete; release bertahap.
-   Edge: klaim selesai padahal belum; perselisihan; pembatalan sebagian; rounding amount.

6. Venue

-   Skenario: pilih tanggal; deposit; pembatalan H-7 penalti X%.
-   Edge: timezone multi-lokasi; DST (internasional); overlapping recurring block.

7. Hybrid

-   Skenario: akses streaming; token 1x; hadir tercatat.
-   Edge: link bocor; simultan login multi device; throttling.

8. Marketing

-   Skenario: kampanye segmented; pelaporan open/click; opt-out.
-   Edge: WA rate limit; unsubscribe; spam complaint.

9. CMS

-   Skenario: penulis draft; editor approved; publish; rollback versi.
-   Edge: XSS konten; broken link; duplikasi slug.

10. Pajak & Laporan

-   Skenario: PPN penerbitan invoice; eFaktur; rekonsiliasi harian; laporan bulanan.
-   Edge: perubahan tarif pajak; pembetulan faktur.

## C. RBAC Alur Pengguna per Peran

-   Admin: kelola pengguna/role; moderasi; pengaturan pajak; laporan; sengketa; settlement.
-   Penyelenggara Event: buat event; seat map; kelola tier/kuota; check-in; laporan; kampanye event.
-   Vendor: onboarding KYC; kelola RFQ; kontrak; milestone; payout; rating.
-   Pemilik Venue: kalender; deposit; kebijakan pembatalan; inventaris; denah.
-   Pelanggan: cari; beli; antri WL; transfer tiket; ikut streaming; minta refund sesuai kebijakan.
-   Finance: rekonsiliasi; eFaktur; payout; audit.
-   Support: kelola tiket bantuan; moderasi ulasan; resolusi sengketa.

## D. Skema Database (Rinci, MySQL)

Kategori Tiket & Seat:

-   seat_maps(id, venue_id, version, json_layout, checksum, created_at, updated_at)
-   seats(id, venue_id, section, row, number, tier_id, status, created_at, updated_at); indeks (venue_id, section, row, number), (tier_id)
-   ticket_tiers(id, event_id, name, base_price, quota, sold, dynamic_rule_id, created_at, updated_at); indeks (event_id), (dynamic_rule_id)
-   seat_locks(id, seat_id, order_temp_id, user_id, locked_until, status, created_at); indeks (seat_id), (locked_until), unique(seat_id, status where status='locked')

Promosi:

-   vouchers(id, code unique, type, value, rules_json, valid_from, valid_to, max_uses, used_count, per_user_limit, created_at, updated_at); indeks (code), (valid_to)
-   gift_cards(id, code unique, balance, currency, expires_at, purchaser_id, created_at, updated_at)

Marketplace Vendor:

-   rfqs(id, buyer_id, category, spec_json, status, created_at, updated_at)
-   rfq_offers(id, rfq_id, vendor_id, price, terms_json, status, version, created_at, updated_at); indeks (rfq_id), (vendor_id)
-   contracts(id, rfq_id nullable, order_id nullable, vendor_id, file_path, signed_at nullable, audit_json, created_at)
-   milestones(id, contract_id, name, amount, due_date, status, created_at); indeks (contract_id)
-   escrows(id, order_id, balance, locked, released, currency, created_at, updated_at); indeks (order_id)

Venue:

-   venue_availabilities(id, venue_id, start_at, end_at, rule_json, created_at); indeks (venue_id, start_at, end_at)
-   venue_deposits(id, venue_id, policy_json, amount, currency)
-   equipments(id, venue_id, name, qty, spec_json)

Hybrid:

-   virtual_accesses(id, event_id, user_id, provider, join_url, access_token_hash, expires_at, attendance_log_json, created_at)

Marketing:

-   campaigns(id, name, channel, audience_json, content_json, schedule_at, status, created_at)
-   referrals(id, user_id, code unique, referred_user_id nullable, reward_status, created_at)
-   coupons(id, code unique, discount_type, discount_value, min_spend, valid_from, valid_to, usage_count, created_at)

Observabilitas & Idempoten:

-   audit_logs(id, actor_id, actor_role, action, subject_type, subject_id, before_json, after_json, ip, ua, created_at); indeks (actor_id, created_at), (subject_type, subject_id, created_at)
-   idempotency_keys(id, key unique, scope, request_hash, response_json, status, created_at); indeks (key)

Strategi Migrasi:

-   Tambah kolom/tabel baru sebagai nullable, backfill batch via job, lalu tambah constraint.
-   Gunakan transaksi untuk tabel kecil; untuk tabel besar gunakan online migration (pt-online-schema-change atau gh-ost jika tersedia).
-   Seed data referensi (tiers default, roles).

## E. Antarmuka Layanan (REST, Event, Webhook)

Prinsip:

-   Semua endpoint mutasi menerima Idempotency-Key (UUIDv4). Simpan request_hash dan hasil terakhir.
-   Retry dengan exponential backoff + jitter. Handler harus safe untuk dipanggil ulang.

Contoh Endpoint (ringkas):

-   POST /orders: buat pesanan (tickets/services/venue), dukung voucher/gift card/tiers/seats.
-   POST /seat-locks: lock kursi {seat_ids, duration_hint}; respons daftar kursi locked + expired_at.
-   POST /tickets/transfer: {ticket_id, to_user, fee}; revoke QR lama, terbit QR baru.
-   POST /rfqs; POST /rfq-offers; PATCH /rfq-offers/{id}: negosiasi.
-   POST /contracts; POST /contracts/{id}/sign: e-sign webhook akan mengubah status.
-   POST /escrows/{order_id}/release: rilis per milestone.
-   GET /venues/{id}/availability?from=&to=
-   POST /campaigns/send

Webhook:

-   /webhooks/midtrans: verifikasi signature; idempoten update status; dead-letter queue pada gagal.
-   /webhooks/esign: status signature; audit log.
-   /webhooks/streaming: attendance ping events (opsional).

Event Internal:

-   order_created, order_paid, seat_locked, seat_released, refund_issued, payout_scheduled, contract_signed.

Penanganan Error & Retry:

-   Kode 409 untuk konflik stok/seat; 422 validasi; 429 rate limit. Retryable untuk 5xx/timeout.
-   Atur retry maksimal; kirim ke DLQ jika melebihi.

## F. UI Inertia React (Tailwind + shadcn/UI)

Komponen Utama:

-   SeatMapCanvas: navigasi/zoom; status kursi; keyboard navigation; ARIA labels.
-   TicketTierSelector: kuota dan harga; validasi jumlah; badge sisa.
-   WaitingListDialog: daftar/keluar; progress; SLA.
-   TransferTicketFlow: input penerima; preview biaya; konfirmasi.
-   RFQBuilder: dynamic form; upload berkas; validasi ukuran/jenis.
-   NegotiationThread: percakapan; timeline penawaran; badge status.
-   ContractViewer: preview; status signature; download.
-   EscrowProgress: ringkasan dana; status milestone.
-   VenueCalendar: rentang tanggal; blok/availability; timezone aware.
-   CampaignComposer: segmentasi; jadwal; konten multi-bahasa; preview.
-   AnalyticsDashboard: KPI; filter rentang waktu.

Status & Validasi:

-   Konsisten loading/disabled/empty/error state.
-   Validasi client-side (email/phone/required) dan server-side error mapping.
-   Notifikasi toast/alert; undo bila mungkin.

Aksesibilitas:

-   Fokus yang jelas; ARIA roles; warna kontras Tailwind; keyboard navigable; skip links.
-   Bahasa Indonesia/Inggris via i18n dictionary; fallback.

## G. Integrasi Pihak Ketiga (Indonesia)

-   Pembayaran: Midtrans (Snap/Core). Signature verification; subscription (opsional).
-   WhatsApp: WhatsApp Business API, Fonnte, Qontak; fallback SMS (opsional).
-   E-mail: Mailgun/Sendinblue.
-   E-sign: PrivyID, DigiSign, PavoSign; webhook status.
-   Streaming: Zoom/Google Meet/YouTube Live.
-   Peta: Google Maps atau Mapbox; reverse geocoding.
-   Pencarian: Meilisearch (prefer performa/kemudahan) atau Elasticsearch.
-   CDN: Cloudflare; storage S3-compatible (MinIO/Wasabi) untuk aset.

## H. Non-Fungsional (Kepatuhan, Keamanan, Kinerja)

Kepatuhan & Keamanan:

-   UU PDP: minimasi data; consent; hak akses dan hapus; data retention; DPA dengan vendor.
-   PCI-DSS: tidak menyimpan data kartu; gunakan token pembayaran Midtrans; TLS kuat; rotasi kunci.
-   Enkripsi: in-transit (TLS 1.2+); at-rest untuk kolom sensitif (AES-256).
-   RBAC: granular per modul; prinsip least privilege; admin split duty.
-   Audit Log: semua aksi penting; immutable storage (WORM) opsional.
-   KYC: vendor/venue dengan dokumen legal; verifikasi manual/otomatis.
-   Rate Limiting/Anti-Abuse: throttling per IP/user/endpoint; CAPTCHA berbobot; deteksi anomali.

Midtrans Webhook:

-   Verifikasi signature; cross-check amount/order_id; idempoten dengan idempotency_keys; retry T+Jitter; DLQ; monitoring error rate.

Kinerja dan Skalabilitas:

-   Redis cache untuk listing, seat map snapshot, config, session.
-   Queue untuk tugas berat: kampanye, PDF, rekonsiliasi, e-mail, WA.
-   Denormalisasi terukur ke tabel read-model untuk listing/search.
-   Meilisearch/Elasticsearch untuk pencarian cepat.
-   CDN, image optimization, lazy loading.
-   Websocket untuk chat dan notifikasi; penskalaan via Soketi cluster.
-   SSR vs CSR: halaman publik SEO di-render server; dashboard CSR; code-splitting.

Idempotensi & Retry:

-   Idempotency-Key di semua mutasi; penyimpanan hasil; kompensasi pada kegagalan parsial.
-   Retry backoff untuk layanan eksternal; deduplikasi pada handler.

## I. Observabilitas

-   Logging terstruktur (JSON) dengan korelasi idempotency_key dan trace_id.
-   Metrics: p95 latency, throughput, error rate, job lag, seat lock timeout rate, WL conversion.
-   Tracing: OpenTelemetry; distributed tracing untuk webhook/queue.
-   Dashboard/Alert: Grafana/Prometheus; SLO; alerting untuk error>threshold.

## J. Aksesibilitas & Internasionalisasi

-   Target WCAG 2.2 AA: kontras, fokus, label, navigasi keyboard, media alt.
-   Bahasa: id dan en; fallback; tanggal/angka lokal; IDR default; multi-timezone.
-   Format uang: IDR; dukungan multi-mata uang opsional.

## K. Pengujian & Kualitas

-   Unit: service, kalkulasi pajak, rules promosi, idempoten.
-   Integrasi: Midtrans sandbox, e-sign webhook, WA gateway; DB.
-   E2E: Playwright untuk alur checkout, seat selection, transfer, RFQ, check-in.
-   Kontrak API: OpenAPI; test provider/consumer.
-   Keamanan: SAST/DAST; dependency scanning; fuzzing input kritikal.
-   Beban: k6 untuk checkout puncak; target p95 < 300 ms untuk operasi kritikal; 0% double-seat.
-   UAT: skenario bisnis per peran; checklist penerimaan; data dummy realistis.

## L. DevOps & Deployment

-   CI/CD: build, lint, test, coverage gate, migrate (safe), deploy staged; feature flag untuk rilis.
-   Lingkungan: dev/staging/production; konfig ENV; secrets manager.
-   Rollback: blue-green/canary; migrasi backward-compatible; strategi revert.
-   Backup/Restore: dump database terjadwal; RPO 15 menit; RTO 60 menit; uji restore berkala.
-   Infrastruktur: Nginx/PHP-FPM; queue worker; Redis; Meilisearch; Soketi; CDN.

## M. Arsitektur Teknis

-   Lapisan: Controller -> Service -> Domain/Repository -> Event/Queue.
-   Bounded Context: Ticketing, Vendor/RFQ, Venue, Payment/Escrow, Marketing, Search, CMS.
-   Model Transaksi: order (header), order_items (detail polymorphic), payments, escrows.
-   Anti-Corruption Layer untuk integrasi eksternal (Midtrans/e-sign/WA).
-   Event-Driven dalaman untuk sinkronisasi read-model dan notifikasi.

## N. Risiko, Dependensi, dan Mitigasi

-   Kompleksitas seat map dan concurrency: protokol lock ketat, testing beban.
-   Integrasi e-sign/WA: fallback dan grace degradation.
-   Rekonsiliasi pembayaran: jadwal rutin + manual override.
-   Privasi data: audit reguler; pengetatan akses; enkripsi.
-   Kinerja pencarian: indexing yang terukur; monitor latensi; fallback query.

## O. Metrik Keberhasilan dan Acceptance Criteria (Per Modul – Ringkas)

-   Ticketing/Seat Map: 0% konflik kursi; p95 render < 200 ms; CR checkout meningkat ≥10%.
-   Waiting List: tingkat klaim ≥30% dari notifikasi; SLA notifikasi < 2 menit.
-   Transfer/Resell: 0% QR duplikat; sengketa < 0.5%.
-   RFQ/Negosiasi: waktu siklus penawaran turun ≥20%; tingkat konversi ≥15%.
-   Escrow/Payout: 0% double-release; SLA payout T+1 hari kerja.
-   Venue: 0% double booking; kepuasan vendor ≥4/5.
-   Hybrid: kegagalan akses < 0.5%; overuse rate throttled.
-   Marketing: open rate email ≥25%; CTR ≥3%; pertumbuhan referral ≥10%.
-   Search: p95 < 150 ms; CTR hasil teratas ≥20%.

Acceptance (contoh):

-   Midtrans callback salah signature ditolak dan di-log; tidak mengubah status.
-   Idempotensi: POST yang sama dua kali tidak menggandakan side effect.
-   Offline check-in: sinkronisasi tanpa duplikasi; konflik ditandai dan diselesaikan.
-   RFQ: mendukung ≥3 iterasi penawaran dengan versi dan audit trail.

## P. Roadmap & Estimasi (Tambahan)

-   S1 (2 minggu): idempotensi global, webhook hardening, seat lock model, migrasi dasar read-model.
-   S2: SeatMapCanvas + tiers + Meilisearch indexing; halaman search terintegrasi filter.
-   S3: RFQ dasar, kontrak viewer, escrow dasar, venue availability, offline check-in MVP.
-   S4: waiting list, transfer tiket, kampanye notif, observabilitas baseline, rilis staging -> produksi.

Kompleksitas (kisaran): SeatMap (tinggi), Escrow (tinggi), RFQ (menengah-tinggi), Meilisearch (menengah), Offline check-in (menengah), Webhook hardening/idempotensi (menengah).

Dependensi: seat lock sebelum transfer; escrow sebelum payout; Meilisearch sebelum pencarian lanjutan; webhook hardening sebelum transaksi kritikal.

## Q. Catatan Isu Diketahui & Hutang Teknis (Untuk Perbaikan Fase Awal)

-   Notifikasi tipe tertentu dapat error saat mapping field; perlu validasi atribut dan fallback aman.
-   Pengaturan admin tertentu (SEO kolom) butuh sinkron migrasi dan seeder.
-   Rute/aksi admin yang belum diimplementasi penuh perlu penambahan handler atau pengalihan aman.
-   Kehadiran event (attendance) membutuhkan perapihan relasi dan pengecekan role/otorisasi.

Rencana:

-   Tambah validasi controller dan mapping tipe; perbaiki migrasi/seed; audit route protection; test integrasi halaman attendance dan ekspor PDF/Excel.

## R. Data Governance & Aksesibilitas

-   Retensi data: definisikan TTL untuk data sensitif; kebijakan anonymisasi setelah periode tertentu.
-   Hak pengguna: unduh data; hapus data sesuai UU PDP (kecuali kewajiban akuntansi).
-   Aksesibilitas: audit komponen UI untuk label, fokus, dan kontras; uji dengan pembaca layar; dokumentasi shortcut keyboard.

## S. Rencana Evaluasi Akademik

-   Eksperimen 1: Idempotensi transaksi vs error rate callback; metrik: duplikasi efek, konsistensi status.
-   Eksperimen 2: Check-in offline sinkronisasi konflik; metrik: waktu resolusi, tingkat konflik, akurasi deduplikasi.
-   Eksperimen 3: Meilisearch dampak UX; metrik: p95 latensi, CTR, konversi pencarian.
-   Eksperimen 4: Rekonsiliasi otomatis; metrik: selisih harian 0, tindakan manual, waktu proses.

Desain evaluasi: A/B terbatas (bila mungkin), dataset sintetis terukur, skenario beban.

---

Dokumen lampiran ini dimaksudkan sebagai acuan implementasi terperinci dan sebagai pendamping naskah skripsi untuk membuktikan nilai akademik, kebaruan, dan kelayakan teknis dari platform event marketplace yang diusulkan.
