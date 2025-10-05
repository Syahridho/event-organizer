"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Edit,
    Trash2,
    Eye,
    ImageIcon,
    MoreHorizontal,
    Search,
    Filter,
    Settings,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import AppLayout from "../../../Layouts/App/AppSidebarLayout";
import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Head, router } from "@inertiajs/react";

const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Cuti Mitra", href: "/leaves" },
];

export default function Index({
    title,
    services,
    buildings = [],
    properties = [],
    leaves = [],
    pagination = {},
}) {
    const ziggy = { url: "" };

    console.log(services);

    const formatPrice = (price) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        }).format(price);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            active: {
                variant: "default",
                label: "Aktif",
                color: "bg-green-100 text-green-800 border-green-300 hover:bg-green-100",
            },
            inactive: {
                variant: "secondary",
                label: "Tidak Aktif",
                color: "bg-red-100 text-red-800 border-red-300 hover:bg-red-100",
            },
            pending: {
                variant: "outline",
                label: "Menunggu",
                color: "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-red-100",
            },
        };

        const config = statusConfig[status] || {
            variant: "secondary",
            label: status,
            color: "bg-gray-100 text-gray-800 border-gray-300",
        };

        return (
            <Badge variant={config.variant} className={config.color}>
                {config.label}
            </Badge>
        );
    };

    const handleEdit = (id) => {
        console.log(`Edit service ${id}`);
        toast.success(`Edit service ${id} - This would navigate to edit page`);
    };

    const handleDelete = (id) => {
        if (confirm("Apakah Anda yakin ingin menghapus layanan ini?")) {
            console.log(`Delete service ${id}`);
            toast.success(`Service ${id} deleted - This would call delete API`);
        }
    };

    const handleView = (id) => {
        console.log(`View service ${id}`);
        toast.success(
            `View service ${id} - This would navigate to detail page`
        );
    };

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedItemType, setSelectedItemType] = useState("all"); // all, service, building, rent_properties
    const [isLoading, setIsLoading] = useState(false);

    const allItems = useMemo(
        () => [
            ...services.map((item) => ({ ...item, item_type: "service" })),
            ...buildings.map((item) => ({ ...item, item_type: "building" })),
            ...properties.map((item) => ({
                ...item,
                item_type: "rent_properties",
            })),
        ],
        [services, buildings, properties]
    );

    const filteredItems = useMemo(() => {
        return allItems.filter((item) => {
            const matchesSearch = item.name
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
            const matchesType =
                selectedItemType === "all" ||
                item.item_type === selectedItemType;
            return matchesSearch && matchesType;
        });
    }, [allItems, searchTerm, selectedItemType]);

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = filteredItems.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    const getLeavesForItem = (itemId, itemType) => {
        return leaves.filter(
            (leave) => leave.item_id === itemId && leave.item_type === itemType
        );
    };

    const getItemTypeLabel = (itemType) => {
        const labels = {
            service: "Layanan",
            building: "Gedung",
            rent_properties: "Properti Sewa",
        };
        return labels[itemType] || itemType;
    };

    const getItemTypeBadge = (itemType) => {
        const configs = {
            service:
                "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100",
            building:
                "bg-green-100 text-green-800 border-green-300 hover:bg-green-100",
            rent_properties:
                "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-100",
        };
        return (
            configs[itemType] ||
            "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-100"
        );
    };

    const handleSearch = useCallback((value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    }, []);

    const handleTypeFilter = useCallback((value) => {
        setSelectedItemType(value);
        setCurrentPage(1);
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Cuti Mitra" />
            <div className="flex flex-1 flex-col mx-6 py-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl text-slate-800 font-bold">
                            {title}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Kelola hari Cuti untuk semua layanan, gedung, dan
                            properti Anda
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                type="text"
                                placeholder="Cari nama layanan..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10 w-full sm:w-64"
                            />
                        </div>
                        <Select
                            value={selectedItemType}
                            onValueChange={handleTypeFilter}
                        >
                            <SelectTrigger className="w-full sm:w-48">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Filter tipe" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tipe</SelectItem>
                                <SelectItem value="service">Layanan</SelectItem>
                                <SelectItem value="building">Gedung</SelectItem>
                                <SelectItem value="rent_properties">
                                    Properti Sewa
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                        <div className="text-2xl font-bold text-blue-600">
                            {services.length}
                        </div>
                        <div className="text-sm text-gray-600">
                            Total Layanan
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-2xl font-bold text-green-600">
                            {buildings.length}
                        </div>
                        <div className="text-sm text-gray-600">
                            Total Gedung
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-2xl font-bold text-purple-600">
                            {properties.length}
                        </div>
                        <div className="text-sm text-gray-600">
                            Total Properti
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-2xl font-bold text-orange-600">
                            {filteredItems.length}
                        </div>
                        <div className="text-sm text-gray-600">
                            Item Ditampilkan
                        </div>
                    </Card>
                </div>

                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {isLoading
                        ? "Memuat data..."
                        : `Menampilkan ${startIndex + 1}-${Math.min(
                              startIndex + itemsPerPage,
                              filteredItems.length
                          )} dari ${filteredItems.length} item`}
                </div>

                {/* Mobile View - Card Layout */}
                <div className="block lg:hidden space-y-4">
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-500">Memuat data...</p>
                        </div>
                    ) : paginatedItems.length > 0 ? (
                        paginatedItems.map((item) => (
                            <Card
                                key={`${item.item_type}-${item.id}`}
                                className="p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0">
                                        {item.thumbnail ? (
                                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                                                <img
                                                    src={`${ziggy.url}/storage/thumbnails/${item.thumbnail}`}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display =
                                                            "none";
                                                        e.target.nextSibling.style.display =
                                                            "flex";
                                                    }}
                                                />
                                                <div className="w-full h-full bg-gray-200 items-center justify-center hidden">
                                                    <ImageIcon className="w-8 h-8 text-gray-400" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                                <ImageIcon className="w-8 h-8 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-lg truncate">
                                                {item.name}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge
                                                className={getItemTypeBadge(
                                                    item.item_type
                                                )}
                                            >
                                                {getItemTypeLabel(
                                                    item.item_type
                                                )}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-2">
                                            {item.location}
                                        </p>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="text-lg font-bold text-green-600">
                                                {formatPrice(item.price)}
                                            </div>
                                            {getStatusBadge(item.status)}
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                            <span>
                                                {formatDate(item.created_at)}
                                            </span>
                                        </div>
                                        <Button
                                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors duration-200 w-full"
                                            onClick={() =>
                                                router.visit(
                                                    `/dashboard/leaves/${item.id}?type=${item.item_type}`
                                                )
                                            }
                                        >
                                            <Settings className="w-4 h-4" />
                                            <span>Kelola Hari Cuti</span>
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <Card className="p-8 text-center">
                            <div className="text-gray-500">
                                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-medium mb-2">
                                    Tidak ada item yang ditemukan
                                </h3>
                                <p className="text-sm">
                                    Coba ubah kata kunci pencarian atau filter
                                    yang digunakan
                                </p>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Desktop View - Table Layout */}
                <div className="hidden lg:block">
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="w-[100px] ps-4">
                                        Gambar
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        Nama
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        Tipe
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        Lokasi
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        Harga
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        Status
                                    </TableHead>
                                    <TableHead className="font-semibold text-center">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="h-24 text-center"
                                        >
                                            <div className="flex items-center justify-center">
                                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                                                Memuat data...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedItems.length > 0 ? (
                                    paginatedItems.map((item) => (
                                        <TableRow
                                            key={`${item.item_type}-${item.id}`}
                                            className="hover:bg-gray-50"
                                        >
                                            <TableCell className="ps-4">
                                                {item.thumbnail ? (
                                                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                                                        <img
                                                            src={`${ziggy.url}/storage/thumbnails/${item.thumbnail}`}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.style.display =
                                                                    "none";
                                                                e.target.nextSibling.style.display =
                                                                    "flex";
                                                            }}
                                                        />
                                                        <div className="w-full h-full bg-gray-200 items-center justify-center hidden">
                                                            <ImageIcon className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                                        <ImageIcon className="w-6 h-6 text-gray-400" />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {item.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={getItemTypeBadge(
                                                        item.item_type
                                                    )}
                                                >
                                                    {getItemTypeLabel(
                                                        item.item_type
                                                    )}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate">
                                                {item.location}
                                            </TableCell>
                                            <TableCell className="font-medium text-green-600">
                                                {formatPrice(item.price)}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(item.status)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors duration-200"
                                                    onClick={() =>
                                                        router.visit(
                                                            `/dashboard/leaves/${item.id}?type=${item.item_type}`
                                                        )
                                                    }
                                                >
                                                    <Settings className="w-4 h-4" />
                                                    <span className="hidden sm:inline">
                                                        Kelola Hari Cuti
                                                    </span>
                                                    <span className="sm:hidden">
                                                        Cuti
                                                    </span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="h-32 text-center"
                                        >
                                            <div className="text-gray-500">
                                                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                                <h3 className="text-lg font-medium mb-2">
                                                    Tidak ada item yang
                                                    ditemukan
                                                </h3>
                                                <p className="text-sm">
                                                    Coba ubah kata kunci
                                                    pencarian atau filter yang
                                                    digunakan
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </div>

                {totalPages > 1 && !isLoading && (
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Halaman {currentPage} dari {totalPages} • Total{" "}
                                {filteredItems.length} item
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.max(1, prev - 1)
                                        )
                                    }
                                    disabled={currentPage === 1}
                                >
                                    Sebelumnya
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from(
                                        { length: Math.min(5, totalPages) },
                                        (_, i) => {
                                            const page = i + 1;
                                            return (
                                                <Button
                                                    key={page}
                                                    variant={
                                                        currentPage === page
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        setCurrentPage(page)
                                                    }
                                                    className="w-8 h-8 p-0"
                                                >
                                                    {page}
                                                </Button>
                                            );
                                        }
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.min(totalPages, prev + 1)
                                        )
                                    }
                                    disabled={currentPage === totalPages}
                                >
                                    Selanjutnya
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
