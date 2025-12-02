import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    ArrowLeft,
    MapPin,
    Loader2,
    Home,
    Bed,
    Bath,
} from "lucide-react";
import { Head, Link, usePage } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import CustomCalendar from "@/Components/custom-calendar";
import { getBookedDatesWithUser } from "@/Utils/bookedDates";
import { addItemsToCart } from "@/Utils/Cart/addToCartHelper";
import AddressManager from "@/Components/address-manager";
import MainLayout from "@/Layouts/Main";
import ReviewSection from "@/Components/ReviewSection";
import { createPaymentPayload } from "@/Utils/PaymentHelper";

const DetailProperty = () => {
    const {
        property,
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
        property?.pin?.split(",") ?? "0.5761133,101.4252478";
    const embedSrc = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;

    const items = useMemo(
        () => [{ id: property.id, price: property.price }],
        [property.id, property.price]
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
    const [isLoading, setIsLoading] = useState({
        snap: false,
        payment: false,
        cart: false,
    });
    const { snapLoaded, paymentError, setPaymentError } = useMidtrans();

    // Updated delivery state management
    const [deliveryOption, setDeliveryOption] = useState("pickup");
    const [note, setNote] = useState("");
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

    const bookedDatesWithUser = useMemo(() => {
        return getBookedDatesWithUser(transaction, user?.id);
    }, [transaction, user?.id]);

    const handleAddToCart = async () => {
        if (!selectedDate) {
            toast.error("Silahkan pilih tanggal sewa properti");
            return;
        }
        if (user.id === property.user_id) {
            toast.error("Tidak bisa membeli property sendiri");
            return;
        }

        setIsLoading((prev) => ({ ...prev, cart: true }));

        const itemsToAdd = { [property.id]: 1 };
        const rentDaysToAdd = {
            [property.id]: selectedDate.toLocaleDateString("en-CA", {
                timeZone: "Asia/Jakarta",
            }),
        };

        try {
            const result = await addItemsToCart({
                items: itemsToAdd,
                itemList: [property],
                rentDays: rentDaysToAdd,
                dispatch,
                itemCategory: "property",
            });

            if (result.success) {
                toast.success(`${property.name} ditambahkan ke keranjang!`);
                handleChangeItem(property.id, 1);
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

            if (user.id === property.user_id) {
                toast.error("Tidak bisa membeli property sendiri");
                return;
            }

            // Validation checks
            if (!selectedDate) {
                toast.error("Silahkan pilih tanggal sewa properti");
                setIsConfirmOpen(true);
                return;
            }

            // Only validate address if delivery is selected
            if (deliveryOption === "delivery" && !selectedAddress) {
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
                // Create property item with rent_days for payment
                // Important: explicitly mark as rent_property to match backend validation
                const propertyItem = {
                    ...property,
                    type: "rent_property",
                    rent_days: selectedDate.toLocaleDateString("en-CA", {
                        timeZone: "Asia/Jakarta",
                    }),
                };

                // Use PaymentHelper to create payment payload
                const paymentData = createPaymentPayload(
                    propertyItem,
                    1,
                    user,
                    deliveryOption,
                    note,
                    deliveryOption === "delivery" ? selectedAddress : null
                );

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
                // order_id
                const { token: snapToken, } = response.data;

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
        [
            snapLoaded,
            selectedAddress,
            selectedDate,
            property,
            user,
            deliveryOption,
            note,
        ]
    );

    const formatPrice = (price) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        }).format(price);
    };

    // Format leaves data untuk calendar
    const disabledLeaves = useMemo(() => {
        if (!leaves || leaves.length === 0) return [];

        return leaves.map((leave) => ({
            type: leave.date ? "once" : "weekly",
            date: leave.date,
            day_of_week: leave.day_of_week,
        }));
    }, [leaves]);

    const images = [
        {
            url: `${ziggy.url}/storage/thumbnails/${property.thumbnail}`,
            type: "thumbnail",
        },
        ...(photos?.map((p) => ({
            url: `${ziggy.url}/storage/item-photos/${p.photo}`,
            type: "photo",
            caption: p.caption,
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

    // Set default delivery option based on property settings
    useEffect(() => {
        const hasPickup = property.picked_up === 1 || property.picked_up === true;
        const hasDelivery = property.delivered === 1 || property.delivered === true;
        
        // Set default based on available options
        if (hasPickup && !hasDelivery) {
            setDeliveryOption("pickup");
        } else if (!hasPickup && hasDelivery) {
            setDeliveryOption("delivery");
        } else if (hasPickup && hasDelivery) {
            // Both available, default to pickup
            setDeliveryOption("pickup");
        }
    }, [property.picked_up, property.delivered]);

    // Reset selected address when switching to pickup
    useEffect(() => {
        if (deliveryOption === "pickup") {
            setSelectedAddressId(null);
        }
    }, [deliveryOption]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <Head title={property.name} />

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
                                                            alt={property.name}
                                                            className="object-cover rounded-lg max-h-[600px] w-full"
                                                        />
                                                    </CardContent>
                                                </Card>
                                            </CarouselItem>
                                        </CarouselContent>
                                    </Carousel>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                <div className="absolute top-4 right-4 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                                    {property.status === "active"
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
                                        alt={
                                            img.caption ||
                                            `Foto properti ${i + 1}`
                                        }
                                        className="object-cover w-full h-full"
                                    />
                                </button>
                            ))}
                        </div>

                        <div className="bg-white rounded-lg shadow-lg">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="space-y-2">
                                        <h1 className="text-3xl font-bold text-slate-900">
                                            {property.name}
                                        </h1>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <MapPin className="h-4 w-4" />
                                            <span>{property.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <span className="text-sm font-medium">Oleh: {property.user_name}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-slate-600">
                                            {property.bedrooms && (
                                                <div className="flex items-center gap-1">
                                                    <Bed className="h-4 w-4" />
                                                    <span>
                                                        {property.bedrooms}{" "}
                                                        Kamar
                                                    </span>
                                                </div>
                                            )}
                                            {property.bathrooms && (
                                                <div className="flex items-center gap-1">
                                                    <Bath className="h-4 w-4" />
                                                    <span>
                                                        {property.bathrooms}{" "}
                                                        Kamar Mandi
                                                    </span>
                                                </div>
                                            )}
                                            {property.area && (
                                                <div className="flex items-center gap-1">
                                                    <Home className="h-4 w-4" />
                                                    <span>
                                                        {property.area} m²
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* {property.rating && (
                                        <Rating
                                            value={property.rating}
                                            size={20}
                                            showValue={true}
                                        />
                                    )} */}
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-3">
                                            Deskripsi Properti
                                        </h3>
                                        <div
                                            className="text-sm text-muted-foreground leading-relaxed"
                                            dangerouslySetInnerHTML={{
                                                __html: property.description,
                                            }}
                                        />
                                    </div>

                                    {property.facilities &&
                                        property.facilities.length > 0 && (
                                            <div>
                                                <h3 className="font-semibold text-lg mb-3">
                                                    Fasilitas
                                                </h3>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                    {property.facilities.map(
                                                        (facility, index) => (
                                                            <div
                                                                key={index}
                                                                className="bg-slate-50 px-3 py-2 rounded-md text-sm"
                                                            >
                                                                {facility}
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}

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
                                                title={`Lokasi: ${property?.name}`}
                                                sandbox="allow-scripts allow-same-origin allow-popups"
                                            />
                                        </div>
                                    </section>

                                    {/* Review Section */}
                                    <section className="mt-8">
                                        <ReviewSection
                                            key={property.id}
                                            itemType="App\Models\RentProperty"
                                            itemId={property.id}
                                            user={user}
                                        />
                                    </section>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white rounded-lg shadow-lg border sticky md:top-12">
                            <div className="px-6 pb-6">
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
                                        cartDates={cartDates}
                                        pendingDates={pendingDates}
                                        itemId={property.id}
                                        itemType="property"
                                    />
                                </div>
                                <div className="text-center my-6">
                                    <div className="text-3xl font-bold text-blue-600">
                                        {formatPrice(property.price)}
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1">
                                        Perhari
                                    </p>
                                    {property.area && (
                                        <p className="text-xs text-slate-500 mt-1">
                                            {property.area} m²
                                        </p>
                                    )}
                                    {/* {property.tax_amount > 0 && (
                                        <div className="text-xs text-slate-500 mt-1">
                                            Pajak{" "}
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
                                            Sewa Property
                                        </Button>
                                    ) : (
                                        <Link
                                            href={`/login?redirect=${ziggy.location}`}
                                        >
                                            <Button className="w-full bg-primary hover:!bg-primary/60">
                                                Masuk Untuk Sewa Property
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FIXED: SheetContent dengan scroll yang proper */}
            <Sheet open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <SheetContent className="md:!max-w-xl w-full flex flex-col max-h-screen">
                    <SheetHeader className="flex-shrink-0 pb-4 border-b">
                        <SheetTitle>Sewa Properti - {property.name}</SheetTitle>
                        <SheetDescription>
                            Pilih tanggal dan metode penyewaan properti
                        </SheetDescription>
                    </SheetHeader>

                    {/* FIXED: Scrollable content area */}
                    <div className="flex-1 overflow-y-auto py-4 space-y-6">
                        <div className="flex justify-center">
                            <CustomCalendar
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={(date) => date < new Date()}
                                bookedDatesWithUser={bookedDatesWithUser}
                                disabledLeaves={disabledLeaves}
                                currentUserId={user?.id}
                                cartDates={cartDates}
                                pendingDates={pendingDates}
                                itemId={property.id}
                                itemType="property"
                            />
                        </div>

                        {/* Delivery/Pickup Dropdown - DYNAMIC */}
                        <div className="space-y-3">
                            <Label
                                htmlFor="delivery-option"
                                className="font-semibold text-slate-800"
                            >
                                Metode Penyewaan
                            </Label>
                            
                            {/* Show available options based on property settings */}
                            {(() => {
                                const hasPickup = property.picked_up === 1 || property.picked_up === true;
                                const hasDelivery = property.delivered === 1 || property.delivered === true;
                                
                                // If no options available, show message
                                if (!hasPickup && !hasDelivery) {
                                    return (
                                        <div className="border rounded-lg p-4 bg-yellow-50 text-yellow-800 text-sm">
                                            Metode penyewaan belum ditentukan oleh pemilik
                                        </div>
                                    );
                                }
                                
                                // If only one option, show it as disabled select (informational)
                                if (hasPickup && !hasDelivery) {
                                    return (
                                        <div className="border rounded-lg p-4 bg-slate-50">
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <span className="font-medium">Ambil di Lokasi</span>
                                                <span className="text-xs text-slate-500">(Satu-satunya opsi)</span>
                                            </div>
                                        </div>
                                    );
                                }
                                
                                if (!hasPickup && hasDelivery) {
                                    return (
                                        <div className="border rounded-lg p-4 bg-slate-50">
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <span className="font-medium">Diantar ke Alamat</span>
                                                <span className="text-xs text-slate-500">(Satu-satunya opsi, <span className="text-red-500">Ada biaya tambahakn untuk pengataran)</span></span>
                                            </div>
                                        </div>
                                    );
                                }
                                
                                // Both options available - show dropdown
                                return (
                                    <Select
                                        value={deliveryOption}
                                        onValueChange={setDeliveryOption}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih metode penyewaan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {hasPickup && (
                                                <SelectItem value="pickup">
                                                    Ambil di Lokasi
                                                </SelectItem>
                                            )}
                                            {hasDelivery && (
                                                <SelectItem value="delivery">
                                                    Diantar ke Alamat, <span className="text-red-500">Ada biaya tambahan untuk pengantaran</span>
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                );
                            })()}
                        </div>

                        {/* Address Section - Only show if delivery is selected */}
                        {deliveryOption === "delivery" && (
                            <div className="space-y-3">
                                <h1 className="font-semibold text-slate-800">
                                    Alamat Penyewa
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
                                                    address.id ===
                                                    selectedAddressId
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
                        )}

                        {/* Property Location - Only show if pickup is selected */}
                        {deliveryOption === "pickup" && (
                            <div className="space-y-3">
                                <h1 className="font-semibold text-slate-800">
                                    Lokasi Properti
                                </h1>
                                <div className="border rounded-lg p-4 bg-slate-50">
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <MapPin className="h-4 w-4" />
                                        <span className="text-sm">
                                            {property.location}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Note Section */}
                        <div className="space-y-3">
                            <Label
                                htmlFor="note"
                                className="font-semibold text-slate-800"
                            >
                                Catatan (Opsional)
                            </Label>
                            <Textarea
                                id="note"
                                placeholder="Catatan tambahan untuk penyewaan"
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

                    {/* FIXED: Scrollable confirmation content */}
                    <div className="flex-1 overflow-y-auto py-4">
                        <div className="bg-slate-50 border rounded-md p-5 text-sm space-y-3">
                            <div className="text-center font-semibold mb-4 tracking-wide">
                                RINCIAN PENYEWAAN
                            </div>

                            <div className="flex justify-between py-2 border-b">
                                <span className="text-slate-600">Properti</span>
                                <span className="font-medium">
                                    {property.name}
                                </span>
                            </div>

                            <div className="flex justify-between py-2 border-b">
                                <span className="text-slate-600">
                                    Harga Dasar
                                </span>
                                <span className="font-medium">
                                    {formatPrice(property.price)} / hari
                                </span>
                            </div>

                            {property.tax_amount > 0 && (
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-slate-600">
                                        Pajak (
                                        {tax_info?.type === "percent"
                                            ? `${tax_info?.value}%`
                                            : "Fixed"}
                                        )
                                    </span>
                                    <span className="font-medium">
                                        {formatPrice(property.tax_amount)}
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
                                            ⚠ Tanggal belum dipilih
                                        </p>
                                    )}
                                </span>
                            </div>

                            <div className="flex justify-between py-2 border-b">
                                <span className="text-slate-600">Metode</span>
                                <span className="font-medium">
                                    {deliveryOption === "delivery"
                                        ? "Diantar ke Alamat"
                                        : "Ambil di Lokasi"}
                                </span>
                            </div>

                            <div className="py-3 border-b">
                                {deliveryOption === "delivery" ? (
                                    selectedAddress ? (
                                        <div className="space-y-2">
                                            <span className="block text-slate-600">
                                                Alamat Penyewa (
                                                {selectedAddress.label})
                                            </span>
                                            <div className="text-sm font-medium text-slate-800">
                                                <p>
                                                    {
                                                        selectedAddress.recipient_name
                                                    }{" "}
                                                    - {selectedAddress.phone}
                                                </p>
                                                <p className="leading-relaxed">
                                                    {
                                                        selectedAddress.address_line
                                                    }
                                                    , {selectedAddress.district}
                                                    , {selectedAddress.city},{" "}
                                                    {selectedAddress.province}{" "}
                                                    {
                                                        selectedAddress.postal_code
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-red-600 font-medium">
                                            ⚠ Alamat belum dipilih
                                        </p>
                                    )
                                ) : (
                                    <div className="space-y-2">
                                        <span className="block text-slate-600">
                                            Lokasi Properti
                                        </span>
                                        <p className="text-sm font-medium text-slate-800">
                                            {property.location}
                                        </p>
                                    </div>
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
                                        property.final_price || property.price
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    <AlertDialogFooter className="flex-shrink-0 pt-4 border-t">
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

export default DetailProperty;

DetailProperty.layout = (page) => <MainLayout>{page}</MainLayout>;
