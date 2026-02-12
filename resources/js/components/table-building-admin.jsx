import * as React from "react";
import {
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    BookCheck,
    CheckCircle2Icon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsLeftIcon,
    ChevronsRightIcon,
    ColumnsIcon,
    Funnel,
    GripVerticalIcon,
    LoaderIcon,
    MoreVerticalIcon,
    PlusIcon,
    TrendingUpIcon,
    XCircleIcon,
    Ban,
} from "lucide-react";

import { z } from "zod";

import { formatTanggalIndo, getJamMenit } from "@/Utils/formatDateTime.js";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";

import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet.jsx";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table.jsx";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs.jsx";
import { router, usePage } from "@inertiajs/react";
import { formatRupiah } from "@/Utils/formatRupiah.js";

export const schema = z.object({
    id: z.number(),
    header: z.string(),
    speaker: z.string(),
    status: z.string(),
});

// Create a separate component for the drag handle
function DragHandle({ id }) {
    const { attributes, listeners } = useSortable({
        id,
    });

    return (
        <Button
            {...attributes}
            {...listeners}
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:bg-transparent"
        >
            <GripVerticalIcon className="size-3 text-muted-foreground" />
            <span className="sr-only">Drag to reorder</span>
        </Button>
    );
}

const columns = [
    {
        id: "drag",
        header: () => null,
        cell: ({ row }) => <DragHandle id={row.original.id} />,
    },
    {
        accessorKey: "name",
        header: "Gedung",
        cell: ({ row }) => {
            return <TableCellViewer item={row.original} />;
        },
        enableHiding: false,
    },
    {
        accessorKey: "Harga",
        header: () => <div className="w-full text-start">Harga</div>,
        cell: ({ row }) => (
            <div className="text-start">
                <p className="px-1.5 text-muted-foreground">
                    Rp. {formatRupiah(row.original.price)}
                </p>
            </div>
        ),
    },
    {
        accessorKey: "Lokasi",
        header: () => <div className="w-full text-start">Lokasi</div>,
        cell: ({ row }) => (
            <div className="text-start">
                <p className="px-1.5 text-muted-foreground">
                    {row.original.location}
                </p>
            </div>
        ),
    },
    {
        accessorKey: "Kapasitas",
        header: () => <div className="w-full text-start">Kapasitas</div>,
        cell: ({ row }) => {
            return (
                <div>
                    <p>{row.original.capacity}</p>
                </div>
            );
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.original.status;
            let icon = null;
            let badgeColor = "";
            let text = "";

            switch (status) {
                case "active":
                    icon = (
                        <CheckCircle2Icon className="text-green-500 dark:text-green-400" />
                    );
                    badgeColor = "text-green-500";
                    text = "Aktif";
                    break;
                case "inactive":
                    icon = (
                        <XCircleIcon className="text-red-500 dark:text-red-400" />
                    );
                    badgeColor = "text-red-500";
                    text = "Tidak Aktif";
                    break;
                default:
                    icon = <LoaderIcon className="text-muted-foreground" />;
                    badgeColor = "text-muted-foreground";
                    text = "Tidak diketahui";
                    break;
            }

            return (
                <Badge
                    variant="outline"
                    className={`flex gap-1 px-1.5 [&_svg]:size-3 ${badgeColor}`}
                >
                    {icon}
                    {text}
                </Badge>
            );
        },
    },
    {
        id: "actions",
        header: () => <div className="w-full text-center">Aksi</div>,
        cell: ({ row }) => {
            const building = row.original;

            return (
                <div className="flex items-center justify-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="size-8 text-muted-foreground data-[state=open]:bg-muted flex"
                                size="icon"
                            >
                                <MoreVerticalIcon />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem
                                onClick={() =>
                                    router.put(
                                        route(
                                            "admin.buildings.banned",
                                            building.id
                                        )
                                    )
                                }
                            >
                                Banned
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    },
];

function DraggableRow({ row }) {
    const { transform, transition, setNodeRef, isDragging } = useSortable({
        id: row.original.id,
    });

    return (
        <TableRow
            data-state={row.getIsSelected() && "selected"}
            data-dragging={isDragging}
            ref={setNodeRef}
            className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
            style={{
                transform: CSS.Transform.toString(transform),
                transition: transition,
            }}
        >
            {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
            ))}
        </TableRow>
    );
}

