# Bab IV Hasil yang Diharapkan

## 4.1 Pendahuluan

Bab ini menjelaskan secara spesifik mengenai produk atau luaran akhir dari proyek Sistem Informasi Event Organizer (EO-Vendor) yang telah dikembangkan. Hasil proyek ini dirancang untuk memberikan solusi komprehensif yang relevan dengan kebutuhan mitra dalam industri event organizer. Selain menghasilkan produk untuk mitra, proyek ini juga memberikan kontribusi signifikan terhadap peningkatan kompetensi mahasiswa pencipta sistem serta mendukung pencapaian capaian pembelajaran (CPL) yang telah ditetapkan.

## 4.2 Produk dan Luaran Akhir Proyek

### 4.2.1 Sistem Web Event Organizer Terintegrasi

Produk utama dari proyek ini adalah sistem web berbasis Laravel yang mengintegrasikan berbagai layanan dalam satu platform:

#### 4.2.1.1 Modul Penjualan Tiket Acara Online

-   **Fitur**: Sistem penjualan tiket acara dengan berbagai mode (Offline, Google Meet, Zoom)
-   **Kapasitas**: Manajemen kuota tiket real-time dengan deteksi sold-out otomatis
-   **Validasi**: Sistem validasi tanggal untuk peri penjualan tiket
-   **Output**: Halaman pembelian tiket dengan integrasi pembayaran Midtrans

#### 4.2.1.2 Modul Penyewaan Jasa Vendor

-   **Fitur**: Katalog layanan vendor dengan sistem booking berbasis tanggal
-   **Manajemen**: CRUD layanan dengan kontrol ketersediaan
-   **Integrasi**: Sistem pembayaran terpisah untuk setiap layanan
-   **Output**: Dashboard manajemen layanan untuk mitra

#### 4.2.1.3 Modul Penyewaan Gedung dan Properti

-   **Fitur**: Sistem penyewaan gedung dan properti dengan opsi pengantaran
-   **Lokasi**: Integrasi peta untuk pemilihan koordinat lokasi
-   **Validasi**: Pencegahan double booking dengan algoritma O(n)
-   **Output**: Sistem penjadwalan dengan kalender ketersediaan

#### 4.2.1.4 Modul Transaksi Otomatis dengan Midtrans

-   **Fitur**: Integrasi Midtrans Payment Gateway untuk berbagai metode pembayaran
-   **Keamanan**: Validasi signature dan token untuk setiap transaksi
-   **Notifikasi**: Sistem notifikasi real-time untuk status pembayaran
-   **Output**: Halaman status pembayaran dengan informasi VA dan e-wallet

### 4.2.2 Dashboard Kolaborasi Multi-Role

#### 4.2.2.1 Dashboard Administrator

-   **Monitoring**: Sistem monitoring transaksi dan validasi mitra
-   **Moderasi**: Kontrol konten dengan kemampuan banned/unbanned
-   **Laporan**: Sistem laporan kehadiran event dengan ekspor PDF/Excel
-   **Pengaturan**: Manajemen pajak dan konfigurasi sistem

#### 4.2.2.2 Dashboard Mitra (Vendor)

-   **Manajemen Produk**: CRUD untuk event, service, building, dan property
-   **Transaksi**: Monitoring status pesanan dengan alur konfirmasi
-   **Ketersediaan**: Sistem manajemen cuti dengan toggle mingguan
-   **Keuangan**: Pengajuan penarikan dana dengan tracking status

#### 4.2.2.3 Dashboard Pengguna

-   **Pencarian**: Sistem pencarian dan filtering produk
-   **Keranjang**: Manajemen keranjang dengan validasi stok real-time
-   **Pembelian**: Riwayat transaksi dengan tracking status
-   **Interaksi**: Sistem chat real-time dengan mitra dan admin

### 4.2.3 Sistem Database Terstruktur

#### 4.2.3.1 Arsitektur Database

-   **Desain**: Database MySQL dengan 25+ tabel terintegrasi
-   **Relasi**: Polimorfik relationships untuk fleksibilitas data
-   **Optimasi**: Indexing strategis untuk performa query
-   **Integritas**: Foreign key constraints untuk konsistensi data

#### 4.2.3.2 Entitas Utama

-   **Pengguna**: Multi-role authentication (admin, mitra, member)
-   **Produk**: Event, service, building, rent property dengan relasi polimorfik
-   **Transaksi**: Sistem transaksi dengan item details dan payment gateway
-   **Interaksi**: Chat system dengan real-time notifications

### 4.2.4 Fitur-Fitur Unggulan Tambahan

#### 4.2.4.1 Sistem Chat Real-time

