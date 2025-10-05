import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    ArrowLeft,
    MapPin,
    Star,
    Share2,
    Heart,
    Loader2,
    Users,
} from "lucide-react";
import { Head, usePage } from "@inertiajs/react";
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
import MainLayout from "@/Layouts/Main";

const DetailBuilding = () => {
    const { building, ziggy, transaction, user, leaves, photos } =
        usePage().props;

    console.log("Building data:", building);

    const dispatch = useDispatch();

    const items = useMemo(
        () => [{ id: building.id, price: building.price }],
        [building.id, building.price]
    );
    const {
        itemCounts,
        selectedDates,
        handleChangeSelectedDate,
        totalHarga,
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
    });
    const { snapLoaded, paymentError, setPaymentError } = useMidtrans();

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
        console.log(selectedDate);
        if (!selectedDate) {
            toast.error("Silahkan pilih tanggal sewa gedung");
            return;
        }

        handleChangeItem(building.id, 1);

        const itemsToAdd = { [building.id]: 1 };
        const rentDaysToAdd = {
            [building.id]: selectedDate.toLocaleDateString("en-CA", {
                timeZone: "Asia/Jakarta",
            }),
        };

        const result = await addItemsToCart({
            items: itemsToAdd,
            itemList: [building],
            rentDays: rentDaysToAdd,
            dispatch,
            itemCategory: "building",
        });

        if (result.success) {
            toast.success(`${building.name} ditambahkan ke keranjang!`);
        } else {
            toast.warning(result.message);
        }
    };

    const handlePayment = useCallback(
        async (e) => {
            if (e) e.preventDefault();

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
                const paymentData = {
                    items: [
                        {
                            id: Number(building.id),
                            type: "building",
                            price: Number(building.price),
                            quantity: 1,
                            rent_days: selectedDate.toLocaleDateString(
                                "en-CA",
                                { timeZone: "Asia/Jakarta" }
                            ),
                            name: building.name,
                        },
                    ],
                    amount: Number(building.price),
                    name: user.name,
                    email: user.email,
                    note: note,
                };

                console.log("Payment Data:", paymentData);

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
        [snapLoaded, selectedDate, building, user, note]
    );

    const formatPrice = (price) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        }).format(price);
    };

    const images = [
        {
            url: `${ziggy.url}/storage/thumbnails/${building.thumbnail}`,
            type: "thumbnail",
        },
        ...(photos?.map((p) => ({
            url: `${ziggy.url}/storage/item-photos/${p.photo}`,
            type: "photo",
            caption: p.caption,
        })) || []),
    ];

    return (
        <div className="min-h-screen">
            <Head title={building.name} />

            {paymentError && <p className="text-red-500">{paymentError}</p>}
            <div className="max-w-4xl mx-auto px-4 py-8">
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
                                                            alt={building.name}
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
                                    {building.status === "active"
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
                                            `Foto gedung ${i + 1}`
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
                                            {building.name}
                                        </h1>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <MapPin className="h-4 w-4" />
                                            <span>{building.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Users className="h-4 w-4" />
                                            <span>
                                                Kapasitas: {building.capacity}{" "}
                                                orang
                                            </span>
                                        </div>
                                    </div>
                                    {building.rating && (
                                        <Rating
                                            value={building.rating}
                                            size={20}
                                            showValue={true}
                                        />
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-3">
                                            Deskripsi Gedung
                                        </h3>
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: building.description,
                                            }}
                                        />
                                    </div>

                                    {building.item_photos &&
                                        building.item_photos.length > 0 && (
                                            <div>
                                                <h3 className="font-semibold text-lg mb-3">
                                                    Galeri Foto
                                                </h3>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {building.item_photos.map(
                                                        (photo, index) => (
                                                            <div
                                                                key={photo.id}
                                                                className="space-y-2"
                                                            >
                                                                <img
                                                                    src={`${ziggy.url}/storage/item-photos/${photo.photo}`}
                                                                    alt={
                                                                        photo.caption
                                                                    }
                                                                    className="w-full h-32 object-cover rounded-lg"
                                                                />
                                                                {photo.caption && (
                                                                    <p className="text-sm text-slate-600">
                                                                        {
                                                                            photo.caption
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white rounded-lg shadow-lg">
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
                                        {formatPrice(building.price)}
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1">
                                        Perhari
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Kapasitas: {building.capacity} orang
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <Button
                                        className="w-full bg-blue-800 hover:bg-blue-500"
                                        onClick={() => setIsPaymentOpen(true)}
                                    >
                                        Sewa Gedung
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Sheet open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <SheetContent className="md:!max-w-xl w-full flex flex-col max-h-screen">
                    <SheetHeader className="flex-shrink-0 pb-4 border-b">
                        <SheetTitle>Sewa Gedung - {building.name}</SheetTitle>
                        <SheetDescription>
                            Pilih tanggal untuk penyewaan gedung
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
                                Lokasi Gedung
                            </h1>
                            <div className="border rounded-lg p-4 bg-slate-50">
                                <div className="flex items-center gap-2 text-slate-700">
                                    <MapPin className="h-4 w-4" />
                                    <span className="text-sm">
                                        {building.location}
                                    </span>
                                </div>
                            </div>
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
                                placeholder="Catatan tambahan untuk penyewaan gedung"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    <SheetFooter className="flex-shrink-0 pt-4 border-t space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => handleAddToCart()}
                            className="px-3"
                        >
                            <FaShoppingCart className="w-4 h-4" />
                        </Button>
                        <Button
                            onClick={() => {
                                setIsPaymentOpen(false);
                                setIsConfirmOpen(true);
                            }}
                            className="flex-1"
                        >
                            Bayar
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

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
                                RINCIAN PENYEWAAN
                            </div>

                            <div className="flex justify-between py-2 border-b">
                                <span className="text-slate-600">Gedung</span>
                                <span className="font-medium">
                                    {building.name}
                                </span>
                            </div>

                            <div className="flex justify-between py-2 border-b">
                                <span className="text-slate-600">
                                    Kapasitas
                                </span>
                                <span className="font-medium">
                                    {building.capacity} orang
                                </span>
                            </div>

                            <div className="flex justify-between py-2 border-b">
                                <span className="text-slate-600">Harga</span>
                                <span className="font-medium">
                                    {formatPrice(building.price)} / hari
                                </span>
                            </div>

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

                            <div className="py-3 border-b">
                                <span className="block text-slate-600 mb-2">
                                    Lokasi Gedung
                                </span>
                                <p className="text-sm font-medium text-slate-800">
                                    {building.location}
                                </p>
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
                                <span>{formatPrice(building.price)}</span>
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

export default DetailBuilding;

DetailBuilding.layout = (page) => <MainLayout>{page}</MainLayout>;
