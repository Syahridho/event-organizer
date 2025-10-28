import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, ShoppingBag, CheckCircle2Icon } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Eye } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Link } from "@inertiajs/react";
import Avatar from "@/components/avatar";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { formatRupiahInput } from "@/Utils/formatRupiah";
import { useState } from "react";
import { Input } from "./ui/input";
import { useMemo } from "react";

// ALGORITMA TERCEPAT: Pengecekan Tanggal di JavaScript
const isRentDateArrivedOrPassed = (rentDaysString) => {
    if (!rentDaysString) return false;

    // 1. Ambil Tanggal Hari Ini (dibuat pada awal hari tanpa waktu)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 2. Ambil Tanggal Sewa (dibuat pada awal hari tanpa waktu)
    // Date() dapat langsung memparsing YYYY-MM-DD
    const rentDate = new Date(rentDaysString);
    rentDate.setHours(0, 0, 0, 0);

    // 3. Bandingkan: true jika Tanggal Sewa <= Tanggal Hari Ini
    return rentDate.getTime() <= today.getTime();
};

export function TransactionCard({
    item,
    statusColors,
    statusTranslations,
    onOpenDetail,
    onConfirm,
    onOtw,
    onProcess,
    onCompleted,
    onCancel,
    onChat,
    processing,
    note,
    setNote,
    errors,
}) {
    console.log(item);
    const formattedDate = (() => {
        try {
            // Coba format tanggal sewa
            return format(new Date(item.rent_days), "EEEE, dd MMMM yyyy", {
                locale: id,
            });
        } catch {
            try {
                // Fallback ke tanggal dibuat
                return format(
                    new Date(item?.transaction?.created_at),
                    "EEEE, dd MMMM yyyy",
                    { locale: id }
                );
            } catch {
                return "-";
            }
        }
    })();

    const formatRupiah = (number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(number);
    };

    const [deliveryFee, setDeliveryFee] = useState(0);

    const handleChange = (e) => {
        const formatted = formatRupiahInput(e.target.value);
        setDeliveryFee(formatted);
    };

    const amountText = `Rp ${Number(item?.price || 0).toLocaleString("id-ID")}`;
    const buyer = item?.transaction?.user;
    const buyerPhoto = buyer?.profile_photo
        ? buyer.profile_photo.startsWith("http")
            ? buyer.profile_photo
            : `/storage/${buyer.profile_photo}`
        : undefined;

    // Translate item types to localized labels
    const typeTranslations = {
        service: "Jasa",
        building: "Gedung/Tempat",
        property: "Properti",
        rent_property: "Properti",
    };
    const typeLabel =
        typeTranslations[item?.item_type] ??
        (item?.item_type
            ? item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1)
            : "-");

    // Logika utama untuk tombol Selesai (Completed)
    // cek sebelum pulang
    const canComplete =
        item.status === "work" && !isRentDateArrivedOrPassed(item.rent_days);

    const transaction = item.transaction;
    const address = transaction.address;

    const getDeliveryIcon = (option) => {
        if (option === "delivery")
            return <Truck className="w-5 h-5 text-primary" />;
        if (option === "pickup")
            return <ShoppingBag className="w-5 h-5 text-primary" />;
        return null;
    };

    // Fungsi untuk mendapatkan judul berdasarkan opsi pengiriman
    const getDeliveryTitle = (option) => {
        if (option === "delivery") return "Pembeli meminta diantar";
        if (option === "pickup") return "Pembeli akan mengambil sendiri";
        return "Opsi Tidak Ditentukan";
    };

    const isTimeWindowActive = (rentDateString) => {
        if (!rentDateString) return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const rentDate = new Date(rentDateString);
        rentDate.setHours(0, 0, 0, 0);

        // Hitung tanggal 1 hari sebelum tanggal sewa (26 Okt)
        const dayBeforeRent = new Date(rentDate);
        dayBeforeRent.setDate(rentDate.getDate() - 1);

        // Dapatkan timestamp hari ini
        const todayTime = today.getTime();

        // Bandingkan: Apakah hari ini adalah TANGGAL SEWA (27 Okt) ATAU 1 HARI SEBELUMNYA (26 Okt)?
        const isRentDay = todayTime === rentDate.getTime();
        const isDayBefore = todayTime === dayBeforeRent.getTime();

        return isRentDay || isDayBefore;
    };

    const isActionTime = useMemo(() => {
        // Gunakan fungsi helper yang diperbarui
        return isTimeWindowActive(item.rent_days);
    }, [item.rent_days]);

    const isReadyForAction = useMemo(() => {
        const isRentItem = ["rent_property", "service"].includes(
            item.item_type
        );
        return (
            item.status === "confirmed" &&
            item.item_type !== "building" &&
            isRentItem
        );
    }, [item.status, item.item_type]);

    // --- Logika isTooEarlyForOtw diperbarui ---
    const isTooEarlyForOtw = useMemo(() => {
        // Sekarang, 'isActionTime' adalah kapan OTW diizinkan.
        // Jika isReadyForAction benar, tapi BUKAN waktunya (isActionTime false), maka terlalu awal.
        // Console.log Anda akan menunjukkan:
        // isReadyForAction: true
        // isActionTime: true (jika hari ini 26 atau 27 Oktober)

        console.log(`Ready: ${isReadyForAction}, ActionTime: ${isActionTime}`);

        // Logika: Item siap untuk aksi DAN BUKAN di jendela waktu aksi
        return isReadyForAction && !isActionTime;
    }, [isReadyForAction, isActionTime]);

    return (
        <Card className="shadow-sm">
            {/* Same padding as skeleton for height consistency */}
            <CardContent className="p-4 sm:p-5">
                {/* Top row: left content (icon+texts), right content (amount+badge) */}
                <div className="flex items-center justify-between">
                    {/* Left */}
                    <div className="flex items-center space-x-4">
                        {/* Icon circle (first letter of item type) */}
                        <Avatar
                            src={buyerPhoto}
                            name={buyer?.name ?? item?.item?.name ?? "User"}
                            size="md"
                        />
                        <div>
                            <div className="font-medium">
                                {item?.item?.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Order : {item?.transaction?.order_id ?? "-"}
                            </div>
                            <Badge variant="outline" className="mb-2">
                                {formattedDate}
                            </Badge>

                            <div className="text-xs text-muted-foreground">
                                Nama Pembeli :{" "}
                                {item?.transaction?.user?.name ?? "-"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Email : {item?.transaction?.user?.email ?? "-"}
                            </div>

                            <div className="text-xs text-muted-foreground">
                                Tipe : {typeLabel}
                            </div>

                            {item.delivery_type && (
                                <div className="text-xs text-muted-foreground">
                                    Tipe:{" "}
                                    {item.delivery_type === "delivery"
                                        ? "Diantar"
                                        : item.delivery_type === "pickup"
                                        ? "Diambil Sendiri"
                                        : "Tidak Ditentukan"}
                                </div>
                            )}

                            {item.delivery_type === "pickup" ? (
                                // ==========================================================
                                // SKENARIO 1: PICKUP (DIAMBIL SENDIRI)
                                // ==========================================================
                                <Alert className="mt-3 p-3 border rounded-lg bg-blue-50 border-blue-200">
                                    <AlertTitle className="text-blue-800 flex flex-col sm:flex-row sm:items-center justify-between font-semibold">
                                        {/* Status Utama & Detail */}
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-base">
                                                {item.status === "work"
                                                    ? "Pembeli Sudah Menjemput Properti"
                                                    : item.status ===
                                                      "completed"
                                                    ? "Pembeli Sudah Mengembalikan Properti"
                                                    : "Pembeli Akan Menjemput Properti"}
                                            </span>

                                            {/* Status Sub-teks */}
                                            <span className="font-normal text-sm text-blue-600">
                                                {item.status === "work"
                                                    ? "(Ambil Foto Bukti)"
                                                    : item.status ===
                                                      "completed"
                                                    ? ""
                                                    : "(Menunggu Penjemputan)"}
                                            </span>
                                        </div>
                                    </AlertTitle>
                                </Alert>
                            ) : (
                                item.delivery_type === "delivery" &&
                                item.delivery_fee > 0 &&
                                // ==========================================================
                                // SKENARIO 2: DELIVERY (DIANTAR) DENGAN BIAYA
                                // ==========================================================
                                (item?.delivery_fee_payment_status ===
                                "settlement" ? (
                                    // KONDISI 2A: Biaya Antar Sudah Bayar (Settlement)
                                    <Alert className="mt-2 bg-green-100 border-green-200">
                                        <AlertTitle className="text-green-800 flex items-center justify-between font-semibold">
                                            <span>
                                                {item.status === "work"
                                                    ? "Properti Sedang Diproses"
                                                    : "Biaya Antar dibayar"}
                                            </span>
                                            <span className="font-bold ms-1">
                                                {formatRupiah(
                                                    item.delivery_fee
                                                )}
                                            </span>
                                        </AlertTitle>
                                    </Alert>
                                ) : (
                                    // KONDISI 2B: Biaya Antar Belum Bayar (Pending/Null)
                                    <Alert className="mt-2 bg-yellow-50 border-yellow-200">
                                        <AlertTitle className="text-yellow-800 flex items-center justify-between font-semibold">
                                            <span>
                                                Pembeli Belum Bayar Biaya Antar
                                            </span>
                                            <span className="font-bold ms-1">
                                                {formatRupiah(
                                                    item.delivery_fee
                                                )}
                                            </span>
                                        </AlertTitle>
                                    </Alert>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right */}
                    <div className="text-right">
                        <div className="font-mono font-semibold">
                            {amountText}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Qty: {item?.qty ?? 0}
                        </div>
                        <span
                            className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                statusColors[item.status] || ""
                            }`}
                        >
                            {statusTranslations[item.status] || item.status}
                        </span>
                    </div>
                </div>

                {/* Actions row */}
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                    {/* Detail */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onOpenDetail(item)}
                        title="Lihat detail"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>

                    {/* Status-based actions */}
                    {item.status === "pending" && (
                        <>
                            {/* Cancel / Tolak with note */}
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">Tolak</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            Tolak Transaksi
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            <div className="space-y-4">
                                                <p>
                                                    Apakah Anda yakin ingin
                                                    menolak transaksi ini? Mohon
                                                    berikan alasannya.
                                                </p>
                                                <textarea
                                                    className="w-full h-24 p-2 border rounded-md"
                                                    placeholder="Masukkan alasan pembatalan..."
                                                    value={note ?? ""}
                                                    onChange={(e) =>
                                                        setNote(e.target.value)
                                                    }
                                                />
                                                {errors?.note && (
                                                    <div className="text-sm text-red-500">
                                                        {errors.note}
                                                    </div>
                                                )}
                                            </div>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>
                                            Batal
                                        </AlertDialogCancel>
                                        <Button
                                            variant="destructive"
                                            onClick={() => onCancel(item.id)}
                                            disabled={processing || !note}
                                        >
                                            Tolak
                                        </Button>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            {/* Confirm */}
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button>Konfirmasi</Button>
                                </AlertDialogTrigger>

                                <AlertDialogContent className="flex flex-col max-h-[90vh]">
                                    {/* Header Tetap */}
                                    <AlertDialogHeader className="flex-shrink-0">
                                        <AlertDialogTitle>
                                            Konfirmasi Transaksi
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Apakah Anda yakin ingin
                                            mengonfirmasi transaksi ini? Pesanan
                                            akan diteruskan.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>

                                    {/* --- KONTEN YANG BISA DI-SCROLL (flex-grow dan overflow-y-auto) --- */}
                                    <div className="flex-grow overflow-y-auto p-2 space-y-4">
                                        <Alert className="bg-primary/5 border-primary/20 flex items-center gap-2">
                                            <div className="">
                                                {getDeliveryIcon(
                                                    item.delivery_type
                                                )}
                                            </div>
                                            <AlertTitle className="text-primary font-bold">
                                                {getDeliveryTitle(
                                                    item.delivery_type
                                                )}
                                            </AlertTitle>
                                        </Alert>

                                        {/* Tampilkan Detail Alamat HANYA JIKA OPSI DELIVERY */}
                                        {item.delivery_type === "delivery" && (
                                            <div className="space-y-4">
                                                {/* DETAIL PENERIMA */}
                                                <div className="space-y-3 text-sm p-4 border rounded-lg bg-gray-50 dark:bg-zinc-800">
                                                    <h4 className="font-semibold mb-2 text-base">
                                                        Detail Alamat Pengiriman
                                                    </h4>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
                                                        {/* Nama & Telepon */}
                                                        <p>
                                                            <span className="text-muted-foreground block">
                                                                Penerima:
                                                            </span>
                                                            <span className="font-medium">
                                                                {
                                                                    address.recipient_name
                                                                }
                                                            </span>
                                                        </p>
                                                        <p>
                                                            <span className="text-muted-foreground block">
                                                                Telepon:
                                                            </span>
                                                            <span className="font-medium">
                                                                {address.phone}
                                                            </span>
                                                        </p>

                                                        {/* Kota & Provinsi */}
                                                        <p>
                                                            <span className="text-muted-foreground block">
                                                                Kota/Kabupaten:
                                                            </span>
                                                            <span className="font-medium">
                                                                {address.city}
                                                            </span>
                                                        </p>
                                                        <p>
                                                            <span className="text-muted-foreground block">
                                                                Provinsi:
                                                            </span>
                                                            <span className="font-medium">
                                                                {
                                                                    address.province
                                                                }
                                                            </span>
                                                        </p>

                                                        {/* Kode Pos */}
                                                        <p className="col-span-1 sm:col-span-2">
                                                            <span className="text-muted-foreground block">
                                                                Kode Pos:
                                                            </span>
                                                            <span className="font-medium">
                                                                {
                                                                    address.postal_code
                                                                }
                                                            </span>
                                                        </p>
                                                    </div>

                                                    {/* Alamat Lengkap */}
                                                    <div className="pt-3 border-t border-gray-200 dark:border-zinc-700">
                                                        <span className="text-muted-foreground block">
                                                            Alamat Lengkap:
                                                        </span>
                                                        <span className="font-medium text-wrap">
                                                            {
                                                                address.address_line
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="pt-3 border-t border-gray-200 dark:border-zinc-700">
                                                        <span className="text-muted-foreground block">
                                                            Catatan Pembeli
                                                        </span>
                                                        <span className="font-medium text-wrap">
                                                            {address.note}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* INPUT BIAYA ANTAR */}
                                                <div className="grid w-full gap-3">
                                                    <Label htmlFor="delivery_fee">
                                                        Masukan Perkiraan Biaya
                                                        Antar
                                                    </Label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                            Rp.
                                                        </span>
                                                        <Input
                                                            id="delivery_fee"
                                                            name="delivery_fee"
                                                            type="text"
                                                            value={deliveryFee}
                                                            onChange={
                                                                handleChange
                                                            }
                                                            className="pl-10 bg-background text-foreground"
                                                        />
                                                    </div>
                                                </div>

                                                {/* CATATAN PEMBELI */}
                                            </div>
                                        )}

                                        {/* OPSI PICKUP (Tampilkan Biaya Antar: Rp 0) */}
                                        {item.delivery_type === "pickup" && (
                                            <div className="flex justify-between items-center p-3 border rounded-lg bg-gray-50 dark:bg-zinc-800 font-semibold">
                                                <span className="text-muted-foreground">
                                                    Biaya Antar:
                                                </span>
                                                <span className="text-lg text-primary">
                                                    {formatRupiah(0)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Tombol Tetap */}
                                    <AlertDialogFooter className="flex-shrink-0">
                                        <AlertDialogCancel>
                                            Batal
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() =>
                                                onConfirm(item.id, deliveryFee)
                                            }
                                        >
                                            Ya, Konfirmasi
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}

                    {/* Button OTW */}
                    {isReadyForAction && (
                        <div className="flex flex-col gap-2">
                            {/* 1. Tombol OTW / Sudah Diambil */}
                            <Button
                                onClick={() => onOtw(item.id)}
                                // Tombol dinonaktifkan jika:
                                // 1. Terlalu awal untuk OTW (waktu belum tepat)
                                // 2. ATAU item delivery & Biaya antar belum lunas
                                disabled={
                                    isTooEarlyForOtw ||
                                    (item.delivery_type === "delivery" &&
                                        item.delivery_fee_payment_status !==
                                            "settlement")
                                }
                            >
                                {item.delivery_type === "pickup"
                                    ? "Sudah Diambil"
                                    : "Otw"}
                            </Button>

                            {/* 2. Tanda Keterangan Waktu */}
                            {isTooEarlyForOtw && (
                                <span className="text-xs text-center text-yellow-600">
                                    Otw/Ambil: -1 Hari sebelum {item.rent_days}
                                </span>
                            )}
                        </div>
                    )}
                    {/* Button Kerja (Process) */}
                    {item.status === "otw" && (
                        <Button onClick={() => onProcess(item.id)}>
                            Kerja
                        </Button>
                    )}

                    {/* Tombol Selesai (Completed) - Menggunakan Logika Gabungan */}
                    {console.log(canComplete)}
                    {canComplete && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button>Selesai</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Selesaikan Transaksi
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Apakah Anda yakin telah menyelesaikan{" "}
                                        {item.item_type === "building"
                                            ? "acara"
                                            : "pekerjaan"}{" "}
                                        ini? Status akan diubah menjadi selesai
                                        dan dana akan masuk ke dompet Anda. Uang{" "}
                                        {formatRupiah(item.price)}
                                        {item.item_type === "rent_property" &&
                                            `Ongkir ${formatRupiah(
                                                item.delivery_fee
                                            )}`}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => onCompleted(item.id)}
                                    >
                                        Ya, Selesai
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}

                    {/* Chat */}
                    <Button
                        variant="outline"
                        asChild
                        disabled={!item?.transaction?.user?.uuid}
                    >
                        <Link
                            href={`/dashboard/chat/${
                                item?.transaction?.user?.uuid || ""
                            }`}
                        >
                            Chat
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
