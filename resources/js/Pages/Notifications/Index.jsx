import { usePage, router, Head } from "@inertiajs/react";
import { Bell, CheckCircle, XCircle, Calendar, Trash2 } from "lucide-react";
import { useState } from "react";
import MainLayout from "@/Layouts/Main";

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
            case "pembelian_baru":
                return <Calendar className="w-5 h-5 text-blue-500" />;
            case "pembatalan_mitra":
                return <XCircle className="w-5 h-5 text-red-500" />;
            case "withdraw_diterima":
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case "withdraw_ditolak":
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <div className="min-h-screen max-w-3xl mx-auto">
            <Head title="Notifikasi" />
            <div className="m-6 xl:m-12">
                <div className="flex mb-6">
                    <h1 className="text-2xl w-full font-bold flex gap-2">
                        Notifikasi
                    </h1>

                    {notifications.length > 0 && (
                        <button
                            onClick={markAllAsRead}
                            disabled={isLoading}
                            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        >
                            Tandai Semua Dibaca
                        </button>
                    )}
                </div>
            </div>
            <div className="max-w-4xl p-4 sm:p-6">
                {notifications.length === 0 ? (
                    <p className="text-gray-600 text-center">
                        Tidak ada notifikasi.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 rounded-lg shadow-sm border flex items-start gap-3 ${
                                    notification.read_at
                                        ? "bg-gray-50"
                                        : "bg-white border-blue-200"
                                }`}
                            >
                                <div>{getIcon(notification.type)}</div>
                                <div className="flex-1">
                                    <p className="text-sm">
                                        {notification.message}
                                    </p>
                                    {notification.pembelian_id && (
                                        <p className="text-xs text-gray-500">
                                            ID Pembelian:{" "}
                                            {notification.pembelian_id}
                                        </p>
                                    )}
                                    {notification.jumlah && (
                                        <p className="text-xs text-gray-500">
                                            Jumlah: {notification.jumlah}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">
                                        {notification.created_at}
                                    </p>
                                </div>
                                {!notification.read_at && (
                                    <button
                                        onClick={() =>
                                            markAsRead(notification.id)
                                        }
                                        disabled={isLoading}
                                        className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                    >
                                        Tandai Dibaca
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

NotificationsIndex.layout = (page) => <MainLayout children={page} />;
