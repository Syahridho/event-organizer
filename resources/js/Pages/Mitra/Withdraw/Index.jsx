// resources/js/Pages/Mitra/WithdrawDashboard.jsx

import AppLayout from "@/Layouts/App/AppSidebarLayout";
import { Head, usePage, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import moment from "moment";
import { toast, Toaster } from "sonner";
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
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/Components/ui/dialog";
import { HiEye } from "react-icons/hi"; // Impor icon mata

const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Penarikan Uang", href: "/mitra/withdraw" },
];

export default function MitraWithdrawDashboard() {
    const { withdrawals, ziggy } = usePage().props;
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showProofModal, setShowProofModal] = useState(false);
    const [withdrawToCancel, setWithdrawToCancel] = useState(null);
    const [proofImage, setProofImage] = useState(null);

    // ... (useEffect for flash messages remains the same)

    const handleOpenCancelModal = (withdraw) => {
        setWithdrawToCancel(withdraw);
        setShowCancelModal(true);
    };

    const handleOpenProofModal = (proofUrl) => {
        setProofImage(proofUrl);
        setShowProofModal(true);
    };

    const handleCancel = () => {
        if (!withdrawToCancel) return;

        router.post(
            route("mitra.withdraw.cancel", withdrawToCancel.id),
            {},
            {
                onSuccess: () => {
                    setShowCancelModal(false);
                },
                onError: (errors) => {
                    setShowCancelModal(false);
                    console.error(errors);
                    toast.error("Gagal membatalkan permintaan.");
                },
            }
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mitra Withdraw" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Riwayat Penarikan</CardTitle>
                        <CardDescription>
                            Riwayat penarikan dana Anda.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {withdrawals.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Jumlah</TableHead>
                                        <TableHead>Metode</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {withdrawals.map((withdraw) => (
                                        <TableRow key={withdraw.id}>
                                            <TableCell>
                                                Rp
                                                {Number(
                                                    withdraw.amount
                                                ).toLocaleString("id-ID")}
                                            </TableCell>
                                            <TableCell>
                                                {withdraw.method}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`py-1 px-3 rounded-full text-xs font-semibold ${
                                                        withdraw.status ===
                                                        "pending"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : withdraw.status ===
                                                              "completed"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                    }`}
                                                >
                                                    {withdraw.status}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {moment(
                                                    withdraw.created_at
                                                ).format("DD MMMM YYYY")}
                                            </TableCell>
                                            <TableCell>
                                                {/* Logika untuk menampilkan tombol aksi */}
                                                {withdraw.status ===
                                                    "pending" && (
                                                    <Button
                                                        onClick={() =>
                                                            handleOpenCancelModal(
                                                                withdraw
                                                            )
                                                        }
                                                        variant="destructive"
                                                        size="sm"
                                                    >
                                                        Batalkan
                                                    </Button>
                                                )}
                                                {withdraw.status ===
                                                    "completed" && (
                                                    <Button
                                                        onClick={() =>
                                                            handleOpenProofModal(
                                                                withdraw.proof
                                                            )
                                                        }
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                    >
                                                        <HiEye className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-center text-gray-500">
                                Tidak ada riwayat penarikan.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modal Konfirmasi Pembatalan */}
            <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Pembatalan</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin membatalkan permintaan
                            penarikan ini?
                        </DialogDescription>
                    </DialogHeader>
                    {withdrawToCancel && (
                        <p className="text-sm text-gray-600">
                            Jumlah:{" "}
                            <span className="font-semibold">
                                Rp
                                {Number(withdrawToCancel.amount).toLocaleString(
                                    "id-ID"
                                )}
                            </span>
                        </p>
                    )}
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setShowCancelModal(false)}
                        >
                            Tidak, Kembali
                        </Button>
                        <Button variant="destructive" onClick={handleCancel}>
                            Ya, Batalkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Tampilan Bukti Transfer */}
            <Dialog open={showProofModal} onOpenChange={setShowProofModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bukti Transfer</DialogTitle>
                    </DialogHeader>
                    {proofImage ? (
                        <div className="flex justify-center">
                            <img
                                src={`${ziggy.url}/storage/${proofImage}`}
                                alt="Bukti Transfer"
                                className="max-w-full h-auto rounded-md"
                            />
                        </div>
                    ) : (
                        <p className="text-center text-gray-500">
                            Bukti transfer tidak tersedia.
                        </p>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setShowProofModal(false)}>
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
