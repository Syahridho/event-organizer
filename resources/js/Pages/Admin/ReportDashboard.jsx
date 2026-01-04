import AppLayout from "@/Layouts/App/AppSidebarLayout";
import { Head, router, Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select.jsx";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table.jsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card.jsx";
import {
    MessageCircle,
    Ban,
    CheckCircle,
    MoreVertical,
    Search,
    Filter,
} from "lucide-react";
import { useState } from "react";

const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Admin", href: "/admin/dashboard" },
    { title: "Laporan", href: "/admin/dashboard/report" },
];

const typeOptions = [
    { value: "all", label: "All Types" },
    { value: "event", label: "Event" },
    { value: "service", label: "Service" },
    { value: "building", label: "Building" },
    { value: "property", label: "Property" },
];

const reasonOptions = [
    { value: "all", label: "All Reasons" },
    { value: "fraud", label: "Penipuan atau Scam" },
    { value: "inaccurate", label: "Informasi Tidak Akurat" },
    { value: "duplicate", label: "Iklan Ganda" },
    { value: "inappropriate", label: "Konten Tidak Pantas" },
    { value: "wrong_category", label: "Salah Kategori" },
    { value: "other", label: "Lainnya" },
];

export default function ReportDashboard({ reports, filters }) {
    const [localFilters, setLocalFilters] = useState({
        type: filters.type || "all",
        reason: filters.reason || "all",
        search: filters.search || "",
    });

    const handleFilterChange = (key, value) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        router.get(
            "/admin/dashboard/report",
            {
                type: newFilters.type !== "all" ? newFilters.type : undefined,
                reason:
                    newFilters.reason !== "all" ? newFilters.reason : undefined,
                search: newFilters.search || undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSearch = (e) => {
        e.preventDefault();
        handleFilterChange("search", localFilters.search);
    };

    const handleToggleBan = (report) => {
        if (
            !confirm(
                `Are you sure you want to ${
                    report.reportable.status === "banned" ? "activate" : "ban"
                } this item?`
            )
        ) {
            return;
        }
        router.patch(
            `/admin/dashboard/report/${report.id}/ban`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    // Inertia will re-fetch the page
                },
            }
        );
    };

    const getTypeLabel = (type) => {
        const map = {
            "App\\Models\\Event": "Event",
            "App\\Models\\Service": "Service",
            "App\\Models\\Building": "Building",
            "App\\Models\\RentProperty": "Property",
        };
        return map[type] || type;
    };

    const getStatusBadge = (status) => {
        if (status === "banned") {
            return <Badge variant="destructive">Banned</Badge>;
        }
        return <Badge variant="success">Active</Badge>;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Laporan" />

            <div className="flex-1 space-y-6 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                            Manajemen Laporan
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Tinjau dan kelola laporan pengguna
                        </p>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filter
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Type
                                </label>
                                <Select
                                    value={localFilters.type}
                                    onValueChange={(value) =>
                                        handleFilterChange("type", value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {typeOptions.map((opt) => (
                                            <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                            >
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Reason
                                </label>
                                <Select
                                    value={localFilters.reason}
                                    onValueChange={(value) =>
                                        handleFilterChange("reason", value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select reason" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {reasonOptions.map((opt) => (
                                            <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                            >
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Pencarian
                                </label>
                                <form
                                    onSubmit={handleSearch}
                                    className="flex gap-2"
                                >
                                    <Input
                                        placeholder="Search by item name..."
                                        value={localFilters.search}
                                        onChange={(e) =>
                                            setLocalFilters({
                                                ...localFilters,
                                                search: e.target.value,
                                            })
                                        }
                                        className="flex-1"
                                    />
                                    <Button type="submit" size="icon">
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Reports Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Laporan ({reports.total})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Jenis</TableHead>
                                    <TableHead>Pelapor</TableHead>
                                    <TableHead>Alasan</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reports.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-center py-8 text-muted-foreground"
                                        >
                                            Tidak ada laporan.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reports.data.map((report) => (
                                        <TableRow key={report.id}>
                                            <TableCell className="whitespace-nowrap">
                                                {new Date(
                                                    report.created_at
                                                ).toLocaleDateString("id-ID", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    href={`/${report.reportable_type
                                                        .split("\\")
                                                        .pop()
                                                        .toLowerCase()}s/${
                                                        report.reportable_id
                                                    }`}
                                                    className="font-medium text-primary hover:underline"
                                                    target="_blank"
                                                >
                                                    {report.reportable?.name ||
                                                        "N/A"}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {getTypeLabel(
                                                        report.reportable_type
                                                    )}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {report.user?.name || "Unknown"}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">
                                                    {reasonOptions.find(
                                                        (r) =>
                                                            r.value ===
                                                            report.reason
                                                    )?.label || report.reason}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(
                                                    report.reportable?.status
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            asChild
                                                        >
                                                            <Link
                                                                href={`/chat/${report.user?.uuid}`}
                                                                target="_blank"
                                                                className="cursor-pointer"
                                                            >
                                                                <MessageCircle className="h-4 w-4 mr-2" />
                                                                Chat Pelapor
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            asChild
                                                        >
                                                            <Link
                                                                href={`/chat/${report.reportable?.user?.uuid}`}
                                                                target="_blank"
                                                                className="cursor-pointer"
                                                            >
                                                                <MessageCircle className="h-4 w-4 mr-2" />
                                                                Chat
                                                                Vendor/Owner
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleToggleBan(
                                                                    report
                                                                )
                                                            }
                                                            className={
                                                                report
                                                                    .reportable
                                                                    ?.status ===
                                                                "banned"
                                                                    ? "text-green-600"
                                                                    : "text-red-600"
                                                            }
                                                        >
                                                            {report.reportable
                                                                ?.status ===
                                                            "banned" ? (
                                                                <>
                                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                                    Aktifkan
                                                                    Kembali
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Ban className="h-4 w-4 mr-2" />
                                                                    Banned Item
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600">
                                                            Delete Report
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        {reports.links.length > 3 && (
                            <div className="flex items-center justify-end space-x-2 py-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        router.get(reports.prev_page_url)
                                    }
                                    disabled={!reports.prev_page_url}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        router.get(reports.next_page_url)
                                    }
                                    disabled={!reports.next_page_url}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
