import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import { Alert, AlertDescription } from "@/components/ui/alert.jsx";
import { formatTanggalIndo } from "@/Utils/formatDateTime.js";
import { formatRupiah } from "@/Utils/formatRupiah.js";
import { Head, Link, router, usePage } from "@inertiajs/react";
import axios from "axios";
import {
    ArrowLeft,
    Loader2,
    MapPin,
    Clock,
    User,
    AlertTriangle,
} from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { addItemsToCart } from "@/Utils/Cart/addToCartHelper";
import { toast } from "sonner";

import { useMidtrans } from "@/hooks/usePaymentMidtrans";
import { useTicketSelection } from "@/hooks/useTicketSelection";
import { PaymentSheet } from "@/Components/paymentSheet";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import MainLayout from "@/Layouts/Main.jsx";
import ReviewSection from "@/Components/ReviewSection.jsx";
import { createPaymentPayload } from "@/Utils/PaymentHelper.js";
import ReportModal from "@/Components/ReportModal.jsx";
import { Flag } from "lucide-react";

const getEventStatus = (eventData) => {
    const now = new Date();
    const eventEnd = new Date(eventData.event_date_end);
    const eventStart = new Date(eventData.event_date_start);
    const ticketEnd = new Date(eventData.ticket_date_end);

    const status = {
        isOver: now > eventEnd,
        isLive: now >= eventStart && now <= eventEnd,
        isSaleOver: now > ticketEnd,
        message: "",
    };

    if (status.isOver) {
        status.message = "Event telah berakhir,";
    } else if (status.isSaleOver) {
        status.message = "Waktu penjualan tiket sudah habis.";
    } else if (status.isLive) {
        status.message = "Event sedang berlangsung.";
    } else {
        status.message = "Tiket masih tersedia.";
    }

    return status;
};

// Countdown Timer Component
const CountdownTimer = ({ targetDate, onComplete }) => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const difference = target - now;

            if (difference <= 0) {
                setIsExpired(true);
                onComplete?.();
                return {
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                };
            }

            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor(
                    (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
                ),
                minutes: Math.floor(
                    (difference % (1000 * 60 * 60)) / (1000 * 60)
                ),
                seconds: Math.floor((difference % (1000 * 60)) / 1000),
            };
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate, onComplete]);

    if (isExpired) {
        return null;
    }

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-900">
                    Penjualan Tiket Dimulai Dalam:
                </h3>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-white rounded p-2 shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">
                        {timeLeft.days}
                    </div>
                    <div className="text-xs text-gray-600">Hari</div>
                </div>
                <div className="bg-white rounded p-2 shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">
                        {timeLeft.hours}
                    </div>
                    <div className="text-xs text-gray-600">Jam</div>
                </div>
                <div className="bg-white rounded p-2 shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">
                        {timeLeft.minutes}
                    </div>
                    <div className="text-xs text-gray-600">Menit</div>
                </div>
                <div className="bg-white rounded p-2 shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">
                        {timeLeft.seconds}
                    </div>
                    <div className="text-xs text-gray-600">Detik</div>
                </div>
            </div>
        </div>
    );
};

// SpeakerCard Component
const SpeakerCard = ({ speaker, baseUrl, onImageLoad }) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    const handleImageLoad = useCallback(() => {
        setImageLoaded(true);
        onImageLoad?.(speaker.id);
    }, [speaker.id, onImageLoad]);

    return (
        <div className="relative flex flex-col items-center justify-center text-center group">
            {!imageLoaded && (
                <Skeleton className="absolute left-1/2 h-20 w-20 sm:h-24 sm:w-24 rounded-full -translate-x-1/2 top-0" />
            )}
            <div className="relative">
                <img
                    src={`${baseUrl}/storage/speakers/${speaker.photo}`}
                    alt={speaker.name}
                    className={`h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 object-cover shadow-lg transition-all duration-300 ${
                        imageLoaded
                            ? "opacity-100 group-hover:scale-105"
                            : "opacity-0"
                    }`}
                    onLoad={handleImageLoad}
                    loading="lazy"
                />
            </div>
            <div className="mt-3 space-y-1 text-center w-full px-1">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2">
                    {speaker.name}
                </h3>
                <p className="text-xs text-gray-600 line-clamp-2">
                    {speaker.description}
                </p>
            </div>
        </div>
    );
};