-   **Teknologi**: Implementasi Soketi (Pusher protocol) untuk WebSocket
-   **Fitur**: Online status indicator dan message read receipts
-   **Integrasi**: Chat antara user, mitra, dan admin
-   **Performance**: Optimasi dengan Redis untuk session management

#### 4.2.4.2 Sistem Notifikasi Komprehensif

-   **Channel**: Email, in-app notification, dan real-time alerts
-   **Template**: Template email yang dapat dikustomisasi
-   **Trigger**: Event-based notifications untuk berbagai aksi sistem
-   **Manajemen**: System untuk marking read/unread notifications

#### 4.2.4.3 Sistem Review dan Rating

-   **Validasi**: Review system dengan validasi pembelian
-   **Integrasi**: Rating system terhubung dengan transaksi
-   **Moderasi**: Admin moderation untuk review dan testimonial
-   **Analytics**: Rating analytics untuk vendor performance

## 4.3 Kontribusi Proyek terhadap Kebutuhan Mitra

### 4.3.1 Solusi Bisnis untuk Event Organizer

#### 4.3.1.1 Efisiensi Operasional

-   **Otomatisasi**: Reduksi 70% proses manual dalam manajemen event
-   **Integrasi**: Satu platform untuk semua kebutuhan EO
-   **Validasi**: Sistem validasi otomatis untuk pemesanan
-   **Reporting**: Real-time analytics untuk business intelligence

#### 4.3.1.2 Peningkatan Pendapatan

-   **Marketplace**: Akses ke pangsa pasar yang lebih luas
-   **Payment**: Multiple payment channels meningkatkan conversion rate
-   **Promosi**: Sistem rating untuk meningkatkan kepercayaan pelanggan
-   **Retention**: Customer relationship management melalui chat system

#### 4.3.1.3 Manajemen Risiko

-   **Validasi**: Pencegahan double booking dan overbooking
-   **Keamanan**: Secure payment processing dengan Midtrans
-   **Compliance**: Tax management dengan perhitungan otomatis
-   **Audit Trail**: Complete transaction history untuk accountability

### 4.3.2 Dampak pada Industri Event Organizer

#### 4.3.2.1 Digital Transformation

-   **Adopsi Teknologi**: Mendorong transformasi digital di industri EO
-   **Standardisasi**: Menciptakan standar industri untuk manajemen event
-   **Inovasi**: Template untuk pengembangan sistem serupa
-   **Ekosistem**: Membangun ekosistem digital untuk stakeholders

#### 4.3.2.2 Aksesibilitas dan Inklusi

-   **Geografis**: Menghilangkan batasan geografis untuk vendor
-   **Skalabilitas**: Mendukung EO dari skala kecil hingga enterprise
-   **Inklusi**: Memberikan kesempatan bagi EO lokal untuk bersaing
-   **Transparansi**: Sistem transparan untuk harga dan ketersediaan

## 4.4 Peningkatan Kompetensi Mahasiswa

### 4.4.1 Kompetensi Teknis

#### 4.4.1.1 Full-Stack Development

-   **Backend**: Laravel framework dengan MVC architecture
-   **Frontend**: React.js dengan Inertia.js untuk SPA experience
-   **Database**: MySQL dengan advanced query optimization
-   **API**: RESTful API design dengan proper authentication

#### 4.4.1.2 System Integration

-   **Payment Gateway**: Integrasi Midtrans dengan callback handling
-   **Real-time Communication**: WebSocket implementation dengan Soketi
-   **External APIs**: Integrasi RajaOngkir untuk shipping calculation
-   **Cloud Services**: Deployment dan scaling considerations

#### 4.4.1.3 Advanced Programming Concepts

-   **Design Patterns**: Implementation of Repository, Factory, dan Observer patterns
-   **Algorithm Optimization**: O(n) complexity untuk double booking prevention
-   **Concurrency Handling**: Race condition prevention dalam transaksi
-   **Security**: Input validation, SQL injection prevention, dan XSS protection

### 4.4.2 Kompetensi Non-Teknis

#### 4.4.2.1 Project Management

-   **Agile Methodology**: Iterative development dengan user feedback
-   **Requirement Analysis**: Business requirement translation ke technical specification
-   **Quality Assurance**: Testing strategy dengan unit dan integration testing
-   **Documentation**: Technical documentation dan user manual creation

#### 4.4.2.2 Problem Solving

-   **Analytical Thinking**: Root cause analysis untuk complex bugs
-   **System Design**: Architectural decision making untuk scalability
-   **Troubleshooting**: Debugging techniques untuk production issues
-   **Performance Optimization**: Query optimization dan caching strategies

#### 4.4.2.3 Soft Skills

