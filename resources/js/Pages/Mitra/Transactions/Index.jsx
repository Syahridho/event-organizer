"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useForm, Head, Link, router } from "@inertiajs/react";
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
import { TransactionCard } from "@/components/transaction-card";
import { TransactionCardSkeleton } from "@/components/transaction-card-skeleton";
import { Button } from "@/components/ui/button";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const breadcrumbs = [
    {
        title: "Dashboard Mitra",
        href: "/dashboard",
    },
];

const statusColors = {
    // Transaction statuses
    pending: "bg-yellow-100 text-yellow-800",
    settlement: "bg-green-100 text-green-800",
    capture: "bg-green-100 text-green-800",
    cancel: "bg-red-100 text-red-800",
    cancelled: "bg-red-100 text-red-800",
    deny: "bg-red-100 text-red-800",
    expire: "bg-red-100 text-red-800",
    refund: "bg-red-100 text-red-800",
    // Item workflow statuses (for badge display if needed)
    confirmed: "bg-green-100 text-green-800",
    otw: "bg-blue-100 text-blue-800",
    work: "bg-blue-100 text-blue-800",
    completed: "bg-purple-100 text-purple-800",
};

const statusTranslations = {
    // Transaction statuses
    pending: "Menunggu",
    settlement: "Berhasil",
    capture: "Berhasil",
    cancel: "Dibatalkan",
    cancelled: "Dibatalkan",
    deny: "Ditolak",
    expire: "Kadaluarsa",
    refund: "Pengembalian Dana",
    // Item workflow statuses (for badge display if needed)
    confirmed: "Dikonfirmasi",
    otw: "Dalam Perjalanan",
    work: "Kerja",
    completed: "Selesai",
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
    // Filter by TRANSACTION status for /dashboard/transactions
    "pending",
    "settlement",
    "capture",
    "cancelled",
    "deny",
    "expire",
    "refund",
];

export default function MitraTransactionDashboard({ transactionItems }) {
    console.log({ transactionItems });
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedItem, setSelectedItem] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        note: "",
    });

    const [isLoading, setIsLoading] = useState(true);
    const SKELETON_COUNT = Math.max(transactionItems?.length || 0, 4);

    useEffect(() => {
        setIsLoading(true);
        const t = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(t);
    }, [transactionItems, statusFilter]);

    const handleConfirm = (id, deliveryFee) => {
        const cleanedFee = deliveryFee
            ?.toString()
            .replace(/\./g, "")
            .replace(/[^0-9]/g, "");

        router.post(
            route("mitra.transactions.confirm", id),
            { deliveryFee: cleanedFee },
            {
                onSuccess: () => {
                    toast.success("Item berhasil dikonfirmasi!");

                    // Otomatis buat tagihan biaya antar untuk pembeli
                    router.post(
                        route("midtrans.delivery_fee.create", id),
                        {},
                        {
                            onSuccess: () => {
                                toast.success(
                                    "Tagihan biaya antar dibuat untuk pembeli."
                                );
                            },
                            onError: (errors) => {
                                console.error(errors);
                                toast.error(
                                    "Gagal membuat tagihan biaya antar."
                                );
                            },
                        }
                    );
                },
                onError: (errors) => {
                    console.error(errors);
                    toast.error("Gagal mengonfirmasi item. Silakan coba lagi.");
                },
            }
        );
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
            data: { note: data.note },
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    "Transaksi dibatalkan dan dana dikreditkan ke dompet pembeli."
                );
                reset("note");
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
        // Filter by parent transaction status (requested)
        return transactionItems.filter(
            (item) => item?.transaction?.status === statusFilter
        );
    }, [transactionItems, statusFilter]);

    // Group by parent transaction status for summary cards
    const groupedTransactions = transactionItems.reduce((acc, item) => {
        const status = item?.transaction?.status || "unknown";
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
                        <div className="space-y-3">
                            {isLoading ? (
                                Array.from({ length: SKELETON_COUNT }).map(
                                    (_, index) => (
                                        <TransactionCardSkeleton key={index} />
                                    )
                                )
                            ) : filteredTransactions.length > 0 ? (
                                filteredTransactions.map((item) => (
                                    <TransactionCard
                                        key={item.id}
                                        item={item}
                                        statusColors={statusColors}
                                        statusTranslations={statusTranslations}
                                        onOpenDetail={handleOpenDetailModal}
                                        onConfirm={handleConfirm}
                                        onOtw={handleOtw}
                                        onProcess={handleProcess}
                                        onCompleted={handleCompleted}
                                        onCancel={handleCancel}
                                        onChat={handleChat}
                                        processing={processing}
                                        note={data.note}
                                        setNote={(v) => setData("note", v)}
                                        errors={errors}
                                    />
                                ))
                            ) : (
                                <div className="text-center text-sm text-muted-foreground py-6">
                                    Tidak ada data transaksi.
                                </div>
                            )}
                        </div>
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
                                            new Date(
                                                selectedItem.rent_days ||
                                                    selectedItem.transaction
                                                        .created_at
                                            ),
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

                            <div>
                                <h4 className="font-semibold text-lg text-gray-700 mb-2">
                                    Informasi Pembeli
                                </h4>
                                <div className="space-y-1 text-sm">
                                    <p>
                                        <span className="text-gray-600 font-semibold">
                                            Nama:
                                        </span>{" "}
                                        {selectedItem.transaction.user?.name}
                                    </p>
                                    <p>
                                        <span className="text-gray-600 font-semibold">
                                            Email:
                                        </span>{" "}
                                        {selectedItem.transaction.user?.email}
                                    </p>
                                    <p>
                                        <span className="text-gray-600 font-semibold">
                                            Order ID:
                                        </span>{" "}
                                        {selectedItem.transaction.order_id}
                                    </p>
                                </div>
                                {selectedItem.transaction.user?.uuid && (
                                    <div className="mt-3">
                                        <Button asChild>
                                            <Link
                                                href={`/dashboard/chat/${selectedItem.transaction.user.uuid}`}
                                            >
                                                Chat dengan{" "}
                                                {
                                                    selectedItem.transaction
                                                        .user.name
                                                }
                                            </Link>
                                        </Button>
                                    </div>
                                )}
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
