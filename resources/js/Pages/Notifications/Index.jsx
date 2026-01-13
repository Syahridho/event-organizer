import { usePage, router, Head } from "@inertiajs/react";
import {
    Bell,
    CheckCircle,
    XCircle,
    Calendar,
    ShoppingCart,
    Package,
    Truck,
    DollarSign,
    CreditCard,
    AlertCircle,
    UserCheck,
    UserX,
    Star,
    MessageSquare,
    Gift,
    TrendingUp,
    Clock,
    FileText,
    Award,
    Zap,
    Heart,
    ThumbsUp,
    Info,
} from "lucide-react";
import { useState } from "react";
import MainLayout from "@/Layouts/Main.jsx";

export default function NotificationsIndex() {
    const { notifications } = usePage().props;
    const [isLoading, setIsLoading] = useState(false);

    const markAsRead = (id) => {
        setIsLoading(true);
        router.post(
            `/notifications/${id}/read`,
            {},
            {
                onFinish: () => setIsLoading(false),
            }
        );
    };

    const markAllAsRead = () => {
        setIsLoading(true);
        router.post(
            `/notifications/read-all`,
            {},
            {
                onFinish: () => setIsLoading(false),
            }
        );
    };

    const getIcon = (type) => {
        switch (type) {
            // Pembelian & Transaksi
            case "pembelian_baru":
                return (
                    <div className="p-2.5 bg-primary rounded-full">
                        <ShoppingCart className="w-5 h-5 text-primary-foreground" />
                    </div>
                );
            case "pesanan_diproses":
                return (
                    <div className="p-2.5 bg-primary rounded-full">
                        <Package className="w-5 h-5 text-primary-foreground" />
                    </div>
                );
            case "pesanan_dikirim":
                return (
                    <div className="p-2.5 bg-primary rounded-full">
                        <Truck className="w-5 h-5 text-primary-foreground" />
                    </div>
                );
            case "pesanan_selesai":
                return (
                    <div className="p-2.5 bg-primary rounded-full">
                        <CheckCircle className="w-5 h-5 text-primary-foreground" />
                    </div>
                );
            case "pesanan_dibatalkan":
                return (
                    <div className="p-2.5 bg-primary rounded-full">
                        <XCircle className="w-5 h-5 text-primary-foreground" />
                    </div>
                );

            // Pembayaran & Keuangan
            case "pembayaran_berhasil":
                return (
                    <div className="p-2.5 bg-primary rounded-full">
                        <CreditCard className="w-5 h-5 text-primary-foreground" />
                    </div>
                );
            case "pembayaran_gagal":
                return (
                    <div className="p-2.5 bg-primary rounded-full">
                        <AlertCircle className="w-5 h-5 text-primary-foreground" />
                    </div>
                );
            case "withdraw_diterima":
                return (
                    <div className="p-2.5 bg-primary rounded-full">
                        <DollarSign className="w-5 h-5 text-primary-foreground" />
                    </div>
                );
            case "withdraw_ditolak":
                return (
                    <div className="p-2.5 bg-primary rounded-full">
                        <XCircle className="w-5 h-5 text-primary-foreground" />
                    </div>
                );
            case "withdraw_diproses":
                return (
                    <div className="p-2.5 bg-primary rounded-full">
                        <Clock className="w-5 h-5 text-primary-foreground" />
                    </div>
                );

            // Mitra
            case "mitra_diterima":
                return (
                    <div className="p-2.5 bg-primary rounded-full">
                        <UserCheck className="w-5 h-5 text-primary-foreground" />
                    </div>
                );
            case "mitra_ditolak":
            case "pembatalan_mitra":
                return (
                    <div className="p-2.5 bg-primary rounded-full">
                        <UserX className="w-5 h-5 text-primary-foreground" />
                    </div>
                );
            case "mitra_pending":
                return (
                    <div className="p-2.5 bg-primary rounded-full">
                        <Clock className="w-5 h-5 text-primary-foreground" />
                    </div>
                );

            // Review & Rating
            case "review_baru":
                return (
                    <div className="p-2.5 bg-primary rounded-full">
                        <Star className="w-5 h-5 text-primary-foreground" />
                    </div>
                );
            case "komentar_baru":
                return (
                    <div className="p-2.5 bg-primary rounded-full">
                        <MessageSquare className="w-5 h-5 text-primary-foreground" />
                    </div>
                );

            // Promosi & Reward
            case "promo_baru":
            case "diskon_tersedia":
                return (
                    <div className="p-2.5 bg-primary rounded-full">
                        <Gift className="w-5 h-5 text-primary-foreground" />
                    </div>
                );
            case "poin_didapat":
            case "reward_tersedia":
                return (
                    <div className="p-2.5 bg-primary rounded-full">
                        <Award className="w-5 h-5 text-primary-foreground" />
                    </div>
                );

            // Aktivitas & Update
            case "produk_favorit":
                return (
                    <div className="p-2.5 bg-primary rounded-full">
                        <Heart className="w-5 h-5 text-primary-foreground" />
                    </div>
                );
            case "like_baru":
                return (
                    <div className="p-2.5 bg-primary rounded-full">
                        <ThumbsUp className="w-5 h-5 text-primary-foreground" />
                    </div>
                );
            case "trending":
                return (
                    <div className="p-2.5 bg-primary rounded-full">
                        <TrendingUp className="w-5 h-5 text-primary-foreground" />
                    </div>
                );
            case "update_sistem":
            case "info_penting":
                return (
                    <div className="p-2.5 bg-primary rounded-full">
                        <Info className="w-5 h-5 text-primary-foreground" />
                    </div>
                );
            case "dokumen_baru":
                return (
                    <div className="p-2.5 bg-primary rounded-full">
                        <FileText className="w-5 h-5 text-primary-foreground" />
                    </div>
                );
            case "event_reminder":
                return (
                    <div className="p-2.5 bg-primary rounded-full">
                        <Calendar className="w-5 h-5 text-primary-foreground" />
                    </div>
                );
            case "flash_sale":
            case "urgent":
                return (
                    <div className="p-2.5 bg-primary rounded-full animate-pulse">
                        <Zap className="w-5 h-5 text-primary-foreground" />
                    </div>
                );

            // Default
            default:
                return (
                    <div className="p-2.5 bg-primary rounded-full">
                        <Bell className="w-5 h-5 text-primary-foreground" />
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Head title="Notifikasi" />

            {/* Header Section */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary rounded-2xl shadow-lg">
                            <Bell className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">
                                Notifikasi
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {notifications.length} notifikasi
                            </p>
                        </div>
                    </div>

                    {notifications.length > 0 && (
                        <button
                            onClick={markAllAsRead}
                            disabled={isLoading}
                            className="group flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                Tandai Semua Dibaca
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                {notifications.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-border p-12 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="p-4 bg-muted rounded-full">
                                <Bell className="w-12 h-12 text-muted-foreground" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Tidak ada notifikasi
                        </h3>
                        <p className="text-muted-foreground">
                            Anda akan menerima notifikasi di sini ketika ada
                            aktivitas baru
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notification, index) => (
                            <div
                                key={notification.id}
                                className={`group relative overflow-hidden rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border ${
                                    notification.read_at
                                        ? "bg-white border-border opacity-70"
                                        : "bg-white border-primary/20 shadow-md"
                                } transform hover:-translate-y-1`}
                                style={{
                                    animationDelay: `${index * 50}ms`,
                                    animation: "slideIn 0.3s ease-out forwards",
                                }}
                            >
                                {/* Unread indicator */}
                                {!notification.read_at && (
                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                                )}

                                <div className="flex items-start gap-4 p-5">
                                    {/* Icon */}
                                    <div className="flex-shrink-0 transform group-hover:scale-110 transition-transform duration-300">
                                        {getIcon(notification.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className={`text-sm leading-relaxed ${
                                                notification.read_at
                                                    ? "text-muted-foreground"
                                                    : "text-foreground font-medium"
                                            }`}
                                        >
                                            {notification.message}
                                        </p>

                                        {/* Additional Info */}
                                        <div className="mt-2 space-y-1">
                                            {notification.pembelian_id && (
                                                <div className="flex items-center gap-2">
                                                    <div className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">
                                                        ID:{" "}
                                                        {
                                                            notification.pembelian_id
                                                        }
                                                    </div>
                                                </div>
                                            )}
                                            {notification.jumlah && (
                                                <div className="flex items-center gap-2">
                                                    <div className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">
                                                        Jumlah:{" "}
                                                        {notification.jumlah}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Timestamp */}
                                        <div className="flex items-center gap-1.5 mt-3">
                                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground">
                                                {notification.created_at}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    {!notification.read_at && (
                                        <button
                                            onClick={() =>
                                                markAsRead(notification.id)
                                            }
                                            disabled={isLoading}
                                            className="flex-shrink-0 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-xl shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                                        >
                                            Tandai Dibaca
                                        </button>
                                    )}
                                </div>

                                {/* Hover effect overlay */}
                                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-all duration-300 pointer-events-none"></div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add CSS animation */}
            <style jsx>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}

NotificationsIndex.layout = (page) => <MainLayout children={page} />;