-   **Communication**: Technical documentation dan presentation skills
-   **Collaboration**: Version control dengan Git untuk team development
-   **Time Management**: Project timeline management dengan milestone tracking
-   **Adaptability**: Technology stack adaptation untuk project requirements

### 4.4.3 Kompetensi Bisnis dan Entrepreneurship

#### 4.4.3.1 Business Analysis

-   **Market Research**: Analysis of EO industry needs dan pain points
-   **Competitive Analysis**: Study of existing solutions dan gap identification
-   **Value Proposition**: Development of unique selling proposition
-   **Business Model**: Revenue stream consideration untuk sustainability

#### 4.4.3.2 Product Management

-   **Product Lifecycle**: Complete product development lifecycle management
-   **User Experience**: UX consideration untuk user adoption
-   **Feature Prioritization**: MVP development dengan iterative enhancement
-   **Metrics Definition**: KPI definition untuk product success measurement

## 4.5 Kontribusi terhadap Capaian Pembelajaran (CPL)

### 4.5.1 Capaian Pembelajaran Pendidikan Tinggi

#### 4.5.1.1 Sikap dan Nilai

-   **CPL-1**: Menunjukkan sikap religius, bertanggung jawab, peduli, gotong royong, dan toleran dalam melaksanakan tugas

    -   **Realisasi**: Implementasi sistem dengan mempertimbangkan kepentingan berbagai stakeholders (admin, mitra, pengguna)
    -   **Bukti**: Desain sistem yang inklusif dan adil untuk semua role pengguna

-   **CPL-2**: Mampu menunjukkan sikap jujur, disiplin, tanggung jawab, dan peduli dalam bertindak
    -   **Realisasi**: Pengembangan sistem dengan code quality standards dan proper documentation
    -   **Bukti**: Clean code architecture dengan comprehensive error handling

#### 4.5.1.2 Penguasaan Pengetahuan

-   **CPL-3**: Mampu menguasai konsep teori ilmu komputer dan rekayasa perangkat lunak

    -   **Realisasi**: Implementasi software engineering principles dalam sistem EO-Vendor
    -   **Bukti**: Application of design patterns, SOLID principles, dan architectural patterns

-   **CPL-4**: Mampu menguasai konsep dasar sistem informasi dan database
    -   **Realisasi**: Desain dan implementasi database dengan normalization dan indexing
    -   **Bukti**: Database schema dengan 25+ tabel dan proper relationships

#### 4.5.1.3 Keterampilan Umum

-   **CPL-5**: Mampu mengidentifikasi masalah dan merancang solusi sistem informasi

    -   **Realisasi**: Problem identification dalam industri EO dan solution development
    -   **Bukti**: Comprehensive system yang addresses multiple pain points

-   **CPL-6**: Mampu mengimplementasikan sistem informasi menggunakan teknologi terkini
    -   **Realisasi**: Implementation dengan Laravel, React.js, Midtrans, dan Soketi
    -   **Bukti**: Production-ready system dengan modern tech stack

#### 4.5.1.4 Keterampilan Khusus

-   **CPL-7**: Mampu mengembangkan aplikasi web berbasis framework

    -   **Realisasi**: Full-stack application dengan Laravel backend dan React frontend
    -   **Bukti**: Complete web application dengan advanced features

-   **CPL-8**: Mampu mengintegrasikan sistem dengan payment gateway dan external services
    -   **Realisasi**: Midtrans integration dengan callback handling dan error management
    -   **Bukti**: Robust payment system dengan multiple payment methods

### 4.5.2 Mapping CPL dengan Project Deliverables

#### 4.5.2.1 Tabel Mapping CPL dan Project Components

| CPL   | Deskripsi                         | Project Component                           | Tingkat Pencapaian |
| ----- | --------------------------------- | ------------------------------------------- | ------------------ |
| CPL-1 | Sikap religius dan tanggung jawab | Multi-role user system dengan equal access  | Sangat Tinggi      |
| CPL-2 | Sikap jujur dan disiplin          | Code quality dan documentation              | Tinggi             |
| CPL-3 | Konsep ilmu komputer              | System architecture dan design patterns     | Sangat Tinggi      |
| CPL-4 | Konsep sistem informasi           | Database design dan normalization           | Sangat Tinggi      |
| CPL-5 | Identifikasi masalah              | Problem analysis dan solution design        | Sangat Tinggi      |
| CPL-6 | Implementasi teknologi terkini    | Laravel, React, Midtrans integration        | Sangat Tinggi      |
| CPL-7 | Pengembangan aplikasi web         | Full-stack web application                  | Sangat Tinggi      |
| CPL-8 | Integrasi sistem eksternal        | Payment gateway dan real-time communication | Sangat Tinggi      |

### 4.5.3 Bukti Pencapaian CPL

#### 4.5.3.1 Portofolio Teknis

