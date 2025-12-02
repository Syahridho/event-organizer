import React from "react";
import { Head } from "@inertiajs/react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion.jsx";
import MainLayout from "@/Layouts/Main.jsx";

export default function Terms() {
    return (
        <>
            <Head title="Syarat dan Ketentuan" />
            <div className="min-h-screen mx-auto xl:max-w-4xl p-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Syarat dan Ketentuan
                    </h1>
                    <p className="text-lg text-gray-600">
                        Harap baca syarat dan ketentuan ini dengan teliti
                        sebelum menggunakan layanan kami.
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="text-left">
                                1. Penggunaan Layanan
                            </AccordionTrigger>
                            <AccordionContent>
                                <p className="text-gray-700 leading-relaxed">
                                    Dengan mengakses dan menggunakan platform
                                    Event Organizer ini, Anda setuju untuk
                                    mematuhi semua syarat dan ketentuan yang
                                    tercantum di sini. Platform ini menyediakan
                                    layanan untuk memesan tiket event, menyewa
                                    gedung, jasa event, dan properti rental.
                                </p>
                                <p className="text-gray-700 leading-relaxed mt-3">
                                    Anda bertanggung jawab atas semua aktivitas
                                    yang dilakukan melalui akun Anda dan
                                    memastikan bahwa informasi yang diberikan
                                    adalah akurat dan terkini.
                                </p>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-2">
                            <AccordionTrigger className="text-left">
                                2. Akun Pengguna
                            </AccordionTrigger>
                            <AccordionContent>
                                <p className="text-gray-700 leading-relaxed">
                                    Untuk menggunakan layanan tertentu, Anda
                                    harus membuat akun dengan memberikan
                                    informasi yang valid. Anda bertanggung jawab
                                    untuk menjaga kerahasiaan kata sandi dan
                                    aktivitas akun Anda.
                                </p>
                                <p className="text-gray-700 leading-relaxed mt-3">
                                    Jika Anda mencurigai adanya penyalahgunaan
                                    akun, segera hubungi tim dukungan kami. Kami
                                    berhak menangguhkan atau menghapus akun yang
                                    melanggar ketentuan ini.
                                </p>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-3">
                            <AccordionTrigger className="text-left">
                                3. Pemesanan dan Pembayaran
                            </AccordionTrigger>
                            <AccordionContent>
                                <p className="text-gray-700 leading-relaxed">
                                    Semua pemesanan tunduk pada ketersediaan dan
                                    konfirmasi pembayaran. Kami menggunakan
                                    sistem pembayaran yang aman melalui Midtrans
                                    untuk memproses transaksi Anda.
                                </p>
                                <p className="text-gray-700 leading-relaxed mt-3">
                                    Harga yang tercantum sudah termasuk pajak
                                    sesuai dengan ketentuan yang berlaku.
                                    Pembatalan dan pengembalian dana tunduk pada
                                    kebijakan masing-masing penyedia layanan.
                                </p>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-4">
                            <AccordionTrigger className="text-left">
                                4. Kebijakan Pembatalan
                            </AccordionTrigger>
                            <AccordionContent>
                                <p className="text-gray-700 leading-relaxed">
                                    Kebijakan pembatalan bervariasi tergantung
                                    pada jenis layanan dan penyedia. Untuk event
                                    dan tiket, pembatalan dapat dilakukan hingga
                                    24 jam sebelum acara dengan pengembalian
                                    dana 100%.
                                </p>
                                <p className="text-gray-700 leading-relaxed mt-3">
                                    Untuk penyewaan gedung dan properti,
                                    pembatalan harus dilakukan minimal 7 hari
                                    sebelum tanggal sewa. Biaya pembatalan akan
                                    dikenakan sesuai dengan ketentuan penyedia.
                                </p>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-5">
                            <AccordionTrigger className="text-left">
                                5. Tanggung Jawab Pengguna
                            </AccordionTrigger>
                            <AccordionContent>
                                <p className="text-gray-700 leading-relaxed">
                                    Anda setuju untuk menggunakan platform ini
                                    hanya untuk tujuan yang sah dan tidak
                                    melanggar hukum yang berlaku di Indonesia.
                                </p>
                                <p className="text-gray-700 leading-relaxed mt-3">
                                    Dilarang menggunakan platform ini untuk
                                    menyebarkan konten yang tidak pantas,
                                    melakukan penipuan, atau mengganggu
                                    operasional platform.
                                </p>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-6">
                            <AccordionTrigger className="text-left">
                                6. Privasi dan Data
                            </AccordionTrigger>
                            <AccordionContent>
                                <p className="text-gray-700 leading-relaxed">
                                    Kami menghargai privasi Anda dan berkomitmen
                                    untuk melindungi data pribadi yang Anda
                                    berikan. Data Anda akan digunakan hanya
                                    untuk keperluan layanan dan tidak akan
                                    dibagikan kepada pihak ketiga tanpa izin
                                    Anda.
                                </p>
                                <p className="text-gray-700 leading-relaxed mt-3">
                                    Untuk informasi lebih lanjut, silakan baca
                                    Kebijakan Privasi kami yang tersedia di
                                    platform ini.
                                </p>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-7">
                            <AccordionTrigger className="text-left">
                                7. Batasan Tanggung Jawab
                            </AccordionTrigger>
                            <AccordionContent>
                                <p className="text-gray-700 leading-relaxed">
                                    Platform Event Organizer berfungsi sebagai
                                    perantara antara pengguna dan penyedia
                                    layanan. Kami tidak bertanggung jawab atas
                                    kualitas layanan yang diberikan oleh mitra
                                    atau penyedia.
                                </p>
                                <p className="text-gray-700 leading-relaxed mt-3">
                                    Dalam hal terjadi perselisihan, kami akan
                                    berusaha memfasilitasi penyelesaian namun
                                    tidak bertanggung jawab atas kerugian yang
                                    timbul.
                                </p>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-8">
                            <AccordionTrigger className="text-left">
                                8. Perubahan Ketentuan
                            </AccordionTrigger>
                            <AccordionContent>
                                <p className="text-gray-700 leading-relaxed">
                                    Kami berhak mengubah syarat dan ketentuan
                                    ini kapan saja tanpa pemberitahuan
                                    sebelumnya. Perubahan akan berlaku segera
                                    setelah dipublikasikan di platform ini.
                                </p>
                                <p className="text-gray-700 leading-relaxed mt-3">
                                    Penggunaan berkelanjutan platform ini
                                    setelah perubahan berarti Anda menyetujui
                                    ketentuan yang baru.
                                </p>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-9">
                            <AccordionTrigger className="text-left">
                                9. Hukum yang Berlaku
                            </AccordionTrigger>
                            <AccordionContent>
                                <p className="text-gray-700 leading-relaxed">
                                    Syarat dan ketentuan ini diatur oleh hukum
                                    yang berlaku di Republik Indonesia. Setiap
                                    perselisihan akan diselesaikan melalui
                                    pengadilan yang berwenang di Indonesia.
                                </p>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-10">
                            <AccordionTrigger className="text-left">
                                10. Kontak Kami
                            </AccordionTrigger>
                            <AccordionContent>
                                <p className="text-gray-700 leading-relaxed">
                                    Jika Anda memiliki pertanyaan mengenai
                                    syarat dan ketentuan ini, silakan hubungi
                                    tim dukungan kami melalui email
                                    support@eventorganizer.com atau melalui
                                    fitur chat di platform ini.
                                </p>
                                <p className="text-gray-700 leading-relaxed mt-3">
                                    Terima kasih telah menggunakan platform
                                    Event Organizer. Kami berkomitmen untuk
                                    memberikan pengalaman terbaik bagi Anda.
                                </p>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        </>
    );
}

Terms.layout = (page) => <MainLayout>{page}</MainLayout>;
