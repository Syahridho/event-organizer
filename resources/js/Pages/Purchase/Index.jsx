import React, { useEffect, useState, useCallback, useMemo } from "react";
import { usePage, Link, Head, router } from "@inertiajs/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatRupiah } from "@/Utils/formatRupiah";
import Countdown from "@/Utils/CountDown";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import PaymentStatusBadge from "@/components/payment-status-badge";
import { toast, Toaster } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ItemStatusBadge from "@/components/item-status-badge";
import Rating from "react-rating";
import { IoStar, IoStarOutline } from "react-icons/io5";
import MainLayout from "@/Layouts/Main";
import axios from "axios";

// ===================================
// KOMPONEN RATING DIALOG
// ===================================

const RatingDialog = ({
    transaction,
    onRatingSubmit,
    isLoading,
    item_type,
    onClose,
}) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");

    const handleSubmit = () => {
        if (rating === 0) {
            toast.error("Silakan berikan bintang rating terlebih dahulu.");
            return;
        }

        onRatingSubmit(transaction.id, rating, comment, item_type);
    };

    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Beri Ulasan untuk Transaksi Ini</DialogTitle>
                <DialogDescription>
                    Bagikan pengalaman Anda dengan memberikan rating dan ulasan.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="flex justify-center items-center gap-1">
                    <Rating
                        initialRating={rating}
                        emptySymbol={
                            <IoStarOutline className="text-gray-300 text-3xl" />
                        }
                        fullSymbol={
                            <IoStar className="text-yellow-500 text-3xl" />
                        }
                        onChange={(value) => setRating(value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="comment">Komentar (Opsional)</Label>
                    <Textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Tulis ulasan Anda di sini..."
                    />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Batal</Button>
                </DialogClose>
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="bg-blue-500 hover:bg-blue-600"
                >
                    {isLoading ? "Mengirim..." : "Kirim Ulasan"}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

// ===================================
// KOMPONEN TRANSACTION ITEM (DENGAN PERBAIKAN RESPONSIVITAS)
// ===================================

const TransactionItem = React.memo(
    ({
        transaction,
        onPay,
        onRedirectPay,
        getThumbnail,
        handleCancel,
        handleRating,
        isLoading,
        isRatingDialogOpen,
        setIsRatingDialogOpen,
    }) => {
        const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
        const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

        const handlePayment = () => {
            if (transaction.redirect_url) {
                onRedirectPay(transaction.redirect_url);
            } else if (transaction.snap_token) {
                onPay(transaction.snap_token);
            } else {
                toast.error("Tidak ada token pembayaran yang tersedia.");
            }
        };

        const handleCancelConfirm = () => {
            handleCancel(transaction.order_id);
            setIsCancelDialogOpen(false);
        };

        return (
            <div className="border rounded-lg sm:rounded-2xl p-3 sm:p-4 mb-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                    <p className="text-xs sm:text-sm font-semibold text-gray-600">
                        <Link
                            href={route("purchase.show", transaction.id)}
                            className="block hover:bg-gray-50 p-1 sm:p-2 rounded-lg"
                        >
                            Order ID: {transaction.order_id}
                        </Link>
                    </p>
                    <PaymentStatusBadge status={transaction.status} />
                </div>

                {transaction?.items?.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between mt-2 pb-2 border-b border-gray-200 last:border-none"
                    >
                        {/* PERBAIKAN: Tambahkan min-w-0 ke flex-1 agar detail produk dapat menyusut */}
                        <div className="flex items-start gap-4 flex-1 **min-w-0**">
                            <img
                                src={getThumbnail(item)}
                                alt={item.item?.name || "Produk"}
                                className="w-16 h-16 rounded object-cover flex-shrink-0"
                                loading="lazy"
                            />
                            {/* PERBAIKAN: Tambahkan min-w-0 ke container detail teks */}
                            <div className="flex flex-col **min-w-0**">
                                <div className="flex items-center gap-2 **min-w-0**">
                                    {/* PERBAIKAN: Tambahkan break-words untuk teks panjang dan min-w-0 */}
                                    <p className="font-semibold text-gray-800 **break-words min-w-0**">
                                        {item.item?.event?.name ||
                                            item.item?.name ||
                                            "Produk"}
                                    </p>
                                    <ItemStatusBadge status={item.status} />
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    {item?.item_type !== "ticket"
                                        ? "Jasa"
                                        : `Tiket ${item?.item?.name}`}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    x {item?.qty}{" "}
                                    {item?.item_type === "ticket"
                                        ? "Tiket"
                                        : "Hari Jasa"}
                                </p>
                            </div>
                        </div>

                        {/* PERBAIKAN: Tambahkan flex-shrink-0 untuk memastikan bagian harga tidak menyusut paksa */}
                        <div className="flex flex-col items-end text-right ml-4 **flex-shrink-0**">
                            <h1 className="font-semibold text-gray-900 **whitespace-nowrap**">
                                Rp {formatRupiah(item.price * item.qty)}
                            </h1>
                            <p className="text-xs text-gray-500 mt-1 **whitespace-nowrap**">
                                Harga Satuan Rp {formatRupiah(item.price)}
                            </p>
                            {item.rating === null &&
                                item.status === "completed" && (
                                    <div className="mt-4">
                                        <Dialog
                                            open={
                                                isRatingDialogOpen === item.id
                                            }
                                            onOpenChange={(open) =>
                                                setIsRatingDialogOpen(
                                                    open ? item.id : null
                                                )
                                            }
                                        >
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="default"
                                                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                                >
                                                    Beri Ulasan
                                                </Button>
                                            </DialogTrigger>
                                            <RatingDialog
                                                transaction={item}
                                                onRatingSubmit={handleRating}
                                                isLoading={isLoading}
                                                item_type={item?.item_type}
                                                onClose={() =>
                                                    setIsRatingDialogOpen(null)
                                                }
                                            />
                                        </Dialog>
                                    </div>
                                )}
                        </div>
                    </div>
                ))}
                <div className="flex flex-col sm:flex-row sm:justify-between mt-3 pt-2 gap-2">
                    {transaction?.status === "pending" && (
                        <Countdown expired_at={transaction.expired_at} />
                    )}
                    <p className="font-bold text-sm sm:text-base">
                        Total: Rp {formatRupiah(transaction.total)}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                    {transaction.status === "pending" &&
                        new Date(
                            transaction.expired_at.replace(" ", "T")
                        ).getTime() > Date.now() && (
                            <>
                                <Dialog
                                    open={isPaymentDialogOpen}
                                    onOpenChange={setIsPaymentDialogOpen}
                                >
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="default"
                                            // PASTIKAN: w-full di mobile
                                            className="bg-blue-500 hover:bg-blue-600 **w-full** sm:w-auto text-sm"
                                        >
                                            Bayar Sekarang
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>
                                                Konfirmasi Pembayaran
                                            </DialogTitle>
                                            <DialogDescription>
                                                Anda akan melanjutkan ke halaman
                                                pembayaran untuk transaksi ini.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div className="p-4 bg-gray-50 rounded-lg">
                                                <div className="flex justify-between items-center text-gray-400">
                                                    <span className="text-sm">
                                                        Order ID:
                                                    </span>
                                                    <span className="font-medium">
                                                        {transaction.order_id}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-sm text-gray-600">
                                                        Total:
                                                    </span>
                                                    <span className="font-bold text-lg">
                                                        Rp{" "}
                                                        {formatRupiah(
                                                            transaction.total
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter className="flex-col sm:flex-row gap-2">
                                            <DialogClose asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full sm:w-auto"
                                                >
                                                    Batal
                                                </Button>
                                            </DialogClose>
                                            <Button
                                                onClick={handlePayment}
                                                className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600"
                                            >
                                                Lanjutkan Pembayaran
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <Dialog
                                    open={isCancelDialogOpen}
                                    onOpenChange={setIsCancelDialogOpen}
                                >
                                    <DialogTrigger asChild>
                                        <Button
                                            disabled={isLoading}
                                            variant="destructive"
                                            // PASTIKAN: w-full di mobile
                                            className="**w-full** sm:w-auto text-sm"
                                        >
                                            {isLoading
                                                ? "Membatalkan..."
                                                : "Batalkan"}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>
                                                Konfirmasi Pembatalan
                                            </DialogTitle>
                                            <DialogDescription>
                                                Apakah Anda yakin ingin
                                                membatalkan transaksi ini?
                                                Tindakan ini tidak dapat
                                                dibatalkan.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">
                                                        Order ID:
                                                    </span>
                                                    <span className="font-medium">
                                                        {transaction.order_id}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-sm text-gray-600">
                                                        Total:
                                                    </span>
                                                    <span className="font-bold text-lg">
                                                        Rp{" "}
                                                        {formatRupiah(
                                                            transaction.total
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="mt-3 p-2 bg-red-100 rounded text-sm text-red-700">
                                                    ⚠️ Transaksi yang dibatalkan
                                                    tidak dapat dikembalikan
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter className="flex-col sm:flex-row gap-2">
                                            <DialogClose asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full sm:w-auto"
                                                >
                                                    Tidak, Batal
                                                </Button>
                                            </DialogClose>
                                            <Button
                                                onClick={handleCancelConfirm}
                                                variant="destructive"
                                                className="w-full sm:w-auto"
                                                disabled={isLoading}
                                            >
                                                {isLoading
                                                    ? "Membatalkan..."
                                                    : "Ya, Batalkan Transaksi"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </>
                        )}
                </div>
            </div>
        );
    }
);

// ===================================
// KOMPONEN UTAMA PURCHASE INDEX (DENGAN PERBAIKAN TABS)
// ===================================

// ✅ FIX: Changed from named export to default export
export default function PurchaseIndex() {
    const { transactions, ziggy, midtransClientKey, flash } = usePage().props;
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState("");
    const [allTransactions, setAllTransactions] = useState(transactions);
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancellingOrderId, setCancellingOrderId] = useState(null);
    const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(null);

    const searchParams = new URLSearchParams(window.location.search);
    const currentTab = searchParams.get("tab") || "all";

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
        script.setAttribute("data-client-key", midtransClientKey);
        script.async = true;
        document.head.appendChild(script);

        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, [midtransClientKey]);

    const statusMapping = {
        pending: "unpaid",
        settlement: "paid",
        shipping: "shipped",
        success: "completed",
        cancel: "cancelled",
        cancelled: "cancelled",
        pending_admin: "pending_admin",
    };

    const tabs = [
        { key: "all", label: "Semua" },
        { key: "unpaid", label: "Belum Bayar" },
        { key: "paid", label: "Sudah Bayar" },
        { key: "pending_admin", label: "Menunggu Konfirmasi" },
        { key: "shipped", label: "Dalam Perjalanan" },
        { key: "completed", label: "Selesai" },
        { key: "cancelled", label: "Dibatalkan" },
    ];

    const getThumbnail = useCallback(
        (item) => {
            const thumb =
                item?.thumbnail ||
                item?.item?.thumbnail ||
                item?.item?.event?.thumbnail;
            if (!thumb) return "/default.png";
            return thumb.includes("randoms")
                ? `${ziggy.url}/storage${thumb}`
                : `${ziggy.url}/storage/thumbnails/${thumb}`;
        },
        [ziggy.url]
    );

    const filteredTransactions = useMemo(() => {
        return allTransactions.filter((trx) =>
            currentTab === "all"
                ? true
                : statusMapping[trx.status] === currentTab
        );
    }, [allTransactions, currentTab]);

    const handlePay = useCallback((snapToken) => {
        if (!window.snap) {
            toast.error("Midtrans Snap belum dimuat. Silakan refresh halaman.");
            return;
        }

        window.snap.pay(snapToken, {
            onSuccess: (result) => {
                toast.success("Pembayaran berhasil!");
                router.reload();
            },
            onPending: (result) => {
                toast.warning(
                    "Pembayaran pending. Silakan cek status pembayaran."
                );
            },
            onError: (result) => {
                toast.error("Terjadi kesalahan dalam pembayaran.");
            },
            onClose: () => {
                toast.info("Anda menutup jendela pembayaran.");
            },
        });
    }, []);

    const handleRedirectPay = useCallback((redirectUrl) => {
        setPaymentUrl(redirectUrl);
        setShowPaymentModal(true);
    }, []);

    const closePaymentModal = useCallback(() => {
        setShowPaymentModal(false);
        setPaymentUrl("");
        router.reload();
    }, []);

    const handleCancel = useCallback((orderId) => {
        if (!orderId) {
            toast.error("Order ID tidak valid!");
            return;
        }

        setIsCancelling(true);
        setCancellingOrderId(orderId);

        axios
            .post(route("transaction.cancel", orderId))
            .then((response) => {
                toast.success(response.data.message);
                setAllTransactions((prevTransactions) =>
                    prevTransactions.map((transaction) =>
                        transaction.order_id === orderId
                            ? { ...transaction, status: "cancelled" }
                            : transaction
                    )
                );
            })
            .catch((error) => {
                toast.error(
                    error.response?.data?.message || "Gagal membatalkan"
                );
            })
            .finally(() => {
                setIsCancelling(false);
                setCancellingOrderId(null);
            });
    }, []);

    const handleRating = useCallback(
        (transactionItemId, rating, comment, item_type) => {
            setIsCancelling(true);
            setCancellingOrderId(transactionItemId);

            router.post(
                route("mitra.rating.store", {
                    transactionItemId: transactionItemId,
                }),
                { rating, comment, item_type },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success("Ulasan berhasil dikirim!");
                        setAllTransactions((prevTransactions) =>
                            prevTransactions.map((transaction) => ({
                                ...transaction,
                                items: transaction.items.map((item) =>
                                    item.id === transactionItemId
                                        ? { ...item, rating, comment }
                                        : item
                                ),
                            }))
                        );
                        setIsRatingDialogOpen(null);
                    },
                    onError: (errors) => {
                        console.error("Rating error:", errors);
                        toast.error("Gagal mengirim ulasan.");
                    },
                    onFinish: () => {
                        setIsCancelling(false);
                        setCancellingOrderId(null);
                    },
                }
            );
        },
        []
    );

    const renderTransaction = useCallback(
        (transaction) => (
            <TransactionItem
                key={transaction.id}
                transaction={transaction}
                onPay={handlePay}
                onRedirectPay={handleRedirectPay}
                getThumbnail={getThumbnail}
                handleCancel={handleCancel}
                handleRating={handleRating}
                isLoading={
                    isCancelling && cancellingOrderId === transaction.order_id
                }
                isRatingDialogOpen={isRatingDialogOpen}
                setIsRatingDialogOpen={setIsRatingDialogOpen}
            />
        ),
        [
            handlePay,
            handleRedirectPay,
            getThumbnail,
            handleCancel,
            handleRating,
            isCancelling,
            cancellingOrderId,
            isRatingDialogOpen,
        ]
    );

    return (
        <div className="max-w-4xl mx-auto p-3 sm:p-4">
            <Head title="Pembelian" />
            <Toaster position="top-right" richColors />

            <h1 className="text-lg sm:text-xl font-bold mb-4">Pembayaran</h1>

            <Tabs defaultValue={currentTab} className="w-full">
                {/* PERBAIKAN UTAMA: Gunakan flex-nowrap dan overflow-x-auto untuk horizontal scrolling di mobile */}
                <TabsList className="flex flex-wrap gap-1 mb-4 h-auto p-1 w-full">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.key}
                            href={`/purchase?tab=${tab.key}`}
                            preserveScroll
                            preserveState
                        >
                            <TabsTrigger
                                value={tab.key}
                                className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap"
                            >
                                {tab.label}
                            </TabsTrigger>
                        </Link>
                    ))}
                </TabsList>

                {tabs.map((tab) => (
                    <TabsContent key={tab.key} value={tab.key}>
                        {filteredTransactions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Tidak ada transaksi
                            </div>
                        ) : (
                            filteredTransactions.map(renderTransaction)
                        )}
                    </TabsContent>
                ))}
            </Tabs>

            {showPaymentModal && (
                <Dialog
                    open={showPaymentModal}
                    onOpenChange={setShowPaymentModal}
                >
                    <DialogContent className="sm:max-w-2xl max-h-[95vh] p-0">
                        <DialogHeader className="p-6 pb-0">
                            <DialogTitle>Lakukan Pembayaran</DialogTitle>
                            <DialogDescription>
                                Silakan lakukan pembayaran
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto p-6 pt-0">
                            <div className="h-[80vh] w-full">
                                <iframe
                                    src={paymentUrl}
                                    className="w-full h-full border rounded-lg"
                                    title="Payment Gateway"
                                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
                                />
                            </div>
                        </div>
                        <DialogFooter className="p-6 pt-0">
                            <DialogClose asChild>
                                <Button onClick={closePaymentModal}>
                                    Selesai
                                </Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

// ✅ FIX: Corrected layout assignment for Inertia
PurchaseIndex.layout = (page) => <MainLayout children={page} />;