-   **Source Code**: Complete codebase dengan proper documentation
-   **System Architecture**: Well-documented system design dan architecture decisions
-   **Database Schema**: Optimized database design dengan proper indexing
-   **API Documentation**: Comprehensive API documentation untuk integration

#### 4.5.3.2 Dokumentasi Proyek

-   **Technical Specification**: Detailed technical documentation
-   **User Manual**: Comprehensive user guide untuk semua roles
-   **Deployment Guide**: Step-by-step deployment instructions
-   **Maintenance Guide**: System maintenance dan troubleshooting guide

#### 4.5.3.3 Presentasi dan Demo

-   **System Demo**: Live demonstration dari semua fitur sistem
-   **Technical Presentation**: Detailed technical architecture presentation
-   **Business Case**: Business value proposition dan market analysis
-   **Q&A Session**: Comprehensive question and answer session

## 4.6 Dampak Jangka Panjang dan Keberlanjutan

### 4.6.1 Keberlanjutan Teknis

#### 4.6.1.1 Scalability

-   **Architecture**: Microservices-ready architecture untuk future scaling
-   **Database**: Optimized queries dengan indexing untuk large datasets
-   **Caching**: Redis implementation untuk performance optimization
-   **Load Balancing**: Preparation untuk horizontal scaling

#### 4.6.1.2 Maintainability

-   **Code Structure**: Modular code structure untuk easy maintenance
-   **Documentation**: Comprehensive documentation untuk knowledge transfer
-   **Testing**: Unit dan integration tests untuk regression prevention
-   **Version Control**: Git workflow untuk collaborative development

### 4.6.2 Keberlanjutan Bisnis

#### 4.6.2.1 Revenue Streams

-   **Commission**: Transaction-based commission model
-   **Premium Features**: Advanced features untuk enterprise clients
-   **API Access**: API access untuk third-party integrations
-   **Data Analytics**: Business intelligence services untuk vendors

#### 4.6.2.2 Market Expansion

-   **Geographic**: Expansion ke new geographic markets
-   **Vertical**: Expansion ke related industries (wedding, corporate events)
-   **Partnership**: Strategic partnerships dengan event industry players
-   **Community**: Building user community dan ecosystem

### 4.6.3 Kontribusi Akademis

#### 4.6.3.1 Research Opportunities

-   **Data Analytics**: Event industry data untuk academic research
-   **Case Study**: Case study untuk software engineering education
-   **Pattern Library**: Design patterns untuk similar applications
-   **Best Practices**: Best practices documentation untuk industry adoption

#### 4.6.3.2 Educational Impact

-   **Curriculum Development**: Contribution untuk computer science curriculum
-   **Student Projects**: Template untuk future student projects
-   **Industry Collaboration**: Bridge antara academia dan industry
-   **Innovation Culture**: Fostering innovation dalam software development

## 4.7 Kesimpulan

Proyek Sistem Informasi Event Organizer (EO-Vendor) telah berhasil menghasilkan produk komprehensif yang tidak hanya memenuhi kebutuhan mitra dalam industri event organizer, tetapi juga memberikan kontribusi signifikan terhadap peningkatan kompetensi mahasiswa. Sistem ini mengintegrasikan teknologi terkini dengan best practices dalam software engineering untuk menciptakan solusi yang scalable, maintainable, dan user-friendly.

Produk akhir dari proyek ini mencakup sistem web terintegrasi dengan berbagai modul fungsional, dashboard kolaborasi multi-role, dan fitur-fitur unggulan seperti real-time chat dan comprehensive payment system. Kontribusi terhadap mitra termasuk peningkatan efisiensi operasional, akses pasar yang lebih luas, dan manajemen risiko yang lebih baik.

Dari sisi pendidikan, proyek ini telah berhasil mencapai berbagai Capaian Pembelajaran (CPL) yang ditetapkan, mulai dari aspek sikap dan nilai hingga keterampilan teknis dan non-teknis. Mahasiswa telah mengembangkan kompetensi dalam full-stack development, system integration, problem solving, dan project management.

Dampak jangka panjang dari proyek ini tidak hanya terbatas pada keberlanjutan teknis dan bisnis, tetapi juga mencakup kontribusi akademis melalui research opportunities dan educational impact. Sistem ini berpotensi menjadi template untuk pengembangan sistem serupa dan mendorong adopsi teknologi dalam industri event organizer.

Secara keseluruhan, proyek ini merupakan implementasi sukses dari konsep "learning by doing" di mana mahasiswa tidak hanya mengembangkan produk yang relevan dengan kebutuhan industri, tetapi juga menginternalisasi konsep-konsep teoretis melalui praktik langsung dalam pengembangan sistem informasi yang kompleks dan komprehensif.
