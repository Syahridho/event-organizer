import React, { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { ArrowLeft, MapPin, Users, Loader2, Flag } from "lucide-react";
import { Head, Link, usePage } from "@inertiajs/react";
import { Button } from "@/components/ui/button.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { toast } from "sonner";
import { router } from "@inertiajs/react";
import axios from "axios";
import { useMidtrans } from "@/hooks/usePaymentMidtrans";
import { useSelected } from "@/hooks/useSelection";
import { useDispatch } from "react-redux";
import { getBookedDatesWithUser } from "@/Utils/bookedDates.js";
import { addItemsToCart } from "@/Utils/Cart/addToCartHelper";
import { createPaymentPayload } from "@/Utils/PaymentHelper.js";
import MainLayout from "@/Layouts/Main.jsx";
import ReportModal from "@/components/ReportModal.jsx";

// Lazy load components
const CustomCalendar = lazy(() => import("@/components/custom-calendar"));
const ReviewSection = lazy(() => import("@/components/ReviewSection"));
const BuildingPaymentSheet = lazy(() =>
    import("@/components/DetailPage/BuildingPaymentSheet")
);
const BuildingConfirmDialog = lazy(() =>
    import("@/components/DetailPage/BuildingConfirmDialog")
);
const ImageGallery = lazy(() => import("@/components/DetailPage/ImageGallery"));

// Skeleton components
const CalendarSkeleton = () => (
    <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
    </div>
);

const ReviewSkeleton = () => (
    <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
    </div>
);

const DetailBuilding = () => {
    const {
        building,
        ziggy,
        transaction,
        user,
        leaves,
        photos,
        tax_info,
        cartDates,
        pendingDates,
    } = usePage().props;

    const dispatch = useDispatch();
    const [latitude, longitude] =
        building?.pin?.split(",") ?? "0.5761133,101.4252478";

    const embedSrc = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;

    const items = useMemo(
        () => [{ id: building.id, price: building.price }],
        [building.id, building.price]
    );

    const {
        // itemCounts,
        // selectedDates,
        // handleChangeSelectedDate,
        // totalHarga,
        handleChangeItem,
    } = useSelected(items);

    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [activeImage, setActiveImage] = useState(0);
    const [note, setNote] = useState("");
    const [isLoading, setIsLoading] = useState({
        snap: false,
        payment: false,
        cart: false,
    });
    const { snapLoaded, paymentError, setPaymentError } = useMidtrans();
    const [showReportModal, setShowReportModal] = useState(false);

    const bookedDatesWithUser = useMemo(() => {
        return getBookedDatesWithUser(transaction, user?.id);
    }, [transaction, user?.id]);

    const disabledLeaves = useMemo(() => {
        if (!leaves || leaves.length === 0) return [];
        return leaves.map((leave) => ({
            type: leave.date ? "once" : "weekly",
            date: leave.date,
            day_of_week: leave.day_of_week,
        }));
    }, [leaves]);

    const images = useMemo(
        () => [
            {
                url: `${ziggy.url}/storage/thumbnails/${building.thumbnail}`,
                type: "thumbnail",
            },
            ...(photos?.map((p) => ({
                url: `${ziggy.url}/storage/item-photos/${p.photo}`,
                type: "photo",
                caption: p.caption,
            })) || []),
        ],
        [ziggy.url, building.thumbnail, photos]
    );

    const handleAddToCart = useCallback(async () => {
        if (!selectedDate) {
            toast.error("Silahkan pilih tanggal sewa gedung");
            return;
        }
        if (user.id === building.user_id) {
            toast.error("Tidak bisa membeli building sendiri");
            return;
        }

        setIsLoading((prev) => ({ ...prev, cart: true }));

        const itemsToAdd = { [building.id]: 1 };
        const rentDaysToAdd = {
            [building.id]: selectedDate.toLocaleDateString("en-CA", {
                timeZone: "Asia/Jakarta",
            }),
        };
        try {
            const result = await addItemsToCart({
                items: itemsToAdd,
                itemList: [building],
                rentDays: rentDaysToAdd,
                dispatch,
                itemCategory: "building",
            });

            if (result.success) {
                toast.success(`${building.name} ditambahkan ke keranjang!`);
                handleChangeItem(building.id, 1);
            } else {
                toast.warning(result.message);
            }
        } catch (error) {
            console.error("Gagal menambahkan ke keranjang:", error);
            toast.error("Terjadi kesalahan saat menghubungi server.");
        } finally {
            setIsLoading((prev) => ({ ...prev, cart: false }));
        }
    }, [selectedDate, user, building, dispatch, handleChangeItem]);

    const handlePayment = useCallback(
        async (e) => {
            if (e) e.preventDefault();

            if (user.id === building.user_id) {
                toast.error("Tidak bisa membeli building sendiri");
                return;
            }

            if (!selectedDate) {
                toast.error("Silahkan pilih tanggal sewa gedung");
                setIsConfirmOpen(true);
                return;
            }

            setIsConfirmOpen(false);
            setPaymentError(null);
            setIsLoading((prev) => ({ ...prev, payment: true }));

            if (!snapLoaded) {
                alert(
                    "Sistem pembayaran belum siap, coba beberapa detik lagi."
                );
                return;
            }

            try {
                const buildingItem = {
                    ...building,
                    rent_days: selectedDate.toLocaleDateString("en-CA", {
                        timeZone: "Asia/Jakarta",
                    }),
                };

                const paymentData = createPaymentPayload(
                    buildingItem,
                    1,
                    user,
                    null
                );
                paymentData.note = note;

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
                    onSuccess: () => {
                        setIsLoading((prev) => ({ ...prev, payment: false }));
                        router.visit("/purchase", {
                            method: "get",
                            preserveState: false,
                        });
                    },
                    onPending: () => {
                        setIsLoading((prev) => ({ ...prev, payment: false }));
                        router.visit("/purchase?tab=unpaid", {
                            method: "get",
                            preserveState: false,
                        });
                    },
                    onError: () => {
                        setIsLoading((prev) => ({ ...prev, payment: false }));
                        setPaymentError(
                            "Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi."
                        );
                    },
                    onClose: () => {
                        setIsLoading((prev) => ({ ...prev, payment: false }));
                        router.visit("/purchase", {
                            method: "get",
                            preserveState: false,
                        });
                    },
                });
            } catch (error) {
                console.error("Payment initialization error:", error);
                let errorMessage =
                    "Terjadi kesalahan saat memproses pembayaran";
                if (error.response?.data?.error) {
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
            } finally {
                setIsLoading((prev) => ({ ...prev, payment: false }));
            }
        },
        [snapLoaded, selectedDate, building, user, note, setPaymentError]
    );

    const formatPrice = useCallback((price) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        }).format(price);
    }, []);

    return (
        <div className="min-h-screen">
            <Head title={building.name} />

            {paymentError && <p className="text-red-500">{paymentError}</p>}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <Button
                    onClick={() => window.history.back()}
                    variant="outline"
                    size="sm"
                    className="mb-8 md:mb-6"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                </Button>

                <div className="grid lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7 space-y-6">
                        <Suspense
                            fallback={<Skeleton className="h-96 w-full" />}
                        >
                            <ImageGallery
                                images={images}
                                activeImage={activeImage}
                                setActiveImage={setActiveImage}
                                serviceName={building.name}
                                serviceStatus={building.status}
                            />
                        </Suspense>

                        <div className="bg-white rounded-lg border shadow-lg">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="space-y-2">
                                        <h1 className="text-3xl font-bold text-slate-900">
                                            {building.name}
                                        </h1>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <MapPin className="h-4 w-4" />
                                            <span>{building.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <span className="text-sm font-medium">
                                                Oleh: {building.user_name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Users className="h-4 w-4" />
                                            <span>
                                                Kapasitas: {building.capacity}{" "}
                                                orang
                                            </span>
                                        </div>
                                        {user &&
                                            user.id !== building.user_id && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setShowReportModal(true)
                                                    }
                                                    className="mt-4"
                                                >
                                                    <Flag className="h-4 w-4 mr-2" />
                                                    Laporkan
                                                </Button>
                                            )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-3">
                                            Deskripsi Gedung
                                        </h3>
                                        <div
                                            className="text-sm text-muted-foreground leading-relaxed"
                                            dangerouslySetInnerHTML={{
                                                __html: building.description,
                                            }}
                                        />
                                    </div>

                                    <section className="mb-8">
                                        <h2 className="text-2xl font-bold mb-4">
                                            Lokasi
                                        </h2>
                                        <div className="w-full max-w-2xl h-64 sm:h-80 rounded-lg overflow-hidden shadow-md border">
                                            <iframe
                                                src={embedSrc}
                                                className="w-full h-full border-0"
                                                allowFullScreen
                                                loading="lazy"
                                                referrerPolicy="no-referrer-when-downgrade"
                                                title={`Lokasi: ${building.name}`}
                                                sandbox="allow-scripts allow-same-origin allow-popups"
                                            />
                                        </div>
                                    </section>

                                    <section className="mt-8">
                                        <Suspense fallback={<ReviewSkeleton />}>
                                            <ReviewSection
                                                key={building.id}
                                                itemType="App\Models\Building"
                                                itemId={building.id}
                                                user={user}
                                            />
                                        </Suspense>
                                    </section>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white rounded-lg shadow-lg border sticky md:top-12">
                            <div className="px-6 pb-6">
                                <div className="my-6">
                                    <Suspense fallback={<CalendarSkeleton />}>
                                        <CustomCalendar
                                            selected={selectedDate}
                                            onSelect={setSelectedDate}
                                            disabled={(date) =>
                                                date < new Date()
                                            }
                                            bookedDatesWithUser={
                                                bookedDatesWithUser
                                            }
                                            disabledLeaves={disabledLeaves}
                                            currentUserId={user?.id}
                                            cartDates={cartDates}
                                            pendingDates={pendingDates}
                                            itemId={building.id}
                                            itemType="building"
                                        />
                                    </Suspense>
                                </div>
                                <div className="text-center my-6">
                                    <div className="text-3xl font-bold text-blue-600">
                                        {formatPrice(building.price)}
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1">
                                        Perhari
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {user ? (
                                        <Button
                                            className="w-full bg-primary hover:bg-primary/80"
                                            onClick={() =>
                                                setIsPaymentOpen(true)
                                            }
                                        >
                                            Sewa Gedung
                                        </Button>
                                    ) : (
                                        <Link
                                            href={`/login?redirect=${ziggy.location}`}
                                        >
                                            <Button className="w-full bg-primary hover:!bg-primary/60">
                                                Masuk Untuk Sewa Gedung
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Suspense fallback={null}>
                <BuildingPaymentSheet
                    isOpen={isPaymentOpen}
                    onOpenChange={setIsPaymentOpen}
                    building={building}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    bookedDatesWithUser={bookedDatesWithUser}
                    disabledLeaves={disabledLeaves}
                    user={user}
                    cartDates={cartDates}
                    pendingDates={pendingDates}
                    note={note}
                    setNote={setNote}
                    handleAddToCart={handleAddToCart}
                    setIsConfirmOpen={setIsConfirmOpen}
                    isLoading={isLoading}
                />
            </Suspense>

            <Suspense fallback={null}>
                <BuildingConfirmDialog
                    isOpen={isConfirmOpen}
                    onOpenChange={setIsConfirmOpen}
                    building={building}
                    selectedDate={selectedDate}
                    note={note}
                    tax_info={tax_info}
                    formatPrice={formatPrice}
                    handlePayment={handlePayment}
                    snapLoaded={snapLoaded}
                    isLoading={isLoading}
                    setIsPaymentOpen={setIsPaymentOpen}
                    user={user}
                    saldo_user={null} // Buildings don't have availableBalance in props
                />
            </Suspense>

            {isLoading.payment && (
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
                type="building"
                id={building.id}
            />
        </div>
    );
};

export default DetailBuilding;

DetailBuilding.layout = (page) => <MainLayout>{page}</MainLayout>;
