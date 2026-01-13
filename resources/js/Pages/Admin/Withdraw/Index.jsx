// resources/js/Pages/Admin/Withdraw.jsx

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
} from "@/Components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/Components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Eye } from "lucide-react";

const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Penarikan", href: "/admin/withdraw" },
];

export default function AdminWithdraw() {
    const { withdrawals, filters, ziggy } = usePage().props;

    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({ withdrawal: null, type: "" });
    const [proof, setProof] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // New state for the image view modal
    const [showImageModal, setShowImageModal] = useState(false);
    const [imageProofUrl, setImageProofUrl] = useState(null);

    const handleAccept = (withdrawal) => {
        setModalData({ withdrawal, type: "accept" });
        setShowModal(true);
    };

    const handleReject = (withdrawal) => {
        setModalData({ withdrawal, type: "reject" });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalData({ withdrawal: null, type: "" });
        setProof(null);
        setPreviewUrl(null);
    };

    // New function to handle showing the image modal
    const handleViewProof = (proofUrl) => {
        setImageProofUrl(proofUrl);
        setShowImageModal(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setProof(file);
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl(null);
        }
    };

    const handleFilterChange = (value) => {
        router.get(
            route("admin.withdraw.index"),
            { status: value },
            {
                replace: true,
                preserveState: true,
            }
        );
    };

    const handleSubmit = () => {
        if (modalData.type === "accept" && !proof) {
            toast.error("Bukti transfer wajib diunggah.");
            return;
        }

        if (!modalData.withdrawal) return;

        // Use FormData to send the file correctly
        const formData = new FormData();
        if (modalData.type === "accept") {
            formData.append("proof", proof);
            router.post(
                `/admin/withdraw/${modalData.withdrawal.id}/complete`,
                formData,
                {
                    onSuccess: () => {
                        closeModal();
                    },
                    onError: (errors) => {
                        console.error(errors);
                    },
                    forceFormData: true, // Important for file uploads with Inertia
                }
            );
        } else {
            router.post(
                `/admin/withdraw/${modalData.withdrawal.id}/reject`,
                {},
                {
                    onSuccess: () => {
                        closeModal();
                    },
                    onError: (errors) => {
                        console.error(errors);
                    },
                }
            );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Withdraw" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold text-gray-800">
                        Daftar Permintaan Penarikan
                    </h1>
                    <Select
                        onValueChange={handleFilterChange}
                        defaultValue={filters.status}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Pilih Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Selesai</SelectItem>
                            <SelectItem value="rejected">Ditolak</SelectItem>
                            <SelectItem value="all">Semua</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {withdrawals.length > 0 ? (
                    <div className="overflow-x-auto bg-white rounded-lg shadow-md p-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID Penarikan</TableHead>
                                    <TableHead>Pengguna</TableHead>
                                    <TableHead>Jumlah</TableHead>
                                    <TableHead>Metode</TableHead>
                                    <TableHead>Nomor Rekening</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {withdrawals.map((withdraw) => (
                                    <TableRow key={withdraw.id}>
                                        <TableCell>{withdraw.id}</TableCell>
                                        <TableCell>
                                            {withdraw.user.name}
                                        </TableCell>
                                        <TableCell>
                                            Rp
                                            {Number(
                                                withdraw.amount
                                            ).toLocaleString("id-ID")}
                                        </TableCell>
                                        <TableCell>{withdraw.method}</TableCell>
                                        <TableCell>
                                            {withdraw.account_number}
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
                                            {moment(withdraw.created_at).format(
                                                "DD MMMM YYYY"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {withdraw.status === "pending" && (
                                                <div className="flex space-x-2">
                                                    <Button
                                                        onClick={() =>
                                                            handleAccept(
                                                                withdraw
                                                            )
                                                        }
                                                        size="sm"
                                                        className="bg-green-500 hover:bg-green-700 text-white"
                                                    >
                                                        Setujui
                                                    </Button>
                                                    <Button
                                                        onClick={() =>
                                                            handleReject(
                                                                withdraw
                                                            )
                                                        }
                                                        size="sm"
                                                        className="bg-red-500 hover:bg-red-700 text-white"
                                                    >
                                                        Tolak
                                                    </Button>
                                                </div>
                                            )}
                                            {/* New "view" button for completed withdrawals */}
                                            {withdraw.status ===
                                                "completed" && (
                                                <div className="flex space-x-2">
                                                    <Button
                                                        onClick={() =>
                                                            handleViewProof(
                                                                withdraw.proof
                                                            )
                                                        }
                                                        size="sm"
                                                        className="bg-blue-500 hover:bg-blue-700 text-white"
                                                    >
                                                        <Eye size={16} />
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <p className="text-center text-gray-500">
                        Tidak ada permintaan penarikan yang menunggu.
                    </p>
                )}
            </div>

            {/* Existing Accept/Reject Dialog */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {modalData.type === "accept"
                                ? "Setujui Penarikan"
                                : "Tolak Penarikan"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <p className="text-sm text-gray-700">
                            {modalData.type === "accept"
                                ? "Apakah Anda yakin ingin menyetujui permintaan penarikan ini? Silakan unggah bukti transfer."
                                : "Apakah Anda yakin ingin menolak permintaan penarikan ini?"}
                        </p>
                        {modalData.type === "accept" && (
                            <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="proof">Bukti Transfer</Label>
                                <Input
                                    id="proof"
                                    type="file"
                                    onChange={handleFileChange}
                                    required
                                />
                                {previewUrl && (
                                    <div className="mt-2">
                                        <img
                                            src={previewUrl}
                                            alt="Bukti Transfer"
                                            className="max-w-full h-auto rounded-md"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={closeModal}>
                            Batal
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className={`${
                                modalData.type === "accept"
                                    ? "bg-green-500 hover:bg-green-700"
                                    : "bg-red-500 hover:bg-red-700"
                            } text-white`}
                            disabled={modalData.type === "accept" && !proof}
                        >
                            Konfirmasi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* New Dialog to view the proof image */}
            <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Bukti Transfer</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        {imageProofUrl ? (
                            <img
                                src={`${ziggy.url}/storage/${imageProofUrl}`}
                                alt="Bukti Transfer"
                                className="max-w-full h-auto rounded-md"
                            />
                        ) : (
                            <p className="text-center text-gray-500">
                                Bukti transfer tidak ditemukan.
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setShowImageModal(false)}
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
