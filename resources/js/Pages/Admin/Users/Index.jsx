import AppLayout from "@/Layouts/App/AppSidebarLayout";
import { Head, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";
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
} from "@/components/ui/alert-dialog.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.jsx";
import { Badge } from "@/components/ui/badge.jsx";
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";
import {
    Ban,
    CheckCircle2Icon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsLeftIcon,
    ChevronsRightIcon,
    LoaderIcon,
    MoreVerticalIcon,
    Search,
    Shield,
    ShieldCheck,
    User,
    XCircleIcon,
} from "lucide-react";
import { formatTanggalIndo } from "@/Utils/formatDateTime.js";

const breadcrumbs = [
    { title: "Dashboard", href: "/admin/dashboard" },
    { title: "Management User", href: "/admin/user" },
];

export default function UserManagement({ users, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [roleFilter, setRoleFilter] = useState(filters.role || "all");
    const [statusFilter, setStatusFilter] = useState(filters.status || "all");
    const [isProcessing, setIsProcessing] = useState(null);

    const handleSearch = (value) => {
        setSearchTerm(value);
        applyFilters({ search: value, role: roleFilter, status: statusFilter });
    };

    const handleRoleFilter = (value) => {
        setRoleFilter(value);
        applyFilters({ search: searchTerm, role: value, status: statusFilter });
    };

    const handleStatusFilter = (value) => {
        setStatusFilter(value);
        applyFilters({ search: searchTerm, role: roleFilter, status: value });
    };

    const applyFilters = (params) => {
        router.get(route("admin.users.index"), params, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleBan = (user, reason) => {
        setIsProcessing(user.id);

        router.post(
            route("admin.users.ban", user.id),
            { reason },
            {
                onSuccess: () => {
                    toast.success(`User ${user.name} berhasil diblokir`);
                    setIsProcessing(null);
                },
                onError: (errors) => {
                    toast.error(errors.error || "Gagal memblokir user");
                    setIsProcessing(null);
                },
            }
        );
    };

    const handleUnban = (user) => {
        setIsProcessing(user.id);

        router.post(
            route("admin.users.unban", user.id),
            {},
            {
                onSuccess: () => {
                    toast.success(
                        `User ${user.name} berhasil dibuka blokirnya`
                    );
                    setIsProcessing(null);
                },
                onError: (errors) => {
                    toast.error(errors.error || "Gagal membuka blokir user");
                    setIsProcessing(null);
                },
            }
        );
    };

    const getRoleBadge = (role) => {
        const variants = {
            admin: {
                color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
                icon: Shield,
                label: "Admin",
            },
            mitra: {
                color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
                icon: ShieldCheck,
                label: "Mitra",
            },
            member: {
                color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
                icon: User,
                label: "Member",
            },
        };

        const variant = variants[role] || variants.member;
        const Icon = variant.icon;

        return (
            <Badge className={`flex gap-1 items-center ${variant.color}`}>
                <Icon className="w-3 h-3" />
                {variant.label}
            </Badge>
        );
    };

    const getStatusBadge = (user) => {
        if (user.is_banned) {
            return (
                <Badge
                    variant="destructive"
                    className="flex gap-1 items-center"
                >
                    <Ban className="w-3 h-3" />
                    Diblokir
                </Badge>
            );
        }

        return (
            <Badge
                variant="default"
                className="flex gap-1 items-center bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            >
                <CheckCircle2Icon className="w-3 h-3" />
                Aktif
            </Badge>
        );
    };

    const BanDialog = ({ user, onBan }) => {
        const [reason, setReason] = useState("");
        const [isOpen, setIsOpen] = useState(false);

        const handleConfirm = () => {
            if (!reason.trim()) {
                toast.error("Alasan pemblokiran harus diisi");
                return;
            }
            onBan(user, reason);
            setIsOpen(false);
            setReason("");
        };

        return (
            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                        <Ban className="mr-2 h-4 w-4" />
                        Blokir User
                    </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Ban className="h-5 w-5 text-red-500" />
                            Konfirmasi Pemblokiran
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda yakin ingin memblokir user{" "}
                            <span className="font-semibold text-foreground">
                                "{user.name}"
                            </span>
                            ? User tidak akan bisa login setelah diblokir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <label className="text-sm font-medium mb-2 block">
                            Alasan Pemblokiran
                        </label>
                        <Input
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Masukkan alasan pemblokiran..."
                            className="w-full"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            disabled={isProcessing === user.id}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isProcessing === user.id ? (
                                <>
                                    <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                "Blokir"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
    };

    const UnbanDialog = ({ user, onUnban }) => {
        const [isOpen, setIsOpen] = useState(false);

        const handleConfirm = () => {
            onUnban(user);
            setIsOpen(false);
        };

        return (
            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-green-600 focus:text-green-600 focus:bg-green-50"
                    >
                        <CheckCircle2Icon className="mr-2 h-4 w-4" />
                        Buka Blokir
                    </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <CheckCircle2Icon className="h-5 w-5 text-green-500" />
                            Konfirmasi Pembukaan Blokir
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda yakin ingin membuka blokir user{" "}
                            <span className="font-semibold text-foreground">
                                "{user.name}"
                            </span>
                            ? User akan bisa login kembali setelah blokir
                            dibuka.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            disabled={isProcessing === user.id}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isProcessing === user.id ? (
                                <>
                                    <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                "Buka Blokir"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Management User" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Management User
                    </h1>
                    <p className="text-muted-foreground">
                        Kelola semua user dan status pemblokiran di sini.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 items-center gap-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Cari user..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select
                            value={roleFilter}
                            onValueChange={handleRoleFilter}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Filter Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Role</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="mitra">Mitra</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={statusFilter}
                            onValueChange={handleStatusFilter}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Filter Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Semua Status
                                </SelectItem>
                                <SelectItem value="active">Aktif</SelectItem>
                                <SelectItem value="banned">Diblokir</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Terakhir Aktif</TableHead>
                                <TableHead>Bergabung</TableHead>
                                <TableHead className="text-right">
                                    Aksi
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.data.length > 0 ? (
                                users.data.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage
                                                        src={
                                                            user.profile_photo_url
                                                        }
                                                        alt={user.name}
                                                    />
                                                    <AvatarFallback>
                                                        {user.initials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">
                                                        {user.name}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        @{user.username}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getRoleBadge(user.role)}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(user)}
                                            {user.is_banned &&
                                                user.banned_reason && (
                                                    <div className="text-xs text-red-600 mt-1">
                                                        Alasan:{" "}
                                                        {user.banned_reason}
                                                    </div>
                                                )}
                                        </TableCell>
                                        <TableCell>
                                            {user.last_seen_at
                                                ? formatTanggalIndo(
                                                      user.last_seen_at
                                                  )
                                                : "Belum pernah login"}
                                        </TableCell>
                                        <TableCell>
                                            {formatTanggalIndo(user.created_at)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <MoreVerticalIcon className="h-4 w-4" />
                                                        <span className="sr-only">
                                                            Open menu
                                                        </span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {user.is_banned ? (
                                                        <UnbanDialog
                                                            user={user}
                                                            onUnban={
                                                                handleUnban
                                                            }
                                                        />
                                                    ) : (
                                                        user.role !==
                                                            "admin" && (
                                                            <BanDialog
                                                                user={user}
                                                                onBan={
                                                                    handleBan
                                                                }
                                                            />
                                                        )
                                                    )}
                                                    {user.is_banned &&
                                                        user.banned_at && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    disabled
                                                                >
                                                                    Diblokir
                                                                    sejak:{" "}
                                                                    {formatTanggalIndo(
                                                                        user.banned_at
                                                                    )}
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="h-24 text-center"
                                    >
                                        Tidak ada user ditemukan
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {users.data.length > 0 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Menampilkan {users.from} hingga {users.to} dari{" "}
                            {users.total} user
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get(users.first_page_url)}
                                disabled={!users.prev_page_url}
                            >
                                <ChevronsLeftIcon className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get(users.prev_page_url)}
                                disabled={!users.prev_page_url}
                            >
                                <ChevronLeftIcon className="h-4 w-4" />
                            </Button>
                            <span className="text-sm">
                                Halaman {users.current_page} dari{" "}
                                {users.last_page}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get(users.next_page_url)}
                                disabled={!users.next_page_url}
                            >
                                <ChevronRightIcon className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get(users.last_page_url)}
                                disabled={!users.next_page_url}
                            >
                                <ChevronsRightIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