// Ticket Stock Badge Component
const TicketStockBadge = ({ ticket }) => {
    const remaining = ticket.remaining ?? 0;
    const percentage =
        ticket.quantity > 0 ? (remaining / ticket.quantity) * 100 : 0;

    if (ticket.quota === 99999999) {
        return <Badge variant="destructive">Tiket Gratis!!</Badge>;
    }

    if (ticket.is_sold_out) {
        return (
            <Badge variant="destructive" className="ml-2">
                {ticket?.name} Habis
            </Badge>
        );
    }

    if (percentage <= 10) {
        return (
            <Badge variant="destructive" className="ml-2">
                {ticket?.name} Sisa {remaining}
            </Badge>
        );
    }

    if (percentage <= 30) {
        return (
            <Badge
                variant="outline"
                className="ml-2 border-yellow-600 text-yellow-600"
            >
                {ticket?.name} Sisa {remaining}
            </Badge>
        );
    }

    return (
        <Badge variant="outline" className="text-muted-foreground">
            {ticket?.name === "Free" ? "Gratis" : ticket.name} Tersedia
            <span className="text-bold text-black ps-1">{remaining} Tiket</span>
        </Badge>
    );
};

export default function ShowEvent() {
    const { event, auth, ziggy, alreadyRegistered, tax_info } = usePage().props;

    const [latitude, longitude] = event?.pin ? event.pin.split(",") : ["", ""];

    const embedSrc = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;

    const dispatch = useDispatch();
    const [isPaying, setIsPaying] = useState(false);
    const [isCart, setIsCart] = useState(false);
    const eventStatus = getEventStatus(event);
    const [isLoadingFree, setIsLoadingFree] = useState(false);
    const [imageLoadedStates, setImageLoadedStates] = useState({});
    const [showRefreshAlert, setShowRefreshAlert] = useState(false);
    const [isSaleActive, setIsSaleActive] = useState(() => {
        if (!event.ticket_date_start) return true;
        const now = new Date().getTime();
        const saleStart = new Date(event.ticket_date_start).getTime();
        return now >= saleStart;
    });
    const isEventBanned = event.status === "banned";
    const [showReportModal, setShowReportModal] = useState(false);

    const { snapLoaded, paymentError, setPaymentError } = useMidtrans();
    const {
        ticketCounts,
        handleChangeTicket,
        totalHarga,
        hasSelectedTickets,
        resetTicketCounts,
    } = useTicketSelection(event.tickets);

    // Dynamic tax calculation based on event.tax_info (percentage | fixed)
    const finalTaxAmount = useMemo(() => {
        const subtotal = Number(totalHarga) || 0;
        if (subtotal <= 0) return 0;

        const info = tax_info;
        if (!info) return 0;

        const rawValue =
            typeof info.value === "string"
                ? parseFloat(info.value)
                : Number(info.value || 0);
        if (!rawValue || Number.isNaN(rawValue)) return 0;

        if (info.type === "fixed") {
            return Math.round(rawValue);
        }
        if (info.type === "percent") {
            return Math.round(subtotal * (rawValue / 100));
        }

        return 0;
    }, [totalHarga, tax_info]);

    // Descriptive tax label to be shown on PaymentSheet
    const taxLabel = useMemo(() => {
        const info = tax_info;
        if (!info) return "";
        if (info.label && typeof info.label === "string") return info.label;

        const rawValue =
            typeof info.value === "string"
                ? parseFloat(info.value)
                : Number(info.value || 0);
        if (Number.isNaN(rawValue)) return "Pajak";

        if (info.type === "percent") {
            return `Pajak (${rawValue.toFixed(2)}%)`;
        }
        if (info.type === "fixed") {
            return `Pajak (Rp ${formatRupiah(rawValue)})`;
        }
        return "Pajak";
    }, [tax_info]);

    // Check if ticket sale has started
    useEffect(() => {
        const checkSaleStatus = () => {
            const now = new Date().getTime();
            const saleStart = new Date(event.ticket_date_start).getTime();
            setIsSaleActive(now >= saleStart);
        };

        checkSaleStatus();
        const interval = setInterval(checkSaleStatus, 1000);

        return () => clearInterval(interval);
    }, [event.ticket_date_start]);

    const handleCountdownComplete = useCallback(() => {
        setShowRefreshAlert(true);
        toast.success("Penjualan tiket telah dibuka!", {
            description: "Silakan refresh halaman untuk membeli tiket",
            duration: 5000,
        });
    }, []);

    const paidTickets = useMemo(
        () => event.tickets.filter((ticket) => Number(ticket?.price) > 0),
        [event.tickets]
    );

    // Determine when to use a virtual default free ticket (when no tickets were provided)
    const hasDefaultFreeTicket = useMemo(() => {
        const tickets = event?.tickets;
        return Array.isArray(tickets) && tickets.length === 0;
    }, [event.tickets]);

    const defaultFreeTicket = useMemo(() => {
        if (!hasDefaultFreeTicket) return null;
        return {
            id: -1,
            name: "Free",
            price: 0,
            quantity: 9999999, // signifies unlimited
            remaining: 9999999, // for stock badges and UI
            is_sold_out: false,
            is_free: true,
        };
    }, [hasDefaultFreeTicket]);

    // Free ticket prioritization:
    // 1) If event had no tickets, use a virtual default free ticket
    // 2) Otherwise, find a free ticket by price (0), known names, or virtual id
    const freeTicket = useMemo(() => {
        if (hasDefaultFreeTicket) return defaultFreeTicket;

        return (
            event.tickets.find((ticket) => {
                const priceZero = Number(ticket?.price) === 0;
                const namedFree =
                    String(ticket?.name || "").toLowerCase() === "free" ||
                    String(ticket?.name || "").toLowerCase() === "free default";
                const virtualId =
                    typeof ticket?.id === "number" && ticket.id < 0;
                return priceZero || namedFree || virtualId;
            }) || null
        );
    }, [event.tickets, hasDefaultFreeTicket, defaultFreeTicket]);

    const thumbnailUrl = useMemo(() => {
        const baseUrl = ziggy.url;
        return event.thumbnail.includes("default-event-images")
            ? `${baseUrl}/storage${event.thumbnail}`
            : `${baseUrl}/storage/thumbnails/${event.thumbnail}`;
    }, [event.thumbnail, ziggy.url]);

    // Check if all paid tickets are sold out
    const allPaidTicketsSoldOut = useMemo(() => {
        return (
            paidTickets.length > 0 &&
            paidTickets.every((ticket) => ticket.is_sold_out)
        );
    }, [paidTickets]);

    const handlePay = useCallback(
        async (e) => {
            if (e) e.preventDefault();

            if (!hasSelectedTickets) {
                setPaymentError("Silakan pilih minimal satu tiket");
                return;
            }

            if (totalHarga < 1000) {
                setPaymentError("Minimum pembayaran adalah Rp. 1.000");
                return;
            }

            if (!snapLoaded || !window.snap) {
                setPaymentError(
                    "Sistem pembayaran belum siap. Silakan refresh halaman."
                );
                return;
            }

            if (auth.user.id === event.user.id) {
                setPaymentError("Kamu tidak bisa membeli tiket sendiri.");
                toast.error("Kamu tidak bisa membeli tiket sendiri.");
                return;
            }

            setPaymentError(null);
            setIsPaying(true);

            try {
                // VALIDASI REAL-TIME KE DATABASE
                const ticketsToValidate = Object.entries(ticketCounts)
                    .filter(([_, count]) => count > 0)
                    .map(([ticketId, quantity]) => ({
                        id: parseInt(ticketId),
                        quantity,
                    }));

                const validationResponse = await axios.post(
                    "/tickets/check-availability",
                    { tickets: ticketsToValidate },
                    {
                        timeout: 10000,
                        headers: {
                            "Content-Type": "application/json",
                            "X-Requested-With": "XMLHttpRequest",
                        },
                    }
                );

                if (!validationResponse.data.success) {
                    setIsPaying(false);
                    const unavailable =
                        validationResponse.data.unavailable_tickets;
                    const message = unavailable
                        .map(
                            (t) =>
                                `${t.name}: diminta ${t.requested}, tersedia ${t.available}`
                        )
                        .join(", ");
                    setPaymentError(
                        `Stok tidak mencukupi. ${message}. Halaman akan di-refresh.`
                    );
                    toast.error("Stok tiket tidak mencukupi");
                    setTimeout(() => {
                        router.reload();
                    }, 2000);
                    return;
                }

                // Create items array for PaymentHelper
                const ticketItems = Object.entries(ticketCounts)
                    .filter(([_, count]) => count > 0)
                    .map(([ticketId, quantity]) => {
                        const ticket = event.tickets.find(
                            (t) => t.id === parseInt(ticketId)
                        );
                        return {
                            ...ticket,
                            id: parseInt(ticketId),
                            type: "ticket",
                            quantity,
                            name: `${event.name} (${ticket.name})`,
                        };
                    });

                // Use PaymentHelper to create payment payload for each ticket
                // For events, we need to handle multiple tickets differently
                const allItems = [];
                let subtotalAmount = 0;

                ticketItems.forEach((ticketItem) => {
                    // For each ticket, create a separate payload but we'll combine them
                    const ticketPayload = createPaymentPayload(
                        ticketItem,
                        ticketItem.quantity,
                        auth.user,
                        null // Events don't use shipping address
                    );

                    allItems.push(...ticketPayload.items);
                    subtotalAmount += ticketPayload.amount;
                });

                // Enrich items with event thumbnail URL for Midtrans payload
                const itemsWithThumbnail = allItems.map((item) => ({
                    ...item,
                    thumbnail: thumbnailUrl, // full URL from computed event thumbnail
                }));

                const paymentData = {
                    items: itemsWithThumbnail,
                    amount: subtotalAmount,
                    name: auth.user.name,
                    email: auth.user.email,
                };

                const response = await axios.post(
                    "/midtrans/token",
                    paymentData,
                    {
                        timeout: 30000,
                        headers: {
                            "Content-Type": "application/json",
                            "X-Requested-With": "XMLHttpRequest",
                        },
                    }
                );

                const { token: snapToken } = response.data;

                if (!snapToken) {
                    throw new Error("Token pembayaran tidak diterima");
                }

                window.snap.pay(snapToken, {
                    skipOrderSummary: false,
                    onSuccess: (result) => {
                        resetTicketCounts();
                        setIsPaying(false);
                        router.visit("/purchase", {
                            method: "get",
                            preserveState: false,
                        });
                    },
                    onPending: (result) => {
                        resetTicketCounts();
                        setIsPaying(false);
                        router.visit("/purchase", {
                            method: "get",
                            preserveState: false,
                        });
                    },
                    onError: (error) => {
                        console.error("Payment error:", error);
                        setIsPaying(false);
                        setPaymentError(
                            "Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi."
                        );
                    },
                    onClose: () => {
                        router.visit("/purchase", {
                            method: "get",
                            preserveState: false,
                        });
                        setIsPaying(false);
                    },
                });
            } catch (error) {
                console.error("Payment initialization error:", error);
                setIsPaying(false);

                let errorMessage =
                    "Terjadi kesalahan saat memproses pembayaran";

                if (error.response?.status === 400) {
                    // Error dari validasi stok
                    errorMessage = error.response.data.message;
                    setTimeout(() => {
                        router.reload();
                    }, 2000);
                } else if (error.response?.data?.error) {
                    errorMessage = error.response.data.error;
                } else if (error.response?.status === 422) {
                    errorMessage = "Data tidak valid. Silakan periksa kembali";
                } else if (error.response?.status === 500) {
                    errorMessage =
                        "Terjadi kesalahan server. Silakan coba lagi";
                } else if (error.code === "ECONNABORTED") {
                    errorMessage = "Koneksi timeout. Silakan coba lagi";
                } else if (!navigator.onLine) {
                    errorMessage =
                        "Tidak ada koneksi internet. Silakan periksa koneksi Anda";
                }

                setPaymentError(errorMessage);
            }
        },
        [
            hasSelectedTickets,
            totalHarga,
            ticketCounts,
            event.tickets,
            event.name,
            auth.user,
            snapLoaded,
            resetTicketCounts,
        ]
    );

    const handleAddToCart = async () => {
        try {
            if (auth.user.id === event.user.id) {
                setPaymentError("Kamu tidak bisa membeli tiket sendiri.");
                toast.error("Kamu tidak bisa membeli tiket sendiri.");
                return;
            }

            const ticketsToValidate = Object.entries(ticketCounts)
                .filter(([_, count]) => count > 0)
                .map(([ticketId, quantity]) => ({
                    id: parseInt(ticketId),
                    quantity,
                }));

            if (ticketsToValidate.length === 0) {
                toast.error("Silakan pilih minimal satu tiket");
                return;
            }

            const validationResponse = await axios.post(
                "/tickets/check-availability",
                { tickets: ticketsToValidate },
                {
                    timeout: 10000,
                    headers: {
                        "Content-Type": "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                }
            );

            if (!validationResponse.data.success) {
                const unavailable = validationResponse.data.unavailable_tickets;
                const message = unavailable
                    .map((t) => `${t.name} (tersedia: ${t.available})`)
                    .join(", ");
                toast.error(`Stok tidak mencukupi: ${message}`);
                setTimeout(() => {
                    router.reload();
                }, 2000);
                return;
            }

            setIsCart(true);
            const result = await addItemsToCart({
                items: ticketCounts,
                itemList: event.tickets,
                rentDays: 1,
                dispatch,
                itemCategory: "ticket",
            });

            if (result.success) {
                toast.success(`${event.name} ditambahkan ke keranjang`);
                resetTicketCounts();
            } else {
                toast.warning(result.message);
            }
        } catch (error) {
            console.error("Error adding to cart:", error);
            if (error.response?.status === 400) {
                toast.error("Stok tiket tidak mencukupi");
                setTimeout(() => {
                    router.reload();
                }, 2000);
            } else {
                toast.error("Gagal menambahkan ke keranjang");
            }
        } finally {
            setIsCart(false);
        }
    };

    const handleFree = async () => {
        if (freeTicket && freeTicket.is_sold_out) {
            toast.error("Tiket gratis sudah habis");
            return;
        }

        if (alreadyRegistered) {
            toast.error("Anda Sudah Mengambil Tiket Gratis!!");
            return;
        }

        if (auth.user.id === event.user.id) {
            setPaymentError("Kamu tidak bisa membeli tiket sendiri.");
            toast.error("Kamu tidak bisa membeli tiket sendiri.");
            return;
        }

        try {
            setIsLoadingFree(true);
            const paymentData = {
                items: [
                    {
                        id: freeTicket?.id,
                        quantity: 1,
                        type: "ticket",
                    },
                ],
                amount: 0,
                name: auth.user.name,
                email: auth.user.email,
            };

            const response = await axios.post("/event/free", paymentData, {
                timeout: 30000,
                headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
            });

            if (response.data.success) {
                setIsLoadingFree(false);
                toast.success("Berhasil Mengambil Tiket Gratis");
                router.reload();
            } else {
                console.error("Transaksi gagal:", response.data.message);
                setIsLoadingFree(false);
                alert("Transaksi gagal: " + response.data.message);
            }
        } catch (error) {
            setIsLoadingFree(false);
            console.error("Error saat membuat transaksi:", error);
            alert(
                "Terjadi kesalahan saat membuat transaksi. Silakan coba lagi."
            );
        }
    };

    const handleImageLoad = useCallback((speakerId) => {
        setImageLoadedStates((prev) => ({
            ...prev,
            [speakerId]: true,
        }));
    }, []);

    return (
        <>
            <Head title={event.name} />
            <div className="mx-auto my-4 min-h-screen max-w-[1000px] p-4">
                {paymentError && (
                    <Alert variant="destructive" className="my-4">
                        <AlertDescription>{paymentError}</AlertDescription>
                    </Alert>
                )}

                {allPaidTicketsSoldOut && !freeTicket && (
                    <Alert className="my-4 border-yellow-600">
                        <AlertDescription className="text-yellow-600">
                            Semua tiket untuk event ini sudah habis
                        </AlertDescription>
                    </Alert>
                )}

                <Button
                    onClick={() => window.history.back()}
                    variant="outline"
                    size="sm"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                </Button>

                <div className="my-6 flex flex-col lg:flex-row gap-6">
                    {/* Image Section - Full width on mobile */}
                    <div className="flex-shrink-0 mx-1 lg:mx-0">
                        <img
                            src={thumbnailUrl}
                            alt={event.name}
                            className="w-full lg:w-52 rounded object-cover shadow max-h-80"
                            loading="lazy"
                        />
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 lg:flex lg:gap-6">
                        {/* Left Content */}
                        <div className="flex-1">
                            <h1 className="mb-2 text-2xl lg:text-4xl font-bold">
                                {event.name}
                            </h1>
                            <Badge className="mb-2" variant="secondary">
                                {event.event_mode}
                            </Badge>

                            <div className="space-y-1 text-sm text-muted-foreground">
                                <p className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {event.location}
                                </p>
                                <p className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    Diselenggarakan oleh {event.user.name}
                                </p>
                                <p className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {formatTanggalIndo(event.event_date_start)}
                                </p>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {event.tickets.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="flex items-center"
                                    >
                                        <TicketStockBadge ticket={ticket} />
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Right Action Section */}
                        <div className="flex flex-col gap-2 lg:min-w-[240px] mt-6 lg:mt-0">
                            <div className="text-center lg:text-right bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-sm text-muted-foreground">
                                    Terbuka Hingga
                                </h3>
                                <p className="font-medium">
                                    {formatTanggalIndo(event.event_date_start)}
                                </p>
                            </div>

                            {eventStatus.isOver ||
                            eventStatus.isSaleOver ||
                            isEventBanned ? (
                                <Alert
                                    variant="destructive"
                                    className="mt-2 flex items-start"
                                >
                                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                    <AlertDescription className="text-sm pt-1">
                                        {isEventBanned
                                            ? "Event ini telah dilarang/banned. Tiket tidak dapat dibeli."
                                            : `${eventStatus.message} Tiket tidak dapat dibeli.`}
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <div className="space-y-2">
                                    {eventStatus.isLive && (
                                        <Alert className="bg-green-100 border-green-500 text-green-700">
                                            <Clock className="h-4 w-4" />
                                            <AlertDescription className="text-sm">
                                                {eventStatus.message}
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {!isSaleActive &&
                                        event.ticket_date_start && (
                                            <CountdownTimer
                                                targetDate={
                                                    event.ticket_date_start
                                                }
                                                onComplete={
                                                    handleCountdownComplete
                                                }
                                            />
                                        )}

                                    {isSaleActive && !isEventBanned && (
                                        <>
                                            {freeTicket && (
                                                <>
                                                    {alreadyRegistered ? (
                                                        <Button
                                                            className="w-full border border-green-800 text-green-800 bg-white"
                                                            size="lg"
                                                            disabled
                                                        >
                                                            Sudah mendaftar
                                                            gratis
                                                        </Button>
                                                    ) : freeTicket.is_sold_out ? (
                                                        <Button
                                                            className="w-full"
                                                            size="lg"
                                                            variant="destructive"
                                                            disabled
                                                        >
                                                            Tiket Gratis Habis
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            onClick={handleFree}
                                                            className="w-full"
                                                            size="lg"
                                                            disabled={
                                                                isLoadingFree
                                                            }
                                                        >
                                                            Daftar Gratis!
                                                            {isLoadingFree && (
                                                                <Loader2 className="animate-spin ml-2" />
                                                            )}
                                                        </Button>
                                                    )}
                                                </>
                                            )}

                                            {paidTickets.length > 0 &&
                                                !allPaidTicketsSoldOut && (
                                                    <PaymentSheet
                                                        tickets={paidTickets}
                                                        ticketCounts={
                                                            ticketCounts
                                                        }
                                                        handleChangeTicket={
                                                            handleChangeTicket
                                                        }
                                                        totalHarga={totalHarga}
                                                        hasSelectedTickets={
                                                            hasSelectedTickets
                                                        }
                                                        handlePay={handlePay}
                                                        handleAddToCart={
                                                            handleAddToCart
                                                        }
                                                        isPaying={isPaying}
                                                        snapLoaded={snapLoaded}
                                                        isCart={isCart}
                                                        taxAmount={
                                                            finalTaxAmount
                                                        }
                                                        taxLabel={taxLabel}
                                                    />
                                                )}

                                            {allPaidTicketsSoldOut && (
                                                <Alert className="border-red-600">
                                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                                    <AlertDescription className="text-red-600 text-sm">
                                                        Semua tiket berbayar
                                                        sudah habis
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {!auth.user && (
                                <Link
                                    href={`/login?redirect=${ziggy.location}`}
                                >
                                    <Button
                                        variant="outline"
                                        className="w-full mt-4"
                                        size="lg"
                                    >
                                        Masuk untuk Mendaftar
                                    </Button>
                                </Link>
                            )}

                            {auth.user && auth.user.id !== event.user.id && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowReportModal(true)}
                                    className="mt-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Flag className="h-4 w-4 mr-2" />
                                    Laporkan
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <Separator className="my-8" />

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Deskripsi</h2>
                    {event.description ? (
                        <div
                            className="prose prose-sm max-w-none text-muted-foreground leading-relaxed text-sm"
                            dangerouslySetInnerHTML={{
                                __html: event.description,
                            }}
                        />
                    ) : (
                        <p className="text-muted-foreground">
                            Tidak ada deskripsi untuk acara ini.
                        </p>
                    )}
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-6">Pembicara</h2>
                    {event?.speakers?.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {event.speakers.map((speaker) => (
                                <SpeakerCard
                                    key={speaker.id}
                                    speaker={speaker}
                                    baseUrl={ziggy.url}
                                    onImageLoad={handleImageLoad}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">
                            Belum ada pembicara yang ditentukan untuk acara ini.
                        </p>
                    )}
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Lokasi</h2>
                    <div className="w-full max-w-2xl h-64 sm:h-80 rounded-lg overflow-hidden shadow-md border">
                        <iframe
                            src={embedSrc}
                            className="w-full h-full border-0"
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title={`Lokasi: ${event.name}`}
                            sandbox="allow-scripts allow-same-origin allow-popups"
                        />
                    </div>
                </section>

                {/* Review Section */}
                <section className="mt-8">
                    <ReviewSection
                        itemType="App\Models\Event"
                        itemId={event.id}
                        user={auth?.user}
                    />
                </section>

                {isPaying && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                        <div className="flex flex-col items-center space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="text-sm font-medium">
                                Memproses pembayaran...
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Mohon tunggu sebentar
                            </p>
                        </div>
                    </div>
                )}

                <ReportModal
                    open={showReportModal}
                    onOpenChange={setShowReportModal}
                    type="event"
                    id={event.id}
                />
            </div>
        </>
    );
}

ShowEvent.layout = (page) => <MainLayout>{page}</MainLayout>;
