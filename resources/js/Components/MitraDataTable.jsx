import * as React from "react";
import { ArrowUpDown, ChevronDown, Eye, Filter } from "lucide-react";
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/Components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/Lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { router } from "@inertiajs/react";

const getStatusBadge = (status) => {
    const baseClasses = "capitalize min-w-[70px] justify-center text-xs";
    switch (status) {
        case "approved":
            return (
                <Badge
                    className={cn(
                        baseClasses,
                        "bg-green-600 hover:bg-green-700"
                    )}
                >
                    Disetujui
                </Badge>
            );
        case "rejected":
            return (
                <Badge
                    className={cn(baseClasses, "bg-red-600 hover:bg-red-700")}
                >
                    Ditolak
                </Badge>
            );
        case "pending":
        default:
            return (
                <Badge
                    className={cn(
                        baseClasses,
                        "bg-yellow-600 hover:bg-yellow-700"
                    )}
                >
                    Pending
                </Badge>
            );
    }
};

export function MitraDataTable({ data }) {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [selectedMitra, setSelectedMitra] = React.useState(null);
    const [pdfType, setPdfType] = React.useState("npwp");
    const [alertConfig, setAlertConfig] = React.useState({
        open: false,
        type: null,
        mitra: null,
    });
    const [statusFilter, setStatusFilter] = React.useState("all");

    const handleViewDetail = (mitra) => {
        setSelectedMitra(mitra);
        setPdfType("npwp");
        setIsModalOpen(true);
    };

    const openApproveDialog = (mitra) => {
        setAlertConfig({ open: true, type: "approve", mitra });
    };

    const openRejectDialog = (mitra) => {
        setAlertConfig({ open: true, type: "reject", mitra });
    };

    const handleConfirmAction = () => {
        const { type, mitra } = alertConfig;

        if (type === "approve") {
            router.post(
                route("admin.partners.approve", mitra.id),
                {},
                {
                    onSuccess: () => {
                        setIsModalOpen(false);
                        setAlertConfig({
                            open: false,
                            type: null,
                            mitra: null,
                        });
                    },
                }
            );
        } else if (type === "reject") {
            router.post(
                route("admin.partners.reject", mitra.id),
                {},
                {
                    onSuccess: () => {
                        setIsModalOpen(false);
                        setAlertConfig({
                            open: false,
                            type: null,
                            mitra: null,
                        });
                    },
                }
            );
        }
    };

    const columns = [
        {
            accessorFn: (row) => row.user.name,
            id: "userName",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                    className="h-8 px-2 text-xs"
                >
                    Nama Mitra
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="font-medium text-sm whitespace-nowrap">
                    {row.original.user.name}
                </div>
            ),
        },
        {
            accessorFn: (row) => row.user.email,
            id: "userEmail",
            header: "Email",
            cell: ({ row }) => (
                <div className="text-xs truncate max-w-[150px]">
                    {row.original.user.email}
                </div>
            ),
        },
        {
            accessorKey: "npwp_number",
            header: "NPWP",
            cell: ({ row }) => (
                <div className="font-mono text-xs whitespace-nowrap">
                    {row.getValue("npwp_number")}
                </div>
            ),
        },
        {
            accessorKey: "address",
            header: "Alamat",
            cell: ({ row }) => (
                <div className="max-w-[150px] lg:max-w-[200px] truncate text-xs">
                    {row.getValue("address")}
                </div>
            ),
            enableSorting: false,
        },
        {
            accessorKey: "status",
            header: ({ column }) => (
                <div className="flex justify-center">
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                        className="h-8 px-2 text-xs"
                    >
                        Status
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                </div>
            ),
            cell: ({ row }) => (
                <div className="flex justify-center">
                    {getStatusBadge(row.getValue("status"))}
                </div>
            ),
        },
        {
            id: "actions",
            header: () => <div className="text-center text-xs">Aksi</div>,
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetail(row.original)}
                        className="h-8 px-2 text-xs"
                    >
                        <Eye className="h-3 w-3 mr-1" />
                        Detail
                    </Button>
                </div>
            ),
        },
    ];

    const [sorting, setSorting] = React.useState([]);
    const [columnFilters, setColumnFilters] = React.useState([]);
    const [columnVisibility, setColumnVisibility] = React.useState({});
    const [globalFilter, setGlobalFilter] = React.useState("");

    const filteredData = React.useMemo(() => {
        if (statusFilter === "all") return data;
        return data.filter((item) => item.status === statusFilter);
    }, [data, statusFilter]);

    const table = useReactTable({
        data: filteredData,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        globalFilterFn: "includesString",
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            globalFilter,
        },
    });

    const statusCounts = React.useMemo(() => {
        return {
            all: data.length,
            pending: data.filter((m) => m.status === "pending").length,
            approved: data.filter((m) => m.status === "approved").length,
            rejected: data.filter((m) => m.status === "rejected").length,
        };
    }, [data]);

    return (
        <div className="w-full space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                <Input
                    placeholder="Cari nama atau email..."
                    value={globalFilter ?? ""}
                    onChange={(event) => setGlobalFilter(event.target.value)}
                    className="w-full text-sm"
                />

                <div className="flex gap-2 w-full lg:w-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 lg:flex-none text-xs"
                            >
                                Tampilkan Kolom
                                <ChevronDown className="ml-2 h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize text-xs"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 lg:flex-none"
                            >
                                <Filter className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="text-xs">
                                Filter Status
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <DropdownMenuRadioItem
                                    value="all"
                                    className="text-xs"
                                >
                                    Semua ({statusCounts.all})
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem
                                    value="pending"
                                    className="text-xs"
                                >
                                    Pending ({statusCounts.pending})
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem
                                    value="approved"
                                    className="text-xs"
                                >
                                    Disetujui ({statusCounts.approved})
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem
                                    value="rejected"
                                    className="text-xs"
                                >
                                    Ditolak ({statusCounts.rejected})
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Table - Responsive */}
            <div className="rounded-md border">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            className="whitespace-nowrap"
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext()
                                                  )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell
                                                key={cell.id}
                                                className="py-2"
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center text-sm"
                                    >
                                        Tidak ada data yang ditemukan.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Modal Detail */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base md:text-lg">
                            Detail Pengajuan Mitra
                        </DialogTitle>
                    </DialogHeader>

                    {selectedMitra && (
                        <div className="space-y-4 md:space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-xs text-gray-500">
                                        Nama
                                    </p>
                                    <p className="font-medium text-sm">
                                        {selectedMitra.user.name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">
                                        Email
                                    </p>
                                    <p className="font-medium text-sm break-all">
                                        {selectedMitra.user.email}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">
                                        NPWP
                                    </p>
                                    <p className="font-mono text-sm">
                                        {selectedMitra.npwp_number}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">
                                        Status
                                    </p>
                                    <div className="mt-1">
                                        {getStatusBadge(selectedMitra.status)}
                                    </div>
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <p className="text-xs text-gray-500">
                                        Alamat
                                    </p>
                                    <p className="font-medium text-sm">
                                        {selectedMitra.address}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs md:text-sm font-medium mb-2 block">
                                    Pilih Dokumen
                                </label>
                                <Select
                                    value={pdfType}
                                    onValueChange={setPdfType}
                                >
                                    <SelectTrigger className="text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem
                                            value="npwp"
                                            className="text-sm"
                                        >
                                            NPWP
                                        </SelectItem>
                                        <SelectItem
                                            value="business"
                                            className="text-sm"
                                        >
                                            Dokumen Usaha
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <iframe
                                    src={route("admin.partners.view-pdf", {
                                        mitra: selectedMitra.id,
                                        type: pdfType,
                                    })}
                                    className="w-full h-[300px] md:h-[500px]"
                                    title={
                                        pdfType === "npwp"
                                            ? "NPWP"
                                            : "Dokumen Usaha"
                                    }
                                />
                            </div>

                            {selectedMitra.status === "pending" && (
                                <div className="flex flex-col sm:flex-row justify-end gap-2 md:gap-3 pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsModalOpen(false)}
                                        className="w-full sm:w-auto text-sm"
                                        size="sm"
                                    >
                                        Tutup
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() =>
                                            openRejectDialog(selectedMitra)
                                        }
                                        className="w-full sm:w-auto text-sm"
                                        size="sm"
                                    >
                                        Tolak
                                    </Button>
                                    <Button
                                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-sm"
                                        onClick={() =>
                                            openApproveDialog(selectedMitra)
                                        }
                                        size="sm"
                                    >
                                        Setujui
                                    </Button>
                                </div>
                            )}

                            {selectedMitra.status !== "pending" && (
                                <div className="flex justify-end pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsModalOpen(false)}
                                        size="sm"
                                        className="text-sm"
                                    >
                                        Tutup
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Alert Dialog */}
            <AlertDialog
                open={alertConfig.open}
                onOpenChange={(open) =>
                    setAlertConfig({ ...alertConfig, open })
                }
            >
                <AlertDialogContent className="max-w-[90vw] md:max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base md:text-lg">
                            {alertConfig.type === "approve"
                                ? "Setujui Pengajuan Mitra?"
                                : "Tolak Pengajuan Mitra?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                            {alertConfig.type === "approve"
                                ? `Apakah Anda yakin ingin menyetujui pengajuan mitra dari ${alertConfig.mitra?.user.name}? User akan mendapatkan akses sebagai mitra.`
                                : `Apakah Anda yakin ingin menolak pengajuan mitra dari ${alertConfig.mitra?.user.name}? User akan menerima notifikasi penolakan.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="w-full sm:w-auto text-sm m-0">
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmAction}
                            className={cn(
                                "w-full sm:w-auto text-sm",
                                alertConfig.type === "approve"
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-red-600 hover:bg-red-700"
                            )}
                        >
                            {alertConfig.type === "approve"
                                ? "Setujui"
                                : "Tolak"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
