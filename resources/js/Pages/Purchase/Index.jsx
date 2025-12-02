import React, { useEffect, useState, useCallback, useMemo } from "react";
import { usePage, Link, Head, router } from "@inertiajs/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatRupiah } from "@/Utils/formatRupiah";
import {
    formatDateWithShortDay,
    formatCompactDateTime,
} from "@/Utils/formatDateTime";
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
import PaymentStatusBadge from "@/Components/payment-status-badge";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ItemStatusBadge from "@/Components/item-status-badge";
import Rating from "react-rating";
import { IoStar, IoStarOutline } from "react-icons/io5";
import {
    Clock,
    Package,
    Calendar,
    MapPin,
    CreditCard,
    ShoppingCart,
    CheckCircle2,
} from "lucide-react";
import MainLayout from "@/Layouts/Main";
import axios from "axios";

const RatingDialog = ({
    transaction,
    item,
    onRatingSubmit,
    isLoading,
    item_type,
}) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");

    const handleSubmit = useCallback(() => {
        if (rating === 0) {
            toast.error("Silakan berikan bintang rating terlebih dahulu.");
            return;
        }
        onRatingSubmit(transaction.id, rating, comment, item_type, item);
    }, [rating, comment, transaction.id, item_type, item, onRatingSubmit]);

    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                    Beri Ulasan untuk Transaksi Ini
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base">
                    Bagikan pengalaman Anda dengan memberikan rating dan ulasan.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="flex justify-center items-center gap-1">
                    <Rating
                        initialRating={rating}
                        emptySymbol={
                            <IoStarOutline className="text-gray-300 text-2xl sm:text-3xl" />
                        }
                        fullSymbol={
                            <IoStar className="text-yellow-500 text-2xl sm:text-3xl" />
                        }
                        onChange={(value) => setRating(value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="comment" className="text-sm font-medium">
                        Komentar (Opsional)
                    </Label>
                    <Textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Tulis ulasan Anda di sini..."
                        className="min-h-[100px] text-sm"
                    />
                </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
                <DialogClose asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                        Batal
                    </Button>
                </DialogClose>
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/50"
                >
                    {isLoading ? "Mengirim..." : "Kirim Ulasan"}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

const TransactionItem = React.memo(
    ({
        transaction,
        onPay,
        onRedirectPay,
        handleCancel,
        handleRating,
        isLoading,
        setIsRatingDialogOpen,
        ziggy,
    }) => {
        const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
        const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

        // Memoized getThumbnail function
        const getItemThumbnail = useCallback(
            (item) => {
                const thumb =
                    item?.thumbnail ||
                    item?.item?.thumbnail ||
                    item?.item?.event?.thumbnail;
                if (!thumb) return "/default.png";
                return thumb.includes("default-event-images")
                    ? `${ziggy.url}/storage${thumb}`
                    : `${ziggy.url}/storage/thumbnails/${thumb}`;
            },
            [ziggy.url]
        );

        const [isExpired, setIsExpired] = useState(() => {
            if (!transaction.expired_at) return true;
            const expiredDate = new Date(
                transaction.expired_at.replace(" ", "T")
            );
            // Grace period: hide actions only after 1s past expired_at
            return expiredDate.getTime() - 10000 <= Date.now();
        });

        // Hide cancel action for Delivery Fee orders (order_id starts with "DEL-")
        const isDeliveryFeeOrder = (transaction?.order_id || "").startsWith(
            "DEL-"
        );

        const handlePayment = useCallback(() => {
            if (transaction.redirect_url) {
                onRedirectPay(transaction.redirect_url);
            } else if (transaction.snap_token) {
                onPay(transaction.snap_token);
            } else {
                toast.error("Tidak ada token pembayaran yang tersedia.");
            }
        }, [transaction, onRedirectPay, onPay]);

        const handleCancelConfirm = useCallback(() => {
            handleCancel(transaction.order_id);
            setIsCancelDialogOpen(false);
        }, [transaction.order_id, handleCancel]);

        const isEventPast = (eventDateEndString) => {
            // Jika data tidak ada, anggap belum selesai
            if (!eventDateEndString) return false;

            // Konversi string event_date_end menjadi objek Date
            const eventEndDate = new Date(eventDateEndString);
            const now = new Date();

            // Bandingkan: Apakah waktu sekarang LEBIH BESAR dari waktu selesai event?
            return now.getTime() > eventEndDate.getTime();
        };

        return (
            <Card className="mb-4 overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                    {/* Header: Order ID + Status */}
                    <div className="flex sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <Link
                            href={route("purchase.show", transaction.id)}
                            className="group"
                        >
                            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-600 group-hover:text-blue-600 transition-colors">
                                <ShoppingCart className="w-4 h-4" />
                                <span>Order ID: {transaction.order_id}</span>
                            </div>
                            {/* OPTIMIZED: Display transaction date with day name */}
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                <Calendar className="w-3 h-3" />
                                <span>
                                    {formatCompactDateTime(
                                        transaction.created_at
                                    )}
                                </span>
                            </div>
                        </Link>
                        <PaymentStatusBadge
                            status={transaction.status}
                            expired_at={transaction.expired_at}
                        />
                    </div>

                    <Separator className="mb-4" />

                    {/* Items List */}
                    <div className="space-y-3">
                        {transaction?.items?.map((item) => {
                            // Check if transaction is completed or event is finished
                            const isRentDatePast = (rentDateString) => {
                                if (!rentDateString) return false;

                                // 1. Dapatkan Tanggal Hari Ini (Diubah ke Tengah Malam WIB)

                                const now = new Date();

                                // Gunakan fungsi Intl.DateTimeFormat untuk mendapatkan string tanggal WIB

                                const rentDateEnd = new Date(rentDateString);

                                rentDateEnd.setDate(rentDateEnd.getDate() + 1);

                                rentDateEnd.setHours(0, 0, 0, 0);
                                return now.getTime() > rentDateEnd.getTime();
                            };

                            const isTransactionCompleted =
                                item?.status === "completed" ||
                                isRentDatePast(item?.rent_days);
                            const isEventFinished = item?.item?.event
                                ? isEventPast(item?.item?.event.event_date_end)
                                : false;

                            const shouldShowCompletedState =
                                isTransactionCompleted || isEventFinished;

                            return (
                                <div
                                    key={item.id}
                                    className="flex gap-3 sm:gap-4 pb-3 border-b border-gray-100 last:border-none"
                                >
                                    {/* Product Image */}
                                    <div className="flex-shrink-0">
                                        <img
                                            src={getItemThumbnail(item)}
                                            alt={item.item?.name || "Produk"}
                                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover ring-1 ring-gray-200"
                                            loading="lazy"
                                        />
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start gap-2 mb-1">
                                            <h3 className="font-semibold text-sm sm:text-base text-gray-900 break-words line-clamp-2">
                                                {isDeliveryFeeOrder &&
                                                    "Biaya Ongkir"}{" "}
                                                {item.item?.event?.name ||
                                                    item.item?.name ||
                                                    "Produk"}
                                            </h3>
                                            {(() => {
                                                // Jangan tampilkan badge jika:
                                                if (isDeliveryFeeOrder)
                                                    return null;
                                                if (
                                                    transaction?.status ===
                                                    "cancelled"
                                                )
                                                    return null;
                                                if (
                                                    transaction?.status ===
                                                        "pending" &&
                                                    isExpired
                                                )
                                                    return null;

                                                // Tampilkan badge untuk semua item yang memiliki status
                                                // Ini termasuk pending_admin, shipping, work, otw, dll
                                                if (item?.status) {
                                                    return (
                                                        <ItemStatusBadge
                                                            status={item.status}
                                                        />
                                                    );
                                                }

                                                return null;
                                            })()}
                                        </div>

                                        <p className="text-xs sm:text-sm text-gray-600 mb-1">
                                            {isDeliveryFeeOrder
                                                ? null
                                                : item?.item_type === "ticket"
                                                ? `Tiket ${item?.item?.name}`
                                                : item?.item_type === "service"
                                                ? "Jasa"
                                                : item?.item_type === "building"
                                                ? "Sewa Gedung"
                                                : item?.item_type ===
                                                  "rent_property"
                                                ? "Sewa Properti"
                                                : item?.item_type}
                                            {!isDeliveryFeeOrder && (
                                                <>
                                                    {" "}
                                                    {item?.qty}{" "}
                                                    {item?.item_type !==
                                                    "ticket"
                                                        ? "Hari"
                                                        : null}
                                                </>
                                            )}
                                        </p>

                                        {/* OPTIMIZED: Display rent_days with day name if available */}
                                        {item?.rent_days && (
                                            <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md w-fit mb-2">
                                                <Calendar className="w-3 h-3" />
                                                <span>
                                                    {formatDateWithShortDay(
                                                        item.rent_days
                                                    )}
                                                </span>
                                            </div>
                                        )}

                                        {/* Price */}
                                        <div className="flex justify-between pt-2 items-center">
                                            <div>
                                                <Link
                                                    className="bg-primary/85 border text-white px-3 py-2 text-sm rounded-md shadow-md"
                                                    href={`chat/${
                                                        item.item_type !==
                                                        "ticket"
                                                            ? item?.item?.user
                                                                  ?.uuid
                                                            : item?.item?.event
                                                                  ?.user?.uuid
                                                    }`}
                                                >
                                                    {" "}
                                                    Chat
                                                </Link>
                                            </div>
                                            <div className="mt-2">
                                                <p className="font-bold text-sm sm:text-base text-gray-900">
                                                    Rp{" "}
                                                    {formatRupiah(
                                                        item.price * item.qty
                                                    )}
                                                </p>

                                                {!isDeliveryFeeOrder && (
                                                    <p className="text-xs text-gray-500">
                                                        Harga Satuan Rp{" "}
                                                        {formatRupiah(
                                                            item.price
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Rating section: show existing review (shadcn Card) or the rating button */}
                                        {item?.reviews_id || item?.review ? (
                                            <Card className="mt-3 bg-emerald-50 border-emerald-200">
                                                <CardContent className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold text-emerald-700">
                                                            Ulasan terkirim
                                                        </span>
                                                    </div>
                                                    {Number(
                                                        item?.review?.rating
                                                    ) > 0 && (
                                                        <div className="mt-2 flex items-center justify-start">
                                                            <Rating
                                                                initialRating={
                                                                    Number(
                                                                        item
                                                                            ?.review
                                                                            ?.rating
                                                                    ) || 0
                                                                }
                                                                emptySymbol={
                                                                    <IoStarOutline className="text-gray-300 text-lg" />
                                                                }
                                                                fullSymbol={
                                                                    <IoStar className="text-yellow-500 text-lg" />
                                                                }
                                                                readonly
                                                            />
                                                        </div>
                                                    )}
                                                    {item?.review?.comment && (
                                                        <p className="mt-2 text-sm text-gray-700">
                                                            {
                                                                item.review
                                                                    .comment
                                                            }
                                                        </p>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ) : (
                                            shouldShowCompletedState &&
                                            item?.status !== "sold_out" && (
                                                <div className="mt-3">
                                                    <Dialog
                                                        onOpenChange={(open) =>
                                                            setIsRatingDialogOpen(
                                                                open
                                                                    ? item.id
                                                                    : null
                                                            )
                                                        }
                                                    >
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                size="sm"
                                                                className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs"
                                                            >
                                                                Beri Ulasan
                                                            </Button>
                                                        </DialogTrigger>

                                                        <RatingDialog
                                                            transaction={
                                                                transaction
                                                            }
                                                            item={item}
                                                            onRatingSubmit={(
                                                                _id,
                                                                rating,
                                                                comment,
                                                                item_type,
                                                                item
                                                            ) =>
                                                                handleRating(
                                                                    transaction.order_id,
                                                                    rating,
                                                                    comment,
                                                                    item_type,
                                                                    item
                                                                )
                                                            }
                                                            isLoading={
                                                                isLoading
                                                            }
                                                            item_type={
                                                                item?.item_type
                                                            }
                                                            onClose={() =>
                                                                setIsRatingDialogOpen(
                                                                    null
                                                                )
                                                            }
                                                        />
                                                    </Dialog>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <Separator className="my-4" />
                    {transaction?.tax && (
                        <p className="text-sm font-semibold text-muted-foreground mb-4">
                            Pajak : Rp. {formatRupiah(transaction.tax ?? 0)}
                        </p>
                    )}

                    {/* Footer: Countdown + Total */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        {transaction?.status === "pending" && (
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-amber-600" />
                                <Countdown
                                    expired_at={transaction.expired_at}
                                    onExpired={() => setIsExpired(true)}
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-2 ml-auto">
                            <span className="text-sm text-gray-600">
                                Total:
                            </span>
                            <span className="font-bold text-lg text-gray-900">
                                Rp {formatRupiah(transaction.total)}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {transaction?.status === "pending" && !isExpired && (
                        <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t">
                            {/* Pay Button */}
                            <Dialog
                                open={isPaymentDialogOpen}
                                onOpenChange={setIsPaymentDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button className="w-full sm:flex-1 bg-blue-500 hover:bg-blue-600 text-sm sm:text-base">
                                        <CreditCard className="w-4 h-4 mr-2" />
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
                                    <div className="space-y-4 py-4">
                                        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                                            <CardContent className="p-4 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">
                                                        Order ID:
                                                    </span>
                                                    <span className="font-mono font-medium text-sm">
                                                        {transaction.order_id}
                                                    </span>
                                                </div>
                                                <Separator />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        Total:
                                                    </span>
                                                    <span className="font-bold text-xl text-blue-600">
                                                        Rp{" "}
                                                        {formatRupiah(
                                                            transaction.total
                                                        )}
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                    <DialogFooter className="gap-2 sm:gap-0">
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

                            {/* Cancel Button - hidden for Delivery Fee (DEL-*) orders */}
                            {!isDeliveryFeeOrder && (
                                <Dialog
                                    open={isCancelDialogOpen}
                                    onOpenChange={setIsCancelDialogOpen}
                                >
                                    <DialogTrigger asChild>
                                        <Button
                                            disabled={isLoading}
                                            variant="destructive"
                                            className="w-full sm:w-auto text-sm sm:text-base"
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
                                        <Card className="bg-red-50 border-red-200">
                                            <CardContent className="p-4 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">
                                                        Order ID:
                                                    </span>
                                                    <span className="font-mono font-medium text-sm">
                                                        {transaction.order_id}
                                                    </span>
                                                </div>
                                                <Separator />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">
                                                        Total:
                                                    </span>
                                                    <span className="font-bold text-lg text-red-600">
                                                        Rp{" "}
                                                        {formatRupiah(
                                                            transaction.total
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="mt-3 p-3 bg-red-100 rounded-lg text-sm text-red-700 flex items-start gap-2">
                                                    <span className="text-lg">
                                                        ⚠️
                                                    </span>
                                                    <span>
                                                        Transaksi yang
                                                        dibatalkan tidak dapat
                                                        dikembalikan
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <DialogFooter className="gap-2 sm:gap-0">
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
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }
);

/**
 * ===================================
 * OPTIMIZED: MAIN PURCHASE INDEX COMPONENT
 * ===================================
 * - O(1) status mapping with constant object
 * - Improved responsive tabs design
 * - Enhanced UI with shadcn components
 * - Optimized rendering with useMemo and useCallback
 * - Better mobile experience
 */

// OPTIMIZED: O(1) status mapping lookup
const STATUS_MAPPING = {
    pending: "unpaid",
    settlement: "paid",
    shipping: "shipped",
    success: "completed",
    cancel: "cancelled",
    cancelled: "cancelled",
    pending_admin: "pending_admin",
};

// OPTIMIZED: Tab configuration array for easy maintenance
const TAB_CONFIG = [
    { key: "all", label: "Semua", icon: ShoppingCart },
    { key: "unpaid", label: "Belum Bayar", icon: Clock },
    { key: "paid", label: "Sudah Bayar", icon: CheckCircle2 },
    { key: "pending_admin", label: "Menunggu Konfirmasi", icon: Clock },
    { key: "shipped", label: "Dalam Perjalanan", icon: MapPin },
    { key: "completed", label: "Selesai", icon: CheckCircle2 },
    { key: "cancelled", label: "Dibatalkan", icon: Package },
];

export default function PurchaseIndex() {
    const { transactions, ziggy} = usePage().props;
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState("");
    const [allTransactions, setAllTransactions] = useState(transactions);
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancellingOrderId, setCancellingOrderId] = useState(null);
    const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(null);

    const searchParams = new URLSearchParams(window.location.search);
    const currentTab = searchParams.get("tab") || "all";

    // OPTIMIZED: Memoized getThumbnail function
    const getThumbnail = useCallback(
        (item) => {
            const thumb =
                item?.thumbnail ||
                item?.item?.thumbnail ||
                item?.item?.event?.thumbnail;
            if (!thumb) return "/default.png";
            return thumb.includes("default-event-images")
                ? `${ziggy.url}/storage${thumb}`
                : `${ziggy.url}/storage/thumbnails/${thumb}`;
        },
        [ziggy.url]
    );

    // OPTIMIZED: Memoized filtered transactions with O(1) status lookup
    // Updated to check BOTH transaction status AND item status
    const filteredTransactions = useMemo(() => {
        if (currentTab === "all") return allTransactions;
        
        return allTransactions.filter((trx) => {
            // First check transaction-level status
            if (STATUS_MAPPING[trx.status] === currentTab) {
                return true;
            }
            
            // Then check if ANY item has the matching status
            // This handles cases like "pending_admin" and "shipping" which are item-level statuses
            if (trx.items && Array.isArray(trx.items)) {
                return trx.items.some((item) => {
                    // Map item status to tab status
                    const itemStatusMap = {
                        pending_admin: "pending_admin",
                        shipping: "shipped",
                        otw: "shipped",
                        work: "shipped",
                        completed: "completed",
                    };
                    
                    return itemStatusMap[item.status] === currentTab;
                });
            }
            
            return false;
        });
    }, [allTransactions, currentTab]);

    // Auto-open rating dialog for the first completed item without a review
    useEffect(() => {
        try {
            const firstPendingReviewItem = (allTransactions || [])
                .flatMap((trx) => trx?.items || [])
                .find(
                    (item) =>
                        item?.status === "completed" &&
                        (item?.reviews_id == null || item?.rating == null)
                );

            if (firstPendingReviewItem) {
                // Do not override if a dialog is already open
                setIsRatingDialogOpen(
                    (prev) => prev ?? firstPendingReviewItem.id
                );
            }
        } catch (e) {
            // noop: defensive guard
            console.error("Auto-open rating check error:", e);
        }
    }, [allTransactions, currentTab]);

    // Payment handlers
    const handlePay = useCallback((snapToken) => {
        if (!window.snap) {
            toast.error("Midtrans Snap belum dimuat. Silakan refresh halaman.");
            return;
        }

        window.snap.pay(snapToken, {
            onSuccess: () => {
                toast.success("Pembayaran berhasil!");
                router.reload();
            },
            onPending: () => {
                toast.warning(
                    "Pembayaran pending. Silakan cek status pembayaran."
                );
            },
            onError: () => {
                toast.error("Terjadi kesalahan dalam pembayaran.");
            },
            onClose: () => {
                toast.info("Anda menutup jendela pembayaran.");
            },
        });
    }, []);

    const handleRedirectPay = useCallback((redirectUrl) => {
        try {
            window.open(redirectUrl, "_blank", "noopener,noreferrer");
            toast.info("Jendela pembayaran dibuka di tab baru.");
        } catch (e) {
            // Fallback to in-app modal if popup blocked
            setPaymentUrl(redirectUrl);
            setShowPaymentModal(true);
        }
    }, []);

    const closePaymentModal = useCallback(() => {
        setShowPaymentModal(false);
        setPaymentUrl("");
        router.reload();
    }, []);

    // Cancel transaction handler
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
                router.visit(window.location.href, {
                    // Jika ingin hanya muat ulang props tertentu:
                    // only: ['transactions'],
                    // Pertahankan posisi scroll
                    preserveScroll: true,
                    // Ganti history state agar terlihat seperti reload
                    replace: true,
                });
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

    // Rating handler
    const handleRating = useCallback(
        (orderId, rating, comment, item_type, item) => {
            setIsCancelling(true);
            setCancellingOrderId(orderId);

            router.post(
                route("mitra.rating.store", { orderId }),
                {
                    rating,
                    comment,
                    item_type,
                    item_id:
                        item_type === "ticket"
                            ? item?.item?.event?.id
                            : item?.item_id,
                    day_rent: item?.rent_days,
                    transaction_item_id: item?.id,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success("Ulasan berhasil dikirim!");

                        // Optimistically update UI so the review card (shadcn) shows immediately
                        setAllTransactions((prev) =>
                            (prev || []).map((trx) => {
                                if (trx?.order_id !== orderId) return trx;
                                return {
                                    ...trx,
                                    items: (trx.items || []).map((it) => {
                                        const matches =
                                            (item_type === "ticket"
                                                ? it?.item?.event?.id ===
                                                  item?.item?.event?.id
                                                : it?.item_id ===
                                                  item?.item_id) &&
                                            (it?.item_type === item_type ||
                                                it?.item_type?.toLowerCase?.() ===
                                                    item_type?.toLowerCase?.()) &&
                                            (item?.rent_days
                                                ? String(it?.rent_days) ===
                                                  String(item?.rent_days)
                                                : true);

                                        if (!matches) return it;

                                        return {
                                            ...it,
                                            // Mark as reviewed so the button hides and card shows
                                            reviews_id: it?.reviews_id ?? -1,
                                            // Populate display fields for the shadcn card using review relation
                                            review: {
                                                rating,
                                                comment,
                                            },
                                        };
                                    }),
                                };
                            })
                        );

                        setIsRatingDialogOpen(null);
                        // Ensure server state is reflected after local optimistic update
                        router.reload();
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

    // OPTIMIZED: Memoized transaction renderer
    const renderTransaction = useCallback(
        (transaction) => (
            <TransactionItem
                key={transaction?.id}
                transaction={transaction}
                onPay={handlePay}
                onRedirectPay={handleRedirectPay}
                getThumbnail={getThumbnail}
                handleCancel={handleCancel}
                handleRating={handleRating}
                isLoading={
                    isCancelling && cancellingOrderId === transaction?.order_id
                }
                isRatingDialogOpen={isRatingDialogOpen}
                setIsRatingDialogOpen={setIsRatingDialogOpen}
                ziggy={ziggy}
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
            ziggy,
        ]
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Head title="Pembelian" />

            <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                        Pembelian Saya
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600">
                        Kelola dan lacak semua transaksi pembelian Anda
                    </p>
                </div>

                {/* OPTIMIZED: Enhanced Tabs with horizontal scrolling on mobile */}
                <Tabs defaultValue={currentTab} className="w-full">
                    <div className="relative mb-6">
                        <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                            <TabsList className="inline-flex w-auto min-w-full bg-white rounded-lg p-1 shadow-sm border">
                                {TAB_CONFIG.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <Link
                                            key={tab.key}
                                            href={`/purchase?tab=${tab.key}`}
                                            preserveScroll
                                            preserveState
                                        >
                                            <TabsTrigger
                                                value={tab.key}
                                                className="flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-white hover:bg-primary/5 transition-all"
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span>{tab.label}</span>
                                            </TabsTrigger>
                                        </Link>
                                    );
                                })}
                            </TabsList>
                        </div>

                        {/* Shadow Kiri: Mulai dari gray-50 (sesuai background) ke transparan */}
                        <div
                            className="absolute top-0 bottom-2 left-0 w-5 
                   bg-gradient-to-r from-gray-50 to-transparent 
                   pointer-events-none"
                        />

                        {/* Shadow Kanan: Mulai dari gray-50 (sesuai background) ke transparan */}
                        <div
                            className="absolute top-0 bottom-2 right-0 w-5
                   bg-gradient-to-l from-gray-50 to-transparent 
                   pointer-events-none"
                        />
                    </div>

                    {TAB_CONFIG.map((tab) => (
                        <TabsContent
                            key={tab.key}
                            value={tab.key}
                            className="mt-0"
                        >
                            {filteredTransactions.length === 0 ? (
                                <Card className="p-8 sm:p-12 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                            <Package className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                Tidak ada transaksi
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                Anda belum memiliki transaksi di
                                                kategori ini
                                            </p>
                                        </div>
                                        <Button asChild className="mt-2">
                                            <Link href="/">Mulai Belanja</Link>
                                        </Button>
                                    </div>
                                </Card>
                            ) : (
                                filteredTransactions.map(renderTransaction)
                            )}
                        </TabsContent>
                    ))}
                </Tabs>

                {/* Payment Modal */}
                {showPaymentModal && (
                    <Dialog
                        open={showPaymentModal}
                        onOpenChange={setShowPaymentModal}
                    >
                        <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0">
                            <DialogHeader className="p-6 pb-0">
                                <DialogTitle>Lakukan Pembayaran</DialogTitle>
                                <DialogDescription>
                                    Silakan lakukan pembayaran melalui gateway
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto p-6 pt-4">
                                <div className="h-[70vh] w-full">
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
                                    <Button
                                        onClick={closePaymentModal}
                                        className="w-full sm:w-auto"
                                    >
                                        Selesai
                                    </Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    );
}

PurchaseIndex.layout = (page) => <MainLayout children={page} />;
