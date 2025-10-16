"use client";

import React, { useState, useMemo } from "react";
import { useForm, usePage, Head } from "@inertiajs/react";
import AppLayout from "@/Layouts/App/AppSidebarLayout";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Eye } from "lucide-react"; // Import ikon Eye

const breadcrumbs = [
    {
        title: "Dashboard Mitra",
        href: "/dashboard",
    },
];

const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    otw: "bg-blue-100 text-blue-800",
    work: "bg-blue-100 text-blue-800",
    completed: "bg-purple-100 text-purple-800",
    cancel: "bg-red-100 text-red-800",
    deny: "bg-red-100 text-red-800",
    expire: "bg-red-100 text-red-800",
    refund: "bg-red-100 text-red-800",
};

const statusTranslations = {
    pending: "Menunggu",
    confirmed: "Dikonfirmasi",
    otw: "Dalam Perjalanan",
    work: "Kerja",
    completed: "Selesai",
    cancel: "Dibatalkan",
    deny: "Ditolak",
    expire: "Kadaluarsa",
    refund: "Pengembalian Dana",
};

const serviceTypes = {
    service: {
        text: "Jasa",
        color: "bg-yellow-100 text-yellow-800",
    },
    building: {
        text: "Gedung",
        color: "bg-amber-100 text-amber-800",
    },
    property: {
        text: "Properti",
        color: "bg-purple-100 text-purple-800",
    },
};

const allPossibleStatuses = [
    "pending",
    "confirmed",
    "otw",
    "work",
    "completed",
    "cancel",
];

