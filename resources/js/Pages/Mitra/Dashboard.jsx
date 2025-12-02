import { Head, useForm, router, Link } from "@inertiajs/react";
import AppLayout from "@/Layouts/App/AppSidebarLayout";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card.jsx";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table.jsx";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Button } from "@/components/ui/button.jsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel,
} from "@/components/ui/select.jsx";
import { CheckCircle, Package, MinusCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { formatRupiah, formatRupiahInput } from "@/Utils/formatRupiah.jsx";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import React from "react";

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
                <p className="text-sm font-semibold text-slate-700 mb-1">
                    {label}
                </p>
                <p className="text-sm text-slate-600">
                    Pendapatan:{" "}
                    <span className="font-bold text-primary">
                        Rp {payload[0].value.toLocaleString("id-ID")}
                    </span>
                </p>
            </div>
        );
    }
    return null;
};

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
    completed: "bg-green-100 text-green-800",
    cancel: "bg-red-100 text-red-800",
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
            { value: "lainnya", label: "Lainnya (Misal: Western Union, dll.)" },
        ],
    },
];

export default function UserDashboard({
    totalRevenue,
    percentageChange,
    completedTransactionsCount,
    transactionChange,
    totalItems,
    itemCounts,
    transactionItems,
    chartData,
    currentChartFilter = "week",
}) {
    const handleChartFilterChange = (value) => {
        router.get(
            route("mitra.dashboard"),
            { chart_filter: value },
            {
                preserveState: true,
                preserveScroll: true,
                only: ["chartData", "currentChartFilter"],
            }
        );
    };

    const getChartTitle = () => {
        switch (currentChartFilter) {
            case "month":
                return "Pendapatan 30 Hari Terakhir";
            case "3_months":
                return "Pendapatan 3 Bulan Terakhir";
            case "year":
                return "Pendapatan Tahun Ini";
            default:
                return "Pendapatan 7 Hari Terakhir";
        }
    };
    const { data, setData, post, processing, errors, reset } = useForm({
        amount: "",
        method: "",
        account_number: "",
        account_holder_name: "",
        other_method: "", // <-- Kolom baru untuk metode lain-lain
    });

    const [openDialog, setOpenDialog] = useState(false);

    // State baru untuk mengontrol visibilitas input "Lainnya"
    const [showOtherMethodInput, setShowOtherMethodInput] = useState(false);

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
        // Atur state visibilitas berdasarkan pilihan
        setShowOtherMethodInput(value === "lainnya");
    };

    const handleWithdraw = (e) => {
        e.preventDefault();

        // Cegah submit jika sedang processing
        if (processing) {
            return;
        }

        if (parseFloat(data.amount) > totalRevenue) {
            toast.error(
                "Jumlah penarikan tidak boleh melebihi total pendapatan."
            );
            return;
        } else if (parseFloat(data.amount) < 10000) {
            toast.error("Jumlah Harus Lebih Dari Rp 10.000.");
            return;
        }

        // Perbaikan: Validasi kondisional
        if (showOtherMethodInput && !data.other_method) {
            toast.error("Nama metode lain-lain harus diisi.");
            return;
        } else if (
            !data.method ||
            !data.account_number ||
            !data.account_holder_name
        ) {
            toast.error("Semua field harus diisi.");
            return;
        }

        // Tambahkan data other_method ke payload jika diperlukan
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
                setOpenDialog(false);
            },
            onError: (formErrors) => {
                toast.error("Gagal mengirim permintaan. Periksa kembali data.");
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Mitra" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Pendapatan
                            </CardTitle>
                            <AlertDialog
                                open={openDialog}
                                onOpenChange={setOpenDialog}
                            >
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:bg-muted"
                                    >
                                        <MinusCircle className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            Ajukan Penarikan Dana
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Masukkan jumlah dana dan pilih
                                            metode penarikan. Proses penarikan
                                            akan diverifikasi oleh admin.
                                            <p className="font-bold text-red-500">
                                                Saldo anda Rp.
                                                {formatRupiah(
                                                    totalRevenue ?? 0
                                                )}
                                                .00
                                            </p>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <form onSubmit={handleWithdraw}>
                                        <div className="space-y-4 mb-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="amount">
                                                    Jumlah Penarikan
                                                </Label>
                                                <Input
                                                    id="amount"
                                                    type="text"
                                                    placeholder="Contoh: 50.000"
                                                    value={formatRupiahInput(
                                                        data.amount
                                                    )}
                                                    onChange={
                                                        handleAmountChange
                                                    }
                                                />
                                                {errors.amount && (
                                                    <p className="text-sm text-red-500">
                                                        {errors.amount}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="method">
                                                    Metode Penarikan
                                                </Label>
                                                <Select
                                                    onValueChange={
                                                        handleMethodChange
                                                    }
                                                >
                                                    <SelectTrigger id="method">
                                                        <SelectValue placeholder="Pilih metode penarikan" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {withdrawalMethods.map(
                                                            (group) => (
                                                                <SelectGroup
                                                                    key={
                                                                        group.group
                                                                    }
                                                                >
                                                                    <SelectLabel>
                                                                        {
                                                                            group.group
                                                                        }
                                                                    </SelectLabel>
                                                                    {group.options.map(
                                                                        (
                                                                            option
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    option.value
                                                                                }
                                                                                value={
                                                                                    option.value
                                                                                }
                                                                            >
                                                                                {
                                                                                    option.label
                                                                                }
                                                                            </SelectItem>
                                                                        )
                                                                    )}
                                                                </SelectGroup>
                                                            )
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                {errors.method && (
                                                    <p className="text-sm text-red-500">
                                                        {errors.method}
                                                    </p>
                                                )}
                                            </div>
                                            {/* Logika kondisional untuk input "Lainnya" */}
                                            {showOtherMethodInput && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="other_method">
                                                        Nama Metode Lainnya
                                                    </Label>
                                                    <Input
                                                        id="other_method"
                                                        type="text"
                                                        placeholder="Contoh: Western Union"
                                                        value={
                                                            data.other_method
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                "other_method",
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                    {errors.other_method && (
                                                        <p className="text-sm text-red-500">
                                                            {
                                                                errors.other_method
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <Label htmlFor="account_holder_name">
                                                    Nama Pemilik Rekening /
                                                    E-Wallet
                                                </Label>
                                                <Input
                                                    id="account_holder_name"
                                                    type="text"
                                                    placeholder="Masukkan nama pemilik"
                                                    value={
                                                        data.account_holder_name
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            "account_holder_name",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                                {errors.account_holder_name && (
                                                    <p className="text-sm text-red-500">
                                                        {
                                                            errors.account_holder_name
                                                        }
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
                                        <AlertDialogFooter>
                                            <AlertDialogCancel asChild>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                >
                                                    Batal
                                                </Button>
                                            </AlertDialogCancel>
                                            <Button
                                                type="submit"
                                                disabled={
                                                    processing ||
                                                    !data.amount ||
                                                    !data.method ||
                                                    !data.account_number ||
                                                    !data.account_holder_name ||
                                                    (showOtherMethodInput &&
                                                        !data.other_method)
                                                }
                                            >
                                                {processing
                                                    ? "Memproses..."
                                                    : "Ajukan"}
                                            </Button>
                                        </AlertDialogFooter>
                                    </form>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                <span className="text-lg">Rp</span>{" "}
                                {formatRupiah(totalRevenue)}.00
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {percentageChange > 0
                                    ? `+${percentageChange}% dari bulan lalu`
                                    : "Tidak Ada Penambahan"}
                            </p>
                        </CardContent>
                        <div className="mt-2">
                            <Button variant="secondary" size="sm" asChild>
                                <a href="/dashboard/withdraw">
                                    Lihat Riwayat Penarikan
                                </a>
                            </Button>
                        </div>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Transaksi Selesai
                            </CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {completedTransactionsCount.toLocaleString(
                                    "id-ID"
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {transactionChange > 0
                                    ? `+${transactionChange} transaksi`
                                    : "Tidak Ada Transaksi"}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Item Dibuat
                            </CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {totalItems.toLocaleString("id-ID")}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {itemCounts.event || 0} event,{" "}
                                {itemCounts.service || 0} jasa,{" "}
                                {itemCounts.building || 0} gedung,{" "}
                                {itemCounts.rent_property || 0} properti
                            </p>
                        </CardContent>
                    </Card>
                </div>
                {/* Chart Pendapatan 7 Hari (shadcn Card + simple bars) */}
                {/* Chart Pendapatan (Recharts) */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl sm:text-2xl font-bold">
                                    {getChartTitle()}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Trend pendapatan Anda
                                </CardDescription>
                            </div>
                            <div className="w-[180px]">
                                <Select
                                    value={currentChartFilter}
                                    onValueChange={handleChartFilterChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Periode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="week">7 Hari Terakhir</SelectItem>
                                        <SelectItem value="month">30 Hari Terakhir</SelectItem>
                                        <SelectItem value="3_months">3 Bulan Terakhir</SelectItem>
                                        <SelectItem value="year">Tahun Ini</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{
                                        top: 10,
                                        right: 10,
                                        left: 0,
                                        bottom: 0,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="colorGradient"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="#3b82f6"
                                                stopOpacity={1}
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="#60a5fa"
                                                stopOpacity={0.8}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#e2e8f0"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="day"
                                        tick={{
                                            fill: "#64748b",
                                            fontSize: 12,
                                        }}
                                        axisLine={{ stroke: "#cbd5e1" }}
                                    />
                                    <YAxis
                                        tick={{
                                            fill: "#64748b",
                                            fontSize: 12,
                                        }}
                                        axisLine={{ stroke: "#cbd5e1" }}
                                        tickFormatter={(value) =>
                                            `${(Number(value) / 1000).toFixed(
                                                0
                                            )}k`
                                        }
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar
                                        dataKey="sales"
                                        fill="url(#colorGradient)"
                                        radius={[8, 8, 0, 0]}
                                        animationDuration={800}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        {(!chartData || chartData.length === 0 || !chartData.some(d => d.sales > 0)) && (
                             <p className="text-xs text-slate-500 text-center mt-4">
                                Belum ada data pendapatan untuk ditampilkan.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <CardHeader>
                        <CardTitle>Daftar Transaksi Terbaru</CardTitle>
                        <CardDescription>
                            Riwayat semua transaksi terbaru Anda.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produk</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                        Jumlah
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactionItems.data.length > 0 ? (
                                    transactionItems.data.map((item) => {
                                        const statusColorClass =
                                            statusColors[item.status] ||
                                            "bg-gray-100 text-gray-800";

                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {item.item.name}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {item.item_type}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {format(
                                                        new Date(
                                                            item.created_at
                                                        ),
                                                        "EEEE, dd MMMM yyyy",
                                                        { locale: id }
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                            item.transaction
                                                                .status ===
                                                            "cancelled"
                                                                ? "bg-red-100 text-red-800"
                                                                : statusColorClass
                                                        }`}
                                                    >
                                                        {item.transaction
                                                            .status ===
                                                        "cancelled"
                                                            ? "Dibatalkan Pembeli"
                                                            : item.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    Rp{" "}
                                                    {formatRupiah(item.price)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="h-24 text-center text-muted-foreground"
                                        >
                                            Tidak ada transaksi yang ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                         {/* Pagination Controls */}
                         <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Menampilkan {transactionItems.from} sampai {transactionItems.to} dari {transactionItems.total} hasil
                            </div>
                            <div className="flex gap-2">
                                {transactionItems.links.map((link, i) => (
                                    <Button
                                        key={i}
                                        variant={link.active ? "default" : "outline"}
                                        size="sm"
                                        asChild
                                        disabled={!link.url}
                                    >
                                        {link.url ? (
                                            <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                                        ) : (
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </div>
            </div>
        </AppLayout>
    );
}
