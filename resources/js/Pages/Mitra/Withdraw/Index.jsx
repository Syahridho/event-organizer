import AppLayout from "@/Layouts/App/AppSidebarLayout";
import { Head, usePage, router, useForm } from "@inertiajs/react";
import { useState} from "react";
import moment from "moment";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel,
} from "@/components/ui/select";
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
    { title: "Penarikan Uang", href: "/dashboard/withdraw" },
];

export default function MitraWithdrawDashboard() {
    const { withdrawals, ziggy } = usePage().props;
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showProofModal, setShowProofModal] = useState(false);
    const [withdrawToCancel, setWithdrawToCancel] = useState(null);
    const [proofImage, setProofImage] = useState(null);

    // Ajukan Penarikan - form state
    const [openApplyModal, setOpenApplyModal] = useState(false);
    const [showOtherMethodInput, setShowOtherMethodInput] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        amount: "",
        method: "",
        account_number: "",
        account_holder_name: "",
        other_method: "",
    });

    // Withdrawal methods options
    const withdrawalMethods = [
        {
            group: "E-Wallet",
            options: [
                { value: "dana", label: "Dana" },
                { value: "gopay", label: "Gopay" },
                { value: "ovo", label: "OVO" },
                { value: "shopeepay", label: "ShopeePay" },
            ],
        },
        {
            group: "Bank",
            options: [
                { value: "bca", label: "Bank Central Asia (BCA)" },
                { value: "bri", label: "Bank Rakyat Indonesia (BRI)" },
                { value: "mandiri", label: "Bank Mandiri" },
                { value: "bni", label: "Bank Negara Indonesia (BNI)" },
                { value: "btn", label: "Bank Tabungan Negara (BTN)" },
                { value: "cimb", label: "CIMB Niaga" },
                { value: "danamon", label: "Bank Danamon" },
                { value: "permata", label: "Bank Permata" },
                { value: "bii", label: "Bank Maybank Indonesia" },
                { value: "mega", label: "Bank Mega" },
                { value: "sinarmas", label: "Bank Sinarmas" },
                { value: "muamalat", label: "Bank Muamalat" },
                { value: "dki", label: "Bank DKI" },
                { value: "jatim", label: "Bank Jatim" },
                { value: "jabar", label: "Bank BJB" },
                { value: "sumut", label: "Bank Sumut" },
                { value: "jateng", label: "Bank Jateng" },
                { value: "bpdbali", label: "Bank BPD Bali" },
            ],
        },
        {
            group: "Lainnya",
            options: [
                {
                    value: "lainnya",
                    label: "Lainnya (Misal: Western Union, dll.)",
                },
            ],
        },
    ];

    const handleAmountChange = (e) => {
        const rawValue = e.target.value;
        const numericValue = rawValue.replace(/\./g, "");
        if (!isNaN(numericValue) && numericValue !== "") {
            setData("amount", numericValue);
        } else {
            setData("amount", "");
        }
    };

    const handleMethodChange = (value) => {
        setData("method", value);
        setShowOtherMethodInput(value === "lainnya");
    };

    const handleWithdrawSubmit = (e) => {
        e.preventDefault();

        // Cegah submit jika sedang processing
        if (processing) {
            return;
        }

        if (parseFloat(data.amount || "0") < 10000) {
            toast.error("Jumlah Harus Lebih Dari Rp 10.000.");
            return;
        }
        if (showOtherMethodInput && !data.other_method) {
            toast.error("Nama metode lain-lain harus diisi.");
            return;
        }
        const payload = {
            ...data,
            method: data.method === "lainnya" ? data.other_method : data.method,
        };
        post(route("mitra.withdraw"), {
            data: payload,
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Permintaan penarikan berhasil dikirim!");
                reset();
                setOpenApplyModal(false);
            },
            onError: () => {
                toast.error("Gagal mengirim permintaan. Periksa kembali data.");
            },
        });
    };

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

            {/* Ajukan Penarikan Dana Button */}
            <div className="flex justify-start mt-4 mx-6">
                <Button onClick={() => setOpenApplyModal(true)}>
                    Ajukan Penarikan Dana
                </Button>
            </div>

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

            {/* Modal Ajukan Penarikan Dana */}
            <Dialog open={openApplyModal} onOpenChange={setOpenApplyModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajukan Penarikan Dana</DialogTitle>
                        <DialogDescription>
                            Masukkan jumlah dana dan pilih metode penarikan.
                            Proses akan diverifikasi oleh admin.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleWithdrawSubmit}>
                        <div className="space-y-4 mb-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Jumlah Penarikan</Label>
                                <Input
                                    id="amount"
                                    type="text"
                                    placeholder="Contoh: 50.000"
                                    value={data.amount}
                                    onChange={handleAmountChange}
                                />
                                {errors.amount && (
                                    <p className="text-sm text-red-500">
                                        {errors.amount}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="method">Metode Penarikan</Label>
                                <Select onValueChange={handleMethodChange}>
                                    <SelectTrigger id="method">
                                        <SelectValue placeholder="Pilih metode penarikan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {withdrawalMethods.map((group) => (
                                            <SelectGroup key={group.group}>
                                                <SelectLabel>
                                                    {group.group}
                                                </SelectLabel>
                                                {group.options.map((option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.method && (
                                    <p className="text-sm text-red-500">
                                        {errors.method}
                                    </p>
                                )}
                            </div>
                            {showOtherMethodInput && (
                                <div className="space-y-2">
                                    <Label htmlFor="other_method">
                                        Nama Metode Lainnya
                                    </Label>
                                    <Input
                                        id="other_method"
                                        type="text"
                                        placeholder="Contoh: Western Union"
                                        value={data.other_method}
                                        onChange={(e) =>
                                            setData(
                                                "other_method",
                                                e.target.value
                                            )
                                        }
                                    />
                                    {errors.other_method && (
                                        <p className="text-sm text-red-500">
                                            {errors.other_method}
                                        </p>
                                    )}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="account_holder_name">
                                    Nama Pemilik Rekening / E-Wallet
                                </Label>
                                <Input
                                    id="account_holder_name"
                                    type="text"
                                    placeholder="Masukkan nama pemilik"
                                    value={data.account_holder_name}
                                    onChange={(e) =>
                                        setData(
                                            "account_holder_name",
                                            e.target.value
                                        )
                                    }
                                />
                                {errors.account_holder_name && (
                                    <p className="text-sm text-red-500">
                                        {errors.account_holder_name}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="account_number">
                                    Nomor Rekening / E-Wallet
                                </Label>
                                <Input
                                    id="account_number"
                                    type="text"
                                    placeholder="Masukkan nomor rekening atau nomor telepon"
                                    value={data.account_number}
                                    onChange={(e) =>
                                        setData(
                                            "account_number",
                                            e.target.value
                                        )
                                    }
                                />
                                {errors.account_number && (
                                    <p className="text-sm text-red-500">
                                        {errors.account_number}
                                    </p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpenApplyModal(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    processing ||
                                    !data.amount ||
                                    !data.method ||
                                    !data.account_number ||
                                    !data.account_holder_name ||
                                    (showOtherMethodInput && !data.other_method)
                                }
                            >
                                {processing ? "Memproses..." : "Ajukan"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

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