export default function MitraTransactionDashboard({ transactionItems }) {
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedItem, setSelectedItem] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        note: "",
    });

    const handleConfirm = (id) => {
        post(route("mitra.transactions.confirm", id), {
            onSuccess: () => {
                toast.success("Item berhasil dikonfirmasi!");
            },
            onError: () => {
                toast.error("Gagal mengonfirmasi item. Silakan coba lagi.");
            },
        });
    };

    const handleOtw = (id) => {
        post(route("mitra.transactions.otw", id), {
            onSuccess: () => {
                toast.success("Hati dijalan");
            },
            onError: () => {
                toast.error(
                    "Gagal mengubah status pesanan. Silakan coba lagi."
                );
            },
        });
    };

    const handleProcess = (id) => {
        post(route("mitra.transactions.work", id), {
            onSuccess: () => {
                toast.success("Selamat Bekerja!");
            },
            onError: () => {
                toast.error("Gagal memperbarui status. Silakan coba lagi.");
            },
        });
    };

    const handleCompleted = (id) => {
        post(route("mitra.transactions.complete", id), {
            onSuccess: () => {
                toast.success("Uang anda sudah masuk didashboard");
            },
            onError: () => {
                toast.error("Gagal memperbarui status. Silakan coba lagi.");
            },
        });
    };

    const handleCancel = (id) => {
        post(route("mitra.transactions.cancel", id), {
            onSuccess: () => {
                toast.success("Transaksi berhasil dibatalkan!");
            },
            onError: () => {
                toast.error("Gagal membatalkan transaksi. Silakan coba lagi.");
            },
        });
    };

    const handleChat = (buyerId) => {
        console.log(`Mulai chat dengan pembeli ID: ${buyerId}`);
    };

    const handleOpenDetailModal = (item) => {
        setSelectedItem(item);
        setIsDetailModalOpen(true);
    };

    const filteredTransactions = useMemo(() => {
        if (statusFilter === "all") {
            return transactionItems;
        }
        return transactionItems.filter((item) => item.status === statusFilter);
    }, [transactionItems, statusFilter]);

    const groupedTransactions = transactionItems.reduce((acc, item) => {
        const status = item.status;
        if (!acc[status]) {
            acc[status] = [];
        }
        acc[status].push(item);
        return acc;
    }, {});

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Mitra" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Transaksi Menunggu
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {groupedTransactions.pending?.length || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Perlu tindakan Anda
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Transaksi Selesai
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {(groupedTransactions.completed?.length || 0) +
                                    (groupedTransactions.settlement?.length ||
                                        0) +
                                    (groupedTransactions.capture?.length || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Transaksi sukses
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Transaksi Dibatalkan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {(groupedTransactions.cancelled?.length || 0) +
                                    (groupedTransactions.deny?.length || 0) +
                                    (groupedTransactions.expire?.length || 0) +
                                    (groupedTransactions.refund?.length || 0) +
                                    (groupedTransactions.cancel?.length || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Transaksi yang gagal
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <CardHeader>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex-1">
                                <CardTitle>Daftar Transaksi</CardTitle>
                                <CardDescription>
                                    Daftar semua transaksi yang terkait dengan
                                    produk Anda.
                                </CardDescription>
                            </div>
                            <div className="flex gap-2 items-center">
                                <label className="text-sm font-medium">
                                    Filter Status:
                                </label>
                                <Select
                                    onValueChange={setStatusFilter}
                                    defaultValue="all"
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Pilih Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Semua
                                        </SelectItem>
                                        {allPossibleStatuses.map((status) => (
                                            <SelectItem
                                                key={status}
                                                value={status}
                                            >
                                                {statusTranslations[status]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Layanan</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((item) => {
                                        const serviceInfo =
                                            serviceTypes[
                                                item.item_type.toLowerCase()
                                            ] || {};
                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {item.item.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${serviceInfo.color}`}
                                                    >
                                                        {serviceInfo.text ||
                                                            item.item_type}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {format(
                                                        new Date(
                                                            item.rent_days
                                                        ),
                                                        "EEEE, dd MMMM yyyy",
                                                        { locale: id }
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                            statusColors[
                                                                item.status
                                                            ]
                                                        }`}
                                                    >
                                                        {
                                                            statusTranslations[
                                                                item.status
                                                            ]
                                                        }
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() =>
                                                                handleOpenDetailModal(
                                                                    item
                                                                )
                                                            }
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {item.status ===
                                                            "pending" && (
                                                            <>
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger
                                                                        asChild
                                                                    >
                                                                        <Button variant="destructive">
                                                                            Tolak
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>
                                                                                Tolak
                                                                                Transaksi
                                                                            </AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                <div className="space-y-4">
                                                                                    <p>
                                                                                        Apakah
                                                                                        Anda
                                                                                        yakin
                                                                                        ingin
                                                                                        menolak
                                                                                        transaksi
                                                                                        ini?
                                                                                        Mohon
                                                                                        berikan
                                                                                        alasannya.
                                                                                    </p>
                                                                                    <textarea
                                                                                        className="w-full h-24 p-2 border rounded-md"
                                                                                        placeholder="Masukkan alasan pembatalan..."
                                                                                        value={
                                                                                            data.note
                                                                                        }
                                                                                        onChange={(
                                                                                            e
                                                                                        ) =>
                                                                                            setData(
                                                                                                "note",
                                                                                                e
                                                                                                    .target
                                                                                                    .value
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                    {errors.note && (
                                                                                        <div className="text-sm text-red-500">
                                                                                            {
                                                                                                errors.note
                                                                                            }
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
                                                                                onClick={() =>
                                                                                    handleCancel(
                                                                                        item.id
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    processing ||
                                                                                    !data.note
                                                                                }
                                                                            >
                                                                                Tolak
                                                                            </Button>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger
                                                                        asChild
                                                                    >
                                                                        <Button>
                                                                            Konfirmasi
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>
                                                                                Konfirmasi
                                                                                Transaksi
                                                                            </AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                Apakah
                                                                                Anda
                                                                                yakin
                                                                                ingin
                                                                                mengonfirmasi
                                                                                transaksi
                                                                                ini?
                                                                                Pesanan
                                                                                akan
                                                                                diteruskan.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>
                                                                                Batal
                                                                            </AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() =>
                                                                                    handleConfirm(
                                                                                        item.id
                                                                                    )
                                                                                }
                                                                            >
                                                                                Ya,
                                                                                Konfirmasi
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </>
                                                        )}
                                                        {item.status ===
                                                            "confirmed" && (
                                                            <Button
                                                                onClick={() =>
                                                                    handleOtw(
                                                                        item.id
                                                                    )
                                                                }
                                                            >
                                                                OTW
                                                            </Button>
                                                        )}
                                                        {item.status ===
                                                            "otw" && (
                                                            <Button
                                                                onClick={() =>
                                                                    handleProcess(
                                                                        item.id
                                                                    )
                                                                }
                                                            >
                                                                Kerja
                                                            </Button>
                                                        )}
                                                        {item.status ===
                                                            "work" && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger
                                                                    asChild
                                                                >
                                                                    <Button>
                                                                        Selesai
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>
                                                                            Selesaikan
                                                                            Transaksi
                                                                        </AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Apakah
                                                                            Anda
                                                                            yakin
                                                                            telah
                                                                            menyelesaikan
                                                                            pekerjaan
                                                                            ini?
                                                                            Status
                                                                            akan
                                                                            diubah
                                                                            menjadi
                                                                            selesai
                                                                            dan
                                                                            dana
                                                                            akan
                                                                            masuk
                                                                            ke
                                                                            dompet
                                                                            Anda.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>
                                                                            Batal
                                                                        </AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() =>
                                                                                handleCompleted(
                                                                                    item.id
                                                                                )
                                                                            }
                                                                        >
                                                                            Ya,
                                                                            Selesai
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}
                                                        <Button
                                                            variant="outline"
                                                            onClick={() =>
                                                                handleChat(
                                                                    item
                                                                        .transaction
                                                                        .user_id
                                                                )
                                                            }
                                                        >
                                                            Chat
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-center"
                                        >
                                            Tidak ada data transaksi.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </div>
            </div>

            {/* Modal Detail Transaksi */}
            {selectedItem && (
                <Dialog
                    open={isDetailModalOpen}
                    onOpenChange={setIsDetailModalOpen}
                >
                    <DialogContent className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
                        <DialogHeader className="text-center border-b pb-4 mb-4">
                            <DialogTitle className="text-xl font-bold text-gray-800">
                                Detail Transaksi
                            </DialogTitle>
                            <div className="text-sm text-gray-500">
                                Order ID: {selectedItem.transaction.order_id}
                            </div>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Detail Item Pesanan */}
                            <div>
                                <h4 className="font-semibold text-lg text-gray-700 mb-2">
                                    Detail Pesanan
                                </h4>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="text-gray-600">
                                        Nama Produk:
                                    </span>
                                    <span className="font-medium">
                                        {selectedItem.item.name}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="text-gray-600">
                                        Jenis:
                                    </span>
                                    <span className="font-medium capitalize">
                                        {selectedItem.item_type}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="text-gray-600">
                                        Jumlah:
                                    </span>
                                    <span className="font-medium">
                                        {selectedItem.qty}
                                    </span>
                                </div>
                                {/* Mengatasi data rent_days yang tidak valid, kembali ke created_at */}
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="text-gray-600">
                                        Tanggal Pesan:
                                    </span>
                                    <span className="font-medium">
                                        {format(
                                            new Date(
                                                selectedItem.transaction.created_at
                                            ),
                                            "dd MMMM yyyy",
                                            { locale: id }
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="text-gray-600">
                                        Tanggal Datang :
                                    </span>
                                    <span className="font-medium">
                                        {format(
                                            new Date(selectedItem.rent_days),
                                            "dd MMMM yyyy",
                                            { locale: id }
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="text-gray-600">
                                        Total Harga:
                                    </span>
                                    <span className="font-bold text-right font-mono">
                                        Rp{" "}
                                        {selectedItem.price.toLocaleString(
                                            "id-ID"
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="text-gray-600">
                                        Status:
                                    </span>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                            statusColors[selectedItem.status]
                                        }`}
                                    >
                                        {
                                            statusTranslations[
                                                selectedItem.status
                                            ]
                                        }
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-dashed my-4"></div>

                            {selectedItem.transaction.address && (
                                <>
                                    {/* Detail Alamat Pengiriman */}
                                    <div>
                                        <h4 className="font-semibold text-lg text-gray-700 mb-2">
                                            Alamat Pengiriman
                                        </h4>
                                        <div className="space-y-1 text-sm">
                                            <p>
                                                <span className="text-gray-600 font-semibold">
                                                    Penerima:
                                                </span>{" "}
                                                {
                                                    selectedItem.transaction
                                                        .address.recipient_name
                                                }
                                            </p>
                                            <p>
                                                <span className="text-gray-600 font-semibold">
                                                    Telepon:
                                                </span>{" "}
                                                {
                                                    selectedItem.transaction
                                                        .address.phone
                                                }
                                            </p>
                                            <p>
                                                <span className="text-gray-600 font-semibold">
                                                    Alamat:
                                                </span>{" "}
                                                {
                                                    selectedItem.transaction
                                                        .address.address_line
                                                }
                                            </p>
                                            <p>
                                                <span className="text-gray-600 font-semibold">
                                                    Kota:
                                                </span>{" "}
                                                {
                                                    selectedItem.transaction
                                                        .address.city
                                                }
                                            </p>
                                            <p>
                                                <span className="text-gray-600 font-semibold">
                                                    Provinsi:
                                                </span>{" "}
                                                {
                                                    selectedItem.transaction
                                                        .address.province
                                                }
                                            </p>
                                            <p>
                                                <span className="text-gray-600 font-semibold">
                                                    Kode Pos:
                                                </span>{" "}
                                                {
                                                    selectedItem.transaction
                                                        .address.postal_code
                                                }
                                            </p>
                                            {selectedItem.transaction.address
                                                .note && (
                                                <p>
                                                    <span className="text-gray-600 font-semibold">
                                                        Catatan:
                                                    </span>{" "}
                                                    {
                                                        selectedItem.transaction
                                                            .address.note
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <DialogFooter className="border-t pt-4 mt-4">
                            <DialogClose asChild>
                                <Button variant="outline">Tutup</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </AppLayout>
    );
}