export function DataTable({ data: initialData }) {
    const [data, setData] = React.useState(() => initialData);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState("all");
    React.useEffect(() => {
        setData(initialData);
    }, [initialData]);
    const [rowSelection, setRowSelection] = React.useState({});
    const [columnVisibility, setColumnVisibility] = React.useState({});
    const [columnFilters, setColumnFilters] = React.useState([]);
    const [sorting, setSorting] = React.useState([]);
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: 10,
    });
    const sortableId = React.useId();
    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {})
    );

    const filteredData = React.useMemo(() => {
        let result = data;

        if (statusFilter !== "all") {
            result = result.filter((item) => item.status === statusFilter);
        }

        if (searchTerm.trim() !== "") {
            result = result.filter((item) =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return result;
    }, [data, statusFilter, searchTerm]);

    const dataIds = React.useMemo(
        () => data?.map(({ id }) => id) || [],
        [data]
    );

    const table = useReactTable({
        data: filteredData,
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
            pagination,
        },
        getRowId: (row) => row.id.toString(),
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    });
    const getStatusCount = (status) => {
        if (status === "all") return data.length;
        return data.filter((item) => item.status === status).length;
    };

    function handleDragEnd(event) {
        const { active, over } = event;
        if (active && over && active.id !== over.id) {
            setData((data) => {
                const oldIndex = dataIds.indexOf(active.id);
                const newIndex = dataIds.indexOf(over.id);
                return arrayMove(data, oldIndex, newIndex);
            });
        }
    }

    return (
        <Tabs
            defaultValue="outline"
            className="flex w-full flex-col justify-start gap-6"
        >
            <div className="flex items-center justify-between px-4 lg:px-6">
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <ColumnsIcon />
                                <span className="hidden lg:inline">
                                    Atur Kolom
                                </span>
                                <span className="lg:hidden">Kolom</span>
                                <ChevronDownIcon />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            {table
                                .getAllColumns()
                                .filter(
                                    (column) =>
                                        typeof column.accessorFn !==
                                            "undefined" && column.getCanHide()
                                )
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    );
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Funnel />
                                <span className="hidden lg:inline">
                                    Filter Status
                                </span>
                                <span className="lg:hidden">Filter</span>
                                <ChevronDownIcon />
                                {statusFilter !== "all" && (
                                    <Badge
                                        variant="secondary"
                                        className="ml-1 h-5 px-1"
                                    >
                                        {getStatusCount(statusFilter)}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem
                                onClick={() => setStatusFilter("all")}
                                className="justify-between"
                            >
                                <span>Semua Status</span>
                                <Badge variant="outline" className="h-5 px-1">
                                    {getStatusCount("all")}
                                </Badge>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                onClick={() => setStatusFilter("active")}
                                className="justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <CheckCircle2Icon className="h-3 w-3 text-green-500" />
                                    <span>Terima</span>
                                </div>
                                <Badge variant="outline" className="h-5 px-1">
                                    {getStatusCount("active")}
                                </Badge>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setStatusFilter("inactive")}
                                className="justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <XCircleIcon className="h-3 w-3 text-red-500" />
                                    <span>Tidak Aktif</span>
                                </div>
                                <Badge variant="outline" className="h-5 px-1">
                                    {getStatusCount("inactive")}
                                </Badge>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setStatusFilter("completed")}
                                className="justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <BookCheck className="h-3 w-3 text-blue-500" />
                                    <span>Selesai</span>
                                </div>
                                <Badge variant="outline" className="h-5 px-1">
                                    {getStatusCount("completed")}
                                </Badge>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setStatusFilter("banned")}
                                className="justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <Ban className="h-3 w-3 text-red-500" />
                                    <span>Dilarang</span>
                                </div>
                                <Badge variant="outline" className="h-5 px-1">
                                    {getStatusCount("banned")}
                                </Badge>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="w-2/9">
                    <Input
                        type="text"
                        placeholder="Cari"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="text-sm"
                    />
                </div>
            </div>
            {statusFilter !== "all" && (
                <div className="px-4 lg:px-6">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            Filter aktif:
                        </span>
                        <Badge variant="secondary" className="gap-1">
                            {statusFilter === "active" && "Aktif"}
                            {statusFilter === "inactive" && "Tidak Aktif"}
                            {statusFilter === "completed" && "Selesai"}
                            {statusFilter === "banned" && "Dilarang"}
                            <button
                                onClick={() => setStatusFilter("all")}
                                className="ml-1 rounded-full hover:bg-muted-foreground/20"
                            >
                                <XCircleIcon className="h-3 w-3" />
                            </button>
                        </Badge>
                    </div>
                </div>
            )}
            <TabsContent
                value="outline"
                className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
            >
                <div className="overflow-hidden rounded-lg border">
                    <DndContext
                        collisionDetection={closestCenter}
                        modifiers={[restrictToVerticalAxis]}
                        onDragEnd={handleDragEnd}
                        sensors={sensors}
                        id={sortableId}
                    >
                        <Table>
                            <TableHeader className="sticky top-0 z-10 bg-muted">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => {
                                            return (
                                                <TableHead
                                                    key={header.id}
                                                    colSpan={header.colSpan}
                                                >
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                              header.column
                                                                  .columnDef
                                                                  .header,
                                                              header.getContext()
                                                          )}
                                                </TableHead>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody className="**:data-[slot=table-cell]:first:w-8">
                                {table.getRowModel().rows?.length ? (
                                    <SortableContext
                                        items={dataIds}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {table.getRowModel().rows.map((row) => (
                                            <DraggableRow
                                                key={row.id}
                                                row={row}
                                            />
                                        ))}
                                    </SortableContext>
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center"
                                        >
                                            No results.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </DndContext>
                </div>
                <div className="flex items-center justify-between px-4">
                    <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
                        {table.getFilteredSelectedRowModel().rows.length} of{" "}
                        {table.getFilteredRowModel().rows.length} row(s)
                        selected.
                    </div>
                    <div className="flex w-full items-center gap-8 lg:w-fit">
                        <div className="hidden items-center gap-2 lg:flex">
                            <Label
                                htmlFor="rows-per-page"
                                className="text-sm font-medium"
                            >
                                Rows per page
                            </Label>
                            <Select
                                value={`${
                                    table.getState().pagination.pageSize
                                }`}
                                onValueChange={(value) => {
                                    table.setPageSize(Number(value));
                                }}
                            >
                                <SelectTrigger
                                    className="w-20"
                                    id="rows-per-page"
                                >
                                    <SelectValue
                                        placeholder={
                                            table.getState().pagination.pageSize
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[10, 20, 30, 40, 50].map((pageSize) => (
                                        <SelectItem
                                            key={pageSize}
                                            value={`${pageSize}`}
                                        >
                                            {pageSize}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex w-fit items-center justify-center text-sm font-medium">
                            Page {table.getState().pagination.pageIndex + 1} of{" "}
                            {table.getPageCount()}
                        </div>
                        <div className="ml-auto flex items-center gap-2 lg:ml-0">
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex"
                                onClick={() => table.setPageIndex(0)}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <span className="sr-only">
                                    Go to first page
                                </span>
                                <ChevronsLeftIcon />
                            </Button>
                            <Button
                                variant="outline"
                                className="size-8"
                                size="icon"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <span className="sr-only">
                                    Go to previous page
                                </span>
                                <ChevronLeftIcon />
                            </Button>
                            <Button
                                variant="outline"
                                className="size-8"
                                size="icon"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to next page</span>
                                <ChevronRightIcon />
                            </Button>
                            <Button
                                variant="outline"
                                className="hidden size-8 lg:flex"
                                size="icon"
                                onClick={() =>
                                    table.setPageIndex(table.getPageCount() - 1)
                                }
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to last page</span>
                                <ChevronsRightIcon />
                            </Button>
                        </div>
                    </div>
                </div>
            </TabsContent>
            <TabsContent
                value="past-performance"
                className="flex flex-col px-4 lg:px-6"
            >
                <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
            </TabsContent>
            <TabsContent
                value="key-personnel"
                className="flex flex-col px-4 lg:px-6"
            >
                <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
            </TabsContent>
            <TabsContent
                value="focus-documents"
                className="flex flex-col px-4 lg:px-6"
            >
                <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
            </TabsContent>
        </Tabs>
    );
}

function TableCellViewer({ item }) {
    const isMobile = useIsMobile();
    const { ziggy } = usePage().props;

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button
                    variant="link"
                    className="w-fit px-0 text-left text-foreground"
                >
                    {item.name}
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[100] flex flex-col">
                <SheetHeader className="gap-1">
                    <SheetTitle>{item.name}</SheetTitle>
                    <SheetDescription>
                        {item.description && item.description}
                    </SheetDescription>
                    <div className="flex flex-col gap-4">
                        <img
                            src={
                                item.thumbnail.includes("default-event-images")
                                    ? `${ziggy.url}/storage${item.thumbnail}`
                                    : `${ziggy.url}/storage/thumbnails/${item.thumbnail}`
                            }
                            alt="thumbnail Acara"
                            className="w-[200px] border object-cover mx-auto shadow"
                        />
                        <div className="">
                            <Badge className={"mb-2"}>{item.event_mode}</Badge>

                            <p className="text-sm text-muted-foreground">
                                Tanggal Event:{" "}
                                {formatTanggalIndo(item.event_date_start) +
                                    " " +
                                    getJamMenit(item.event_date_start)}{" "}
                                {item.event_date_end == item.event_date_start &&
                                    "- Selesai"}
                            </p>
                            {}
                            <p className="text-sm text-muted-foreground">
                                Lokasi: {item.location}
                            </p>
                        </div>
                    </div>
                </SheetHeader>
            </SheetContent>
        </Sheet>
    );
}
