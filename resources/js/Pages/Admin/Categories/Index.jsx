import { useState } from "react";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import AppLayout from "@/Layouts/App/AppSidebarLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { ArrowLeft, Plus, Edit, Trash2, Search, User } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog.jsx";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table.jsx";

const breadcrumbs = [
    {
        title: "Dashboard",
        href: "/admin/dashboard",
    },
    {
        title: "Kategori",
        href: "/admin/categories",
    },
];

export default function AdminCategoriesIndex() {
    const { categories } = usePage().props;
    const [searchTerm, setSearchTerm] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    const { delete: destroy, processing } = useForm();

    const filteredCategories =
        categories?.data?.filter(
            (category) =>
                category.name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                category.user?.name
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase())
        ) || [];

    const handleDelete = (category) => {
        setCategoryToDelete(category);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (categoryToDelete) {
            destroy(route("admin.categories.destroy", categoryToDelete.id), {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setCategoryToDelete(null);
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Kategori" />

            <div className="p-4">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center">
                        <Link href="/admin/dashboard">
                            <Button
                                variant="ghost"
                                className="cursor-pointer mr-2"
                            >
                                <ArrowLeft />
                            </Button>
                        </Link>
                        <span className="text-lg font-semibold">
                            Manajemen Kategori
                        </span>
                    </div>
                    <Link href="/admin/categories/create">
                        <Button className="cursor-pointer">
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Kategori
                        </Button>
                    </Link>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Cari kategori atau pemilik..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Categories Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Semua Kategori</CardTitle>
                        <CardDescription>
                            Kelola semua kategori di sistem. Total:{" "}
                            {searchTerm
                                ? filteredCategories.length
                                : categories?.total || 0}{" "}
                            kategori
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {filteredCategories.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Pemilik</TableHead>
                                        <TableHead>Warna</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Events</TableHead>
                                        <TableHead className="text-right">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCategories.map((category) => (
                                        <TableRow key={category.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">
                                                        {category.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {category.description ||
                                                            "Tidak ada deskripsi"}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-gray-400" />
                                                    <span>
                                                        {category.user?.name ||
                                                            "System"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="h-4 w-4 rounded-full border"
                                                        style={{
                                                            backgroundColor:
                                                                category.color ||
                                                                "#gray",
                                                        }}
                                                    />
                                                    <span className="text-xs">
                                                        {category.color}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        category.is_active
                                                            ? "default"
                                                            : "secondary"
                                                    }
                                                >
                                                    {category.is_active
                                                        ? "Aktif"
                                                        : "Tidak Aktif"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {category.events_count || 0}{" "}
                                                    event
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={`/admin/categories/${category.id}/edit`}
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                                        onClick={() =>
                                                            handleDelete(
                                                                category
                                                            )
                                                        }
                                                        disabled={processing}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-12">
                                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <Search className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {searchTerm
                                        ? "Tidak ada kategori ditemukan"
                                        : "Belum ada kategori"}
                                </h3>
                                <p className="text-gray-500 mb-6">
                                    {searchTerm
                                        ? "Coba kata kunci pencarian lain"
                                        : "Mulai dengan menambahkan kategori pertama"}
                                </p>
                                {!searchTerm && (
                                    <Link href="/admin/categories/create">
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Tambah Kategori Pertama
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Kategori</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus kategori "
                            {categoryToDelete?.name}"? Tindakan ini tidak dapat
                            dibatalkan dan akan menghapus kategori dari semua
                            event yang menggunakannya.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={processing}
                        >
                            {processing ? "Menghapus..." : "Hapus"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
