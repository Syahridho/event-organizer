import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatTanggalIndo } from "@/Utils/formatDateTime";
import { formatRupiah } from "@/Utils/formatRupiah";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { FaShoppingCart } from "react-icons/fa";
import axios from "axios";
import {
    ArrowLeft,
    Loader2,
    MapPin,
    Clock,
    User,
    AlertTriangle,
} from "lucide-react";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addItemsToCart } from "@/Utils/Cart/addToCartHelper";
import { toast } from "sonner";

import { useMidtrans } from "@/hooks/usePaymentMidtrans";
import { useTicketSelection } from "@/hooks/useTicketSelection";
import { PaymentSheet } from "@/components/paymentSheet";
import { Skeleton } from "@/components/ui/skeleton";
import MainLayout from "@/Layouts/Main";

// SpeakerCard Component
const SpeakerCard = ({ speaker, baseUrl, onImageLoad }) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    const handleImageLoad = useCallback(() => {
        setImageLoaded(true);
        onImageLoad?.(speaker.id);
    }, [speaker.id, onImageLoad]);

    return (
        <div className="relative flex flex-col items-center justify-center text-center">
            {!imageLoaded && (
                <Skeleton className="absolute left-1/2 h-24 w-24 rounded-full -translate-x-1/2 top-0" />
            )}
            <img
                src={`${baseUrl}/storage/speakers/${speaker.photo}`}
                alt={speaker.name}
                className={`h-24 w-24 rounded-full border object-cover shadow-md transition-opacity duration-300 ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={handleImageLoad}
                loading="lazy"
            />
            <div className="mt-2 space-y-0.5 text-center">
                <h1 className="truncate text-sm font-medium max-w-[120px]">
                    {speaker.name}
                </h1>
                <p className="text-xs text-gray-500 max-w-[120px] truncate">
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

    if (ticket.name === "Free") {
        return null;
    }

    if (ticket.is_sold_out) {
        return (
            <Badge variant="destructive" className="ml-2">
                Habis
            </Badge>
        );
    }

    if (percentage <= 10) {
        return (
            <Badge variant="destructive" className="ml-2">
                Sisa {remaining}
            </Badge>
        );
    }

    if (percentage <= 30) {
        return (
            <Badge
                variant="outline"
                className="ml-2 border-yellow-600 text-yellow-600"
            >
                Sisa {remaining}
            </Badge>
        );
    }

    return (
        <Badge variant="outline" className="ml-2 text-muted-foreground">
            Tersedia {remaining}
        </Badge>
    );
};

export default function ShowEvent() {
    const { event, auth, ziggy, alreadyRegistered } = usePage().props;
    console.log(event);

    const dispatch = useDispatch();
    const [isPaying, setIsPaying] = useState(false);
    const [isCart, setIsCart] = useState(false);
    const [isLoadingFree, setIsLoadingFree] = useState(false);
    const [imageLoadedStates, setImageLoadedStates] = useState({});

    const { snapLoaded, paymentError, setPaymentError } = useMidtrans();
    const {
        ticketCounts,
        handleChangeTicket,
        totalHarga,
        hasSelectedTickets,
        resetTicketCounts,
    } = useTicketSelection(event.tickets);

    const paidTickets = useMemo(
        () => event.tickets.filter((ticket) => ticket.name !== "Free"),
        [event.tickets]
    );

    const freeTicket = useMemo(
        () => event.tickets.find((ticket) => ticket.name === "Free"),
        [event.tickets]
    );

    const thumbnailUrl = useMemo(() => {
        const baseUrl = ziggy.url;
        return event.thumbnail.includes("randoms")
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

                // Lanjutkan proses pembayaran jika validasi sukses
                const paymentData = {
                    items: Object.entries(ticketCounts)
                        .filter(([_, count]) => count > 0)
                        .map(([ticketId, quantity]) => {
                            const ticket = event.tickets.find(
                                (t) => t.id === parseInt(ticketId)
                            );
                            return {
                                id: parseInt(ticketId),
                                type: "ticket",
                                price: ticket.price,
                                quantity,
                                name: `${event.name} (${ticket.name})`,
                            };
                        }),
                    amount: totalHarga,
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

                const { token: snapToken, order_id } = response.data;

                if (!snapToken) {
                    throw new Error("Token pembayaran tidak diterima");
                }

                window.snap.pay(snapToken, {
                    skipOrderSummary: false,
                    onSuccess: (result) => {
                        console.log("Payment success:", result);
                        resetTicketCounts();
                        setIsPaying(false);
                        router.visit("/purchase", {
                            method: "get",
                            preserveState: false,
                        });
                    },
                    onPending: (result) => {
                        console.log("Payment pending:", result);
                        resetTicketCounts();
                        setIsPaying(false);
                        router.visit("/purchase/pending", {
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
                        console.log("Payment popup closed");
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
            // VALIDASI REAL-TIME KE DATABASE
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
                resetTicketCounts(); // Reset counter setelah berhasil add to cart
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

        try {
            setIsLoadingFree(true);
            const paymentData = {
                items: [
                    {
                        id: event.id,
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

    const totalItems = useSelector((state) =>
        state.cart.items.reduce((sum, item) => sum + item.quantity, 0)
    );

    return (
        <>
            <Head title={`Detail - ${event.name}`} />
            <div className="mx-auto my-12 min-h-screen max-w-[1000px] p-4">
                {paymentError && (
                    <Alert variant="destructive" className="my-4">
                        <AlertDescription>{paymentError}</AlertDescription>
                    </Alert>
                )}

                {allPaidTicketsSoldOut && !freeTicket && (
                    <Alert className="my-4 border-yellow-600">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-600">
                            Semua tiket untuk event ini sudah habis
                        </AlertDescription>
                    </Alert>
                )}

                <div className="my-6 flex flex-col lg:flex-row gap-6">
                    <div className="flex-shrink-0">
                        <img
                            src={thumbnailUrl}
                            alt={event.name}
                            className="w-full max-w-52 rounded shadow-md"
                            loading="lazy"
                        />
                    </div>

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
                                    <Badge variant="outline">
                                        {ticket.name}
                                    </Badge>
                                    <TicketStockBadge ticket={ticket} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:min-w-[200px]">
                        <div className="text-center lg:text-right">
                            <h3 className="text-sm text-muted-foreground">
                                Terbuka Hingga
                            </h3>
                            <p className="font-medium mb-3">
                                {formatTanggalIndo(event.event_date_start)}
                            </p>
                        </div>

                        {auth.user ? (
                            <div className="space-y-2">
                                {freeTicket && (
                                    <>
                                        {alreadyRegistered ? (
                                            <Button
                                                className="w-full border border-green-800 text-green-800 bg-white"
                                                size="lg"
                                                disabled
                                            >
                                                Sudah mendaftar gratis
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
                                                disabled={isLoadingFree}
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
                                            ticketCounts={ticketCounts}
                                            handleChangeTicket={
                                                handleChangeTicket
                                            }
                                            totalHarga={totalHarga}
                                            hasSelectedTickets={
                                                hasSelectedTickets
                                            }
                                            handlePay={handlePay}
                                            handleAddToCart={handleAddToCart}
                                            isPaying={isPaying}
                                            snapLoaded={snapLoaded}
                                            isCart={isCart}
                                        />
                                    )}

                                {allPaidTicketsSoldOut && (
                                    <Alert className="border-red-600">
                                        <AlertTriangle className="h-4 w-4 text-red-600" />
                                        <AlertDescription className="text-red-600 text-sm">
                                            Semua tiket berbayar sudah habis
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        ) : (
                            <Link href="/login">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    size="lg"
                                >
                                    Masuk untuk Mendaftar
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                <Separator className="my-8" />

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Deskripsi</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        {event.description ||
                            "Tidak ada deskripsi untuk acara ini."}
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Pembicara</h2>
                    {event?.speakers?.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
                        <p className="text-muted-foreground">
                            Belum ada pembicara yang ditentukan untuk acara ini.
                        </p>
                    )}
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Lokasi</h2>
                    <div className="w-full max-w-md h-64 rounded-lg overflow-hidden shadow-md">
                        <iframe
                            src="https://www.google.com/maps?q=0.5761133,101.4252478&z=15&output=embed"
                            className="w-full h-full border-0"
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Event Location"
                        />
                    </div>
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
            </div>
        </>
    );
}

ShowEvent.layout = (page) => <MainLayout>{page}</MainLayout>;
