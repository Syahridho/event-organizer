import { Head, Link } from "@inertiajs/react";
import MainLayout from "@/Layouts/Main";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    ShoppingBag,
    ArrowRight,
    Copy,
    CreditCard,
} from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Payment Status Page - Optimized with O(1) status mapping
 *
 * Status types:
 * - success/settlement: Payment successful
 * - pending: Payment pending
 * - cancel/cancelled: Payment cancelled
 * - error/expire/denied: Payment error
 */

// O(1) lookup for status configuration
const STATUS_CONFIG = {
    success: {
        icon: CheckCircle2,
        iconColor: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        title: "Pembayaran Berhasil!",
        description:
            "Terima kasih! Pembayaran Anda telah berhasil diproses. Pesanan Anda sedang dipersiapkan.",
        buttonText: "Lihat Pesanan",
        buttonVariant: "default",
    },
    settlement: {
        icon: CheckCircle2,
        iconColor: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        title: "Pembayaran Berhasil!",
        description:
            "Terima kasih! Pembayaran Anda telah berhasil diproses. Pesanan Anda sedang dipersiapkan.",
        buttonText: "Lihat Pesanan",
        buttonVariant: "default",
    },
    pending: {
        icon: Clock,
        iconColor: "text-amber-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        title: "Menunggu Pembayaran",
        description:
            "Pembayaran Anda sedang diproses. Silakan selesaikan pembayaran atau tunggu konfirmasi.",
        buttonText: "Lihat Status Pembayaran",
        buttonVariant: "outline",
    },
    cancel: {
        icon: XCircle,
        iconColor: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        title: "Pembayaran Dibatalkan",
        description:
            "Pembayaran Anda telah dibatalkan. Silakan lakukan pemesanan ulang jika Anda masih berminat.",
        buttonText: "Belanja Lagi",
        buttonVariant: "outline",
    },
    cancelled: {
        icon: XCircle,
        iconColor: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        title: "Pembayaran Dibatalkan",
        description:
            "Pembayaran Anda telah dibatalkan. Silakan lakukan pemesanan ulang jika Anda masih berminat.",
        buttonText: "Belanja Lagi",
        buttonVariant: "outline",
    },
    error: {
        icon: AlertCircle,
        iconColor: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        title: "Pembayaran Gagal",
        description:
            "Terjadi kesalahan saat memproses pembayaran Anda. Silakan coba lagi atau hubungi customer service.",
        buttonText: "Coba Lagi",
        buttonVariant: "outline",
    },
    expire: {
        icon: AlertCircle,
        iconColor: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        title: "Pembayaran Kadaluarsa",
        description:
            "Waktu pembayaran telah habis. Silakan lakukan pemesanan ulang untuk melanjutkan.",
        buttonText: "Belanja Lagi",
        buttonVariant: "outline",
    },
    denied: {
        icon: XCircle,
        iconColor: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        title: "Pembayaran Ditolak",
        description:
            "Pembayaran Anda ditolak oleh bank atau payment gateway. Silakan gunakan metode pembayaran lain.",
        buttonText: "Coba Metode Lain",
        buttonVariant: "outline",
    },
};

// Default config jika status tidak dikenali
const DEFAULT_CONFIG = {
    icon: AlertCircle,
    iconColor: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    title: "Status Pembayaran",
    description: "Status pembayaran Anda sedang diproses.",
    buttonText: "Lihat Pesanan",
    buttonVariant: "outline",
};

