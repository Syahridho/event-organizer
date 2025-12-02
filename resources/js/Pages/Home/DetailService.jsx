import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import { ArrowLeft, MapPin, Loader2 } from "lucide-react";
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

// Lazy load heavy components
const CustomCalendar = lazy(() => import("@/components/custom-calendar"));
const ReviewSection = lazy(() => import("@/components/ReviewSection"));
const AddressManager = lazy(() => import("@/components/address-manager"));
const PaymentSheet = lazy(() => import("@/Components/DetailPage/PaymentSheet"));
const ConfirmDialog = lazy(() => import("@/Components/DetailPage/ConfirmDialog"));
const ImageGallery = lazy(() => import("@/Components/DetailPage/ImageGallery"));

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

const DetailService = () => {
    const {
        service,
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
    const items = useMemo(
        () => [{ id: service.id, price: service.price }],
        [service.id, service.price]
    );
    
    const {
        // itemCounts,
        // selectedDates,
        // handleChangeSelectedDate,
        // totalHarga,
        handleChangeItem,
    } = useSelected(items);

    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isAddressListOpen, setIsAddressListOpen] = useState(false);
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

    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

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

    const images = useMemo(() => [
        {
            url: `${ziggy.url}/storage/thumbnails/${service.thumbnail}`,
            type: "thumbnail",
        },
        ...(photos?.map((p) => ({
            url: `${ziggy.url}/storage/item-photos/${p.photo}`,
            type: "photo",
        })) || []),
    ], [ziggy.url, service.thumbnail, photos]);

    const selectedAddress = useMemo(() => {
        return addresses.find((addr) => addr.id === selectedAddressId);
    }, [addresses, selectedAddressId]);

    const handleAddToCart = useCallback(async () => {
        if (!selectedDate) {
            toast.error("Silahkan pilih tanggal sewa jasa");
            return;
        }
        if (user.id === service.user_id) {
            toast.error("Tidak bisa membeli service sendiri");
            return;
        }
        setIsLoading((prev) => ({ ...prev, cart: true }));

        const itemsToAdd = { [service.id]: 1 };
        const rentDaysToAdd = {
            [service.id]: selectedDate.toLocaleDateString("en-CA", {
                timeZone: "Asia/Jakarta",
            }),
        };

        try {
            const result = await addItemsToCart({
                items: itemsToAdd,
                itemList: [service],
                rentDays: rentDaysToAdd,
                dispatch,
                itemCategory: "service",
            });

            if (result.success) {
                toast.success(`${service.name} ditambahkan ke keranjang!`);
                handleChangeItem(service.id, 1);
            } else {
                toast.warning(result.message);
            }
        } catch (error) {
            console.error("Gagal menambahkan ke keranjang:", error);
            toast.error("Terjadi kesalahan saat menghubungi server.");
        } finally {
            setIsLoading((prev) => ({ ...prev, cart: false }));
        }
    }, [selectedDate, user, service, dispatch, handleChangeItem]);

    const handlePayment = useCallback(
        async (e) => {
            if (e) e.preventDefault();

            if (user.id === service.user_id) {
                toast.error("Tidak bisa membeli service sendiri");
                return;
            }

            if (!selectedDate) {
                toast.error("Silahkan pilih tanggal sewa jasa");
                setIsConfirmOpen(true);
                return;
            }

            if (!selectedAddress) {
                toast.error("Silahkan pilih alamat terlebih dahulu");
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
                const serviceItem = {
                    ...service,
                    rent_days: selectedDate.toLocaleDateString("en-CA", {
                        timeZone: "Asia/Jakarta",
                    }),
                };

                const paymentData = createPaymentPayload(
                    serviceItem,
                    1,
                    user,
                    selectedAddress
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
        [snapLoaded, selectedAddress, selectedDate, service, user, note, setPaymentError]
    );

    const formatPrice = useCallback((price) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        }).format(price);
    }, []);

    useEffect(() => {
        const loadAddresses = async () => {
            setIsLoadingAddresses(true);
            try {
                const response = await axios.get("/addresses/ajax/get");
                setAddresses(response.data.data);
                const defaultAddress = response.data.data.find(
                    (addr) => addr.is_default
                );
                if (defaultAddress && !selectedAddressId) {
                    setSelectedAddressId(defaultAddress.id);
                }
            } catch (error) {
                console.error("Error loading addresses:", error);
                toast.error("Gagal memuat alamat");
            } finally {
                setIsLoadingAddresses(false);
            }
        };

        if (user) {
            loadAddresses();
        }
    }, [user, selectedAddressId]);

    return (
        <div className="min-h-screen">
            <Head title={service.name} />

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
                        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                            <ImageGallery
                                images={images}
                                activeImage={activeImage}
                                setActiveImage={setActiveImage}
                                serviceName={service.name}
                                serviceStatus={service.status}
                            />
                        </Suspense>

                        <div className="bg-white rounded-lg shadow-lg border">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="space-y-2">
                                        <h1 className="text-3xl font-bold text-slate-900">
                                            {service.name}
                                        </h1>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <MapPin className="h-4 w-4" />
                                            <span>{service.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <span className="text-sm font-medium">
                                                Oleh: {service.user_name}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-3">
                                            Tentang Layanan
                                        </h3>
                                        <div
                                            className="text-sm text-muted-foreground leading-relaxed"
                                            dangerouslySetInnerHTML={{
                                                __html: service.description,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <section className="mt-8">
                            <Suspense fallback={<ReviewSkeleton />}>
                                <ReviewSection
                                    key={service.id}
                                    itemType="App\Models\Service"
                                    itemId={service.id}
                                    user={user}
                                />
                            </Suspense>
                        </section>
                    </div>

                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white rounded-lg shadow-lg border sticky md:top-12">
                            <div className="px-6 pb-6">
                                <div className="my-6">
                                    <Suspense fallback={<CalendarSkeleton />}>
                                        <CustomCalendar
                                            selected={selectedDate}
                                            onSelect={setSelectedDate}
                                            disabled={(date) => date < new Date()}
                                            bookedDatesWithUser={bookedDatesWithUser}
                                            disabledLeaves={disabledLeaves}
                                            currentUserId={user?.id}
                                            cartDates={cartDates}
                                            pendingDates={pendingDates}
                                            itemId={service.id}
                                            itemType="service"
                                        />
                                    </Suspense>
                                </div>
                                <div className="text-center my-6">
                                    <div className="text-3xl font-bold text-blue-600">
                                        {formatPrice(
                                            service.final_price || service.price
                                        )}
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
                                            Sewa Jasa
                                        </Button>
                                    ) : (
                                        <Link
                                            href={`/login?redirect=${ziggy.location}`}
                                        >
                                            <Button className="w-full bg-primary hover:!bg-primary/60">
                                                Masuk Untuk Sewa Jasa
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
                <PaymentSheet
                    isOpen={isPaymentOpen}
                    onOpenChange={setIsPaymentOpen}
                    service={service}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    bookedDatesWithUser={bookedDatesWithUser}
                    disabledLeaves={disabledLeaves}
                    user={user}
                    cartDates={cartDates}
                    pendingDates={pendingDates}
                    addresses={addresses}
                    selectedAddressId={selectedAddressId}
                    setIsAddressListOpen={setIsAddressListOpen}
                    isLoadingAddresses={isLoadingAddresses}
                    note={note}
                    setNote={setNote}
                    handleAddToCart={handleAddToCart}
                    setIsConfirmOpen={setIsConfirmOpen}
                    isLoading={isLoading}
                />
            </Suspense>

            <Suspense fallback={null}>
                <AddressManager
                    isAddressListOpen={isAddressListOpen}
                    setIsAddressListOpen={setIsAddressListOpen}
                    addresses={addresses}
                    setAddresses={setAddresses}
                    selectedAddressId={selectedAddressId}
                    setSelectedAddressId={setSelectedAddressId}
                    user={user}
                />
            </Suspense>

            <Suspense fallback={null}>
                <ConfirmDialog
                    isOpen={isConfirmOpen}
                    onOpenChange={setIsConfirmOpen}
                    service={service}
                    selectedDate={selectedDate}
                    selectedAddress={selectedAddress}
                    note={note}
                    tax_info={tax_info}
                    formatPrice={formatPrice}
                    handlePayment={handlePayment}
                    snapLoaded={snapLoaded}
                    isLoading={isLoading}
                    setIsPaymentOpen={setIsPaymentOpen}
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
        </div>
    );
};

export default DetailService;

DetailService.layout = (page) => <MainLayout>{page}</MainLayout>;
