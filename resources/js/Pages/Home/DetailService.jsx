import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ArrowLeft, MapPin, Star, Share2, Heart, Loader2 } from "lucide-react";
import { Head, Link, usePage } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/Lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { FaShoppingCart, FaMapMarkerAlt } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useSelected } from "@/hooks/useSelection";
import { toast } from "sonner";
import { router } from "@inertiajs/react";
import axios from "axios";
import { useMidtrans } from "@/hooks/usePaymentMidtrans";
import Rating from "@/components/rating";
import CustomCalendar from "@/components/custom-calendar";
import { getBookedDatesWithUser } from "@/Utils/bookedDates";
import { addItemsToCart } from "@/Utils/Cart/addToCartHelper";
import AddressManager from "@/components/address-manager";
import MainLayout from "@/Layouts/Main";
import ReviewSection from "@/components/ReviewSection";
import { createPaymentPayload } from "@/Utils/PaymentHelper";

const DetailService = () => {
    const { service, ziggy, transaction, user, leaves, photos, tax_info } =
        usePage().props;

    const dispatch = useDispatch();

    const items = useMemo(
        () => [{ id: service.id, price: service.price }], // Use base price for calculations
        [service.id, service.price]
    );
    const {
        itemCounts,
        selectedDates,
        handleChangeSelectedDate,
        totalHarga,
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

    // Format leaves data untuk calendar
    const disabledLeaves = useMemo(() => {
        if (!leaves || leaves.length === 0) return [];

        return leaves.map((leave) => ({
            type: leave.date ? "once" : "weekly",
            date: leave.date,
            day_of_week: leave.day_of_week,
        }));
    }, [leaves]);

    const handleAddToCart = async () => {
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
    };

    const selectedAddress = useMemo(() => {
        return addresses.find((addr) => addr.id === selectedAddressId);
    }, [addresses, selectedAddressId]);

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
                // Create service item with rent_days for payment
                const serviceItem = {
                    ...service,
                    rent_days: selectedDate.toLocaleDateString("en-CA", {
                        timeZone: "Asia/Jakarta",
                    }),
                };

                // Use PaymentHelper to create payment payload
                const paymentData = createPaymentPayload(
                    serviceItem,
                    1,
                    user,
                    selectedAddress
                );

                // Add note to payment data
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

                const { token: snapToken, order_id } = response.data;

                if (!snapToken) {
                    throw new Error("Token pembayaran tidak diterima");
                }

                window.snap.pay(snapToken, {
                    skipOrderSummary: false,
                    onSuccess: (result) => {
                        setIsLoading((prev) => ({ ...prev, payment: false }));
                        router.visit("/purchase", {
                            method: "get",
                            preserveState: false,
                        });
                    },
                    onPending: (result) => {
                        setIsLoading((prev) => ({ ...prev, payment: false }));
                        router.visit("/purchase?tab=unpaid", {
                            method: "get",
                            preserveState: false,
                        });
                    },
                    onError: (error) => {
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
        [snapLoaded, selectedAddress, selectedDate, service, user, note]
    );

    const formatPrice = (price) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        }).format(price);
    };

    const images = [
        {
            url: `${ziggy.url}/storage/thumbnails/${service.thumbnail}`,
            type: "thumbnail",
        },
        ...(photos?.map((p) => ({
            url: `${ziggy.url}/storage/item-photos/${p.photo}`,
            type: "photo",
        })) || []),
    ];

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
    }, [setAddresses, setSelectedAddressId, selectedAddressId]);

    return (
        <div className="min-h-scree">
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
                        <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                            <div className="aspect-video relative">
                                <div className="flex-1">
                                    <Carousel>
                                        <CarouselContent>
                                            <CarouselItem>
                                                <Card className="overflow-hidden">
                                                    <CardContent className="flex items-center justify-center p-0">
                                                        <img
                                                            src={
                                                                images[
                                                                    activeImage
                                                                ].url
                                                            }
                                                            alt={service.name}
                                                            className="object-cover rounded-lg max-h-[400px] w-full"
                                                        />
                                                    </CardContent>
                                                </Card>
                                            </CarouselItem>
                                        </CarouselContent>
                                    </Carousel>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                <div className="absolute top-4 right-4 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                                    {service.status === "active"
                                        ? "Tersedia"
                                        : "Tidak Tersedia"}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveImage(i)}
                                    className={cn(
                                        "border rounded-lg overflow-hidden w-20 h-20 flex items-center justify-center",
                                        activeImage === i && "ring-2 ring-black"
                                    )}
                                >
                                    <img
                                        src={img.url}
                                        alt={`Product thumbnail ${i + 1}`}
                                        className="object-cover w-full h-full"
                                    />
                                </button>
                            ))}
                        </div>

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
                                    </div>
                                    <Rating
                                        value={service.rating}
                                        size={20}
                                        showValue={true}
                                    />
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

                        {/* Review Section */}
                        <section className="mt-8">
                            <ReviewSection
                                key={service.id}
                                itemType="App\Models\Service"
                                itemId={service.id}
                                user={user}
                            />
                        </section>
                    </div>

                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white rounded-lg shadow-lg border">
                            <div className="p-6">
                                <div className="my-6">
                                    <CustomCalendar
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        disabled={(date) => date < new Date()}
                                        bookedDatesWithUser={
                                            bookedDatesWithUser
                                        }
                                        disabledLeaves={disabledLeaves}
                                        currentUserId={user?.id}
                                    />
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
                                    {/* {service.tax_amount > 0 && (
                                        <div className="text-xs text-slate-500 mt-1">
                                            Termasuk pajak{" "}
                                            {console.log(tax_info)}
                                            {tax_info?.type === "percent"
                                                ? `${tax_info?.value}%`
                                                : formatPrice(
                                                      tax_info?.value || 0
                                                  )}
                                        </div>
                                    )} */}
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

            <Sheet open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <SheetContent className="md:!max-w-xl w-full flex flex-col max-h-screen">
                    <SheetHeader className="flex-shrink-0 pb-4 border-b">
                        <SheetTitle>Sewa Jasa - {service.name}</SheetTitle>
                        <SheetDescription>
                            Pilih tanggal untuk jadwal datang
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto py-4 space-y-6">
                        <div className="flex justify-center">
                            <CustomCalendar
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={(date) => date < new Date()}
                                bookedDatesWithUser={bookedDatesWithUser}
                                disabledLeaves={disabledLeaves}
                                currentUserId={user?.id}
                            />
                        </div>

                        <div className="space-y-3">
                            <h1 className="font-semibold text-slate-800">
                                Lokasi Anda
                            </h1>
                            <Button
                                variant="outline"
                                className="w-full py-4 text-left justify-start"
                                onClick={() => setIsAddressListOpen(true)}
                                disabled={isLoadingAddresses}
                            >
                                {isLoadingAddresses ? (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Memuat Alamat...
                                    </div>
                                ) : (
                                    (() => {
                                        const filtered = addresses.filter(
                                            (address) =>
                                                address.id === selectedAddressId
                                        );

                                        if (filtered.length === 0) {
                                            return (
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <FaMapMarkerAlt />
                                                    Masukkan Alamat
                                                </div>
                                            );
                                        }

                                        return filtered.map((address) => (
                                            <div
                                                key={address.id}
                                                className="flex items-center gap-2 text-slate-800"
                                            >
                                                <FaMapMarkerAlt />
                                                {address.label ||
                                                    address.recipient_name}
                                            </div>
                                        ));
                                    })()
                                )}
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <Label
                                htmlFor="note"
                                className="font-semibold text-slate-800"
                            >
                                Catatan (Opsional)
                            </Label>
                            <Textarea
                                id="note"
                                placeholder="Catatan untuk abangnya (opsional)"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    <SheetFooter className="grid grid-cols-10 gap-4 w-full">
                        <Button
                            variant="outline"
                            onClick={() => handleAddToCart()}
                            className="col-span-1"
                            disabled={!selectedDate || isLoading.cart}
                        >
                            <FaShoppingCart className="w-4 h-4" />
                        </Button>
                        <Button
                            onClick={() => {
                                setIsPaymentOpen(false);
                                setIsConfirmOpen(true);
                            }}
                            className="col-span-9"
                        >
                            Bayar
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <AddressManager
                isAddressListOpen={isAddressListOpen}
                setIsAddressListOpen={setIsAddressListOpen}
                addresses={addresses}
                setAddresses={setAddresses}
                selectedAddressId={selectedAddressId}
                setSelectedAddressId={setSelectedAddressId}
                user={user}
            />

            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                    <AlertDialogHeader className="flex-shrink-0">
                        <AlertDialogTitle>
                            Konfirmasi Pembayaran
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Pastikan semua data sudah benar sebelum melanjutkan
                            pembayaran.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="flex-1 overflow-y-auto py-4">
                        <div className="bg-slate-50 border rounded-md p-5 text-sm space-y-3">
                            <div className="text-center font-semibold mb-4 tracking-wide">
                                RINCIAN PEMBELIAN
                            </div>

                            <div className="flex justify-between py-2 border-b">
                                <span className="text-slate-600">Layanan</span>
                                <span className="font-medium">
                                    {service.name}
                                </span>
                            </div>

                            <div className="flex justify-between py-2 border-b">
                                <span className="text-slate-600">
                                    Harga Dasar
                                </span>
                                <span className="font-medium">
                                    {formatPrice(service.price)} / hari
                                </span>
                            </div>

                            {service.tax_amount > 0 && (
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-slate-600">
                                        Pajak (
                                        {tax_info?.type === "percent"
                                            ? `${tax_info?.value}%`
                                            : "Fixed"}
                                        )
                                    </span>
                                    <span className="font-medium">
                                        {formatPrice(service.tax_amount)}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between py-2 border-b">
                                <span className="text-slate-600">Tanggal</span>
                                <span className="font-medium">
                                    {selectedDate ? (
                                        (() => {
                                            const d = new Date(selectedDate);
                                            const hari = d.toLocaleDateString(
                                                "id-ID",
                                                { weekday: "long" }
                                            );
                                            const tanggal =
                                                d.toLocaleDateString("id-ID", {
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric",
                                                });
                                            return `${tanggal} (${hari})`;
                                        })()
                                    ) : (
                                        <p className="text-sm text-red-600 font-medium">
                                            Tanggal belum dipilih
                                        </p>
                                    )}
                                </span>
                            </div>

                            <div className="py-3">
                                {selectedAddress ? (
                                    <div className="space-y-2">
                                        <span className="block text-slate-600">
                                            Alamat ({selectedAddress.label})
                                        </span>
                                        <div className="text-sm font-medium text-slate-800">
                                            <p>
                                                {selectedAddress.recipient_name}{" "}
                                                - {selectedAddress.phone}
                                            </p>
                                            <p className="leading-relaxed">
                                                {selectedAddress.address_line},{" "}
                                                {selectedAddress.district},{" "}
                                                {selectedAddress.city},{" "}
                                                {selectedAddress.province}{" "}
                                                {selectedAddress.postal_code}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-red-600 font-medium">
                                        Alamat belum dipilih
                                    </p>
                                )}
                            </div>

                            {note && (
                                <div className="py-3 border-b">
                                    <span className="block text-slate-600 mb-2">
                                        Catatan
                                    </span>
                                    <p className="text-sm text-slate-800">
                                        {note}
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-between py-3 mt-2 border-t font-semibold text-base">
                                <span>Total</span>
                                <span>
                                    {formatPrice(
                                        service.final_price || service.price
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    <AlertDialogFooter className="flex-shrink-0 pt-4">
                        <AlertDialogCancel
                            onClick={() => {
                                setIsConfirmOpen(false);
                                setIsPaymentOpen(true);
                            }}
                        >
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handlePayment}
                            disabled={!snapLoaded || isLoading.payment}
                        >
                            {isLoading.payment ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Memproses...
                                </div>
                            ) : (
                                "Bayar"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