export default function PaymentStatus({
    status = "pending",
    order_id = null,
    va_info = null,
    transaction = null,
}) {
    // O(1) lookup untuk konfigurasi status
    const config = STATUS_CONFIG[status.toLowerCase()] || DEFAULT_CONFIG;
    const Icon = config.icon;

    // Tentukan tab purchase berdasarkan status
    const getPurchaseTab = (status) => {
        const statusLower = status.toLowerCase();
        if (["success", "settlement"].includes(statusLower)) return "paid";
        if (["pending"].includes(statusLower)) return "unpaid";
        if (["cancel", "cancelled"].includes(statusLower)) return "cancelled";
        return "unpaid";
    };

    const purchaseTab = getPurchaseTab(status);

    // Helper function to copy text to clipboard
    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text).then(
            () => {
                toast.success(`${label} berhasil disalin!`);
            },
            () => {
                toast.error("Gagal menyalin");
            }
        );
    };

    // Auto-redirect untuk status tertentu (opsional)
    useEffect(() => {
        // Bisa ditambahkan auto-redirect jika diperlukan
        // Misalnya redirect ke purchase setelah 5 detik untuk status success
        if (["success", "settlement"].includes(status.toLowerCase())) {
            // setTimeout(() => {
            //     window.location.href = `/purchase?tab=${purchaseTab}`;
            // }, 5000);
        }
    }, [status, purchaseTab]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
            <Head title={config.title} />

            <div className="max-w-2xl mx-auto">
                {/* Status Card */}
                <Card
                    className={`${config.borderColor} border-2 shadow-lg overflow-hidden`}
                >
                    <CardContent className="p-0">
                        {/* Header Section */}
                        <div
                            className={`${config.bgColor} px-6 py-8 md:px-8 md:py-12 text-center border-b ${config.borderColor}`}
                        >
                            <div
                                className={`w-20 h-20 md:w-24 md:h-24 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-white shadow-lg`}
                            >
                                <Icon
                                    className={`w-10 h-10 md:w-12 md:h-12 ${config.iconColor}`}
                                    strokeWidth={2.5}
                                />
                            </div>

                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                                {config.title}
                            </h1>

                            <p className="text-sm md:text-base text-gray-700 max-w-md mx-auto leading-relaxed">
                                {config.description}
                            </p>

                            {order_id && (
                                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <span className="text-xs font-medium text-gray-500">
                                        Order ID:
                                    </span>
                                    <span className="text-sm font-mono font-semibold text-gray-900">
                                        {order_id}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Action Section */}
                        <div className="px-6 py-8 md:px-8 bg-white">
                            <div className="space-y-4">
                                {/* Primary Action Button */}
                                <Button
                                    asChild
                                    size="lg"
                                    variant={config.buttonVariant}
                                    className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
                                >
                                    <Link
                                        href={`/purchase?tab=${purchaseTab}`}
                                        className="inline-flex items-center justify-center gap-2"
                                    >
                                        <ShoppingBag className="w-5 h-5" />
                                        {config.buttonText}
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                </Button>

                                {/* Secondary Action - Kembali ke Home */}
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="lg"
                                    className="w-full h-12 text-base font-medium"
                                >
                                    <Link href="/">Kembali ke Beranda</Link>
                                </Button>
                            </div>

                            {/* OPTIMIZED: VA Info Card with O(1) rendering */}
                            {va_info && (va_info.va_number || va_info.bill_key) && (
                                <div className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl shadow-md">
                                    <div className="flex items-center gap-2 mb-4">
                                        <CreditCard className="w-5 h-5 text-blue-600" />
                                        <h3 className="text-base font-bold text-blue-900">
                                            Informasi Pembayaran
                                        </h3>
                                    </div>

                                    {/* Bank Name */}
                                    {va_info.bank_name && (
                                        <div className="mb-4 p-3 bg-white/80 rounded-lg border border-blue-100">
                                            <p className="text-xs text-gray-600 mb-1">
                                                Bank
                                            </p>
                                            <p className="text-lg font-bold text-gray-900">
                                                {va_info.bank_name}
                                            </p>
                                        </div>
                                    )}

                                    {/* VA Number (BCA, BNI, BRI, Permata, etc.) */}
                                    {va_info.va_number && (
                                        <div className="mb-3 p-4 bg-white rounded-lg border-2 border-blue-300 shadow-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-semibold text-gray-600">
                                                    Nomor Virtual Account
                                                </p>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        copyToClipboard(
                                                            va_info.va_number,
                                                            "Nomor VA"
                                                        )
                                                    }
                                                    className="h-7 px-2 text-blue-600 hover:bg-blue-100"
                                                >
                                                    <Copy className="w-4 h-4 mr-1" />
                                                    Salin
                                                </Button>
                                            </div>
                                            <p className="text-2xl font-mono font-black text-blue-600 tracking-wider">
                                                {va_info.va_number}
                                            </p>
                                        </div>
                                    )}

                                    {/* Mandiri Bill Payment */}
                                    {va_info.bill_key && va_info.biller_code && (
                                        <>
                                            <div className="mb-3 p-4 bg-white rounded-lg border-2 border-blue-300 shadow-sm">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-xs font-semibold text-gray-600">
                                                        Biller Code
                                                    </p>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            copyToClipboard(
                                                                va_info.biller_code,
                                                                "Biller Code"
                                                            )
                                                        }
                                                        className="h-7 px-2 text-blue-600 hover:bg-blue-100"
                                                    >
                                                        <Copy className="w-4 h-4 mr-1" />
                                                        Salin
                                                    </Button>
                                                </div>
                                                <p className="text-xl font-mono font-black text-blue-600 tracking-wider">
                                                    {va_info.biller_code}
                                                </p>
                                            </div>

                                            <div className="p-4 bg-white rounded-lg border-2 border-blue-300 shadow-sm">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-xs font-semibold text-gray-600">
                                                        Bill Key
                                                    </p>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            copyToClipboard(
                                                                va_info.bill_key,
                                                                "Bill Key"
                                                            )
                                                        }
                                                        className="h-7 px-2 text-blue-600 hover:bg-blue-100"
                                                    >
                                                        <Copy className="w-4 h-4 mr-1" />
                                                        Salin
                                                    </Button>
                                                </div>
                                                <p className="text-xl font-mono font-black text-blue-600 tracking-wider">
                                                    {va_info.bill_key}
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    {/* Total Amount */}
                                    {transaction && transaction.total && (
                                        <div className="mt-4 p-3 bg-white/80 rounded-lg border border-blue-100">
                                            <p className="text-xs text-gray-600 mb-1">
                                                Total Pembayaran
                                            </p>
                                            <p className="text-2xl font-bold text-blue-600">
                                                Rp {Number(transaction.total).toLocaleString("id-ID")}
                                            </p>
                                        </div>
                                    )}

                                    <div className="mt-4 p-3 bg-amber-100 border border-amber-300 rounded-lg">
                                        <p className="text-xs text-amber-900 flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                            <span>
                                                Gunakan nomor ini untuk menyelesaikan pembayaran melalui ATM, Mobile Banking, atau Internet Banking
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Additional Info for Pending Status */}
                            {status.toLowerCase() === "pending" && (
                                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <h3 className="text-sm font-semibold text-amber-900 mb-1">
                                                Tips Pembayaran
                                            </h3>
                                            <ul className="text-xs text-amber-800 space-y-1">
                                                <li>
                                                    • Selesaikan pembayaran
                                                    sebelum batas waktu habis
                                                </li>
                                                <li>
                                                    • Cek email Anda untuk
                                                    instruksi pembayaran
                                                </li>
                                                <li>
                                                    • Simpan nomor virtual
                                                    account atau kode pembayaran
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Additional Info for Success Status */}
                            {["success", "settlement"].includes(
                                status.toLowerCase()
                            ) && (
                                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <h3 className="text-sm font-semibold text-green-900 mb-1">
                                                Langkah Selanjutnya
                                            </h3>
                                            <ul className="text-xs text-green-800 space-y-1">
                                                <li>
                                                    • Cek status pesanan di
                                                    halaman "Pembelian Saya"
                                                </li>
                                                <li>
                                                    • Notifikasi akan dikirim ke
                                                    email Anda
                                                </li>
                                                <li>
                                                    • Hubungi mitra jika ada
                                                    pertanyaan
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Help Section */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-600 mb-2">
                        Butuh bantuan?
                    </p>
                    <div className="flex justify-center gap-4 flex-wrap">
                        <Link
                            href="/chat"
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            Chat dengan Kami
                        </Link>
                        <span className="text-gray-400">•</span>
                        <Link
                            href="/purchase"
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            Riwayat Transaksi
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

PaymentStatus.layout = (page) => <MainLayout>{page}</MainLayout>;
