import { useState } from "react";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import AppLayout from "@/Layouts/App/AppSidebarLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Switch } from "@/components/ui/switch.jsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select.jsx";

const breadcrumbs = [
    {
        title: "Dashboard",
        href: "/admin/dashboard",
    },
    {
        title: "Kategori",
        href: "/admin/categories",
    },
    {
        title: "Edit",
        href: "#",
    },
];

const predefinedColors = [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Yellow
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#14B8A6", // Teal
    "#F97316", // Orange
    "#6B7280", // Gray
    "#84CC16", // Lime
];

export default function AdminEditCategory() {
    const { category, errors, users } = usePage().props;
    const { data, setData, put, processing } = useForm({
        name: category.name || "",
        description: category.description || "",
        color: category.color || "#3B82F6",
        is_active: category.is_active ?? true,
        user_id: category.user_id?.toString() || "admin",
    });

    const submit = (e) => {
        e.preventDefault();
        put(route("admin.categories.update", category.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Kategori" />

            <div className="p-4">
                <div className="mb-6 flex items-center">
                    <Link href="/admin/categories">
                        <Button variant="ghost" className="cursor-pointer mr-2">
                            <ArrowLeft />
                        </Button>
                    </Link>
                    <span className="text-lg font-semibold">
                        Edit Kategori: {category.name}
                    </span>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informasi Dasar</CardTitle>
                                    <CardDescription>
                                        Perbarui informasi utama kategori
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">
                                            Nama Kategori *
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData("name", e.target.value)
                                            }
                                            placeholder="Contoh: Teknologi, Bisnis, Pendidikan"
                                            required
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-red-600">
                                                {errors.name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">
                                            Deskripsi
                                        </Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) =>
                                                setData(
                                                    "description",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Jelaskan jenis acara yang termasuk dalam kategori ini"
                                            rows={3}
                                        />
                                        {errors.description && (
                                            <p className="text-sm text-red-600">
                                                {errors.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="is_active"
                                            checked={data.is_active}
                                            onCheckedChange={(checked) =>
                                                setData("is_active", checked)
                                            }
                                        />
                                        <Label htmlFor="is_active">
                                            Kategori Aktif
                                        </Label>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Assign ke User</CardTitle>
                                    <CardDescription>
                                        Ubah pemilik kategori ini (kosongkan
                                        untuk admin)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="user_id">
                                            Pemilik Kategori
                                        </Label>
                                        <Select
                                            value={data.user_id}
                                            onValueChange={(value) =>
                                                setData("user_id", value)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih user (opsional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin">
                                                    Admin (Tidak ada user)
                                                </SelectItem>
                                                {users?.map((user) => (
                                                    <SelectItem
                                                        key={user.id}
                                                        value={user.id.toString()}
                                                    >
                                                        {user.name} (
                                                        {user.email})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.user_id && (
                                            <p className="text-sm text-red-600">
                                                {errors.user_id}
                                            </p>
                                        )}
                                    </div>

                                    <div className="text-sm text-gray-500">
                                        Pemilik saat ini:{" "}
                                        {category.user?.name || "Admin"}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Warna Kategori</CardTitle>
                                    <CardDescription>
                                        Pilih warna untuk membantu
                                        mengidentifikasi kategori
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="color">Warna</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="color"
                                                type="color"
                                                value={data.color}
                                                onChange={(e) =>
                                                    setData(
                                                        "color",
                                                        e.target.value
                                                    )
                                                }
                                                className="h-10 w-20"
                                            />
                                            <Input
                                                type="text"
                                                value={data.color}
                                                onChange={(e) =>
                                                    setData(
                                                        "color",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="#3B82F6"
                                                className="flex-1"
                                            />
                                        </div>
                                        {errors.color && (
                                            <p className="text-sm text-red-600">
                                                {errors.color}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Warna Prasetel</Label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {predefinedColors.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() =>
                                                        setData("color", color)
                                                    }
                                                    className={`h-10 w-full rounded border-2 transition-all ${
                                                        data.color === color
                                                            ? "border-gray-900 scale-110"
                                                            : "border-gray-300 hover:border-gray-400"
                                                    }`}
                                                    style={{
                                                        backgroundColor: color,
                                                    }}
                                                    aria-label={`Pilih warna ${color}`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <Label>Preview</Label>
                                        <div className="mt-2 flex items-center gap-2 p-3 border rounded">
                                            <div
                                                className="h-4 w-4 rounded-full"
                                                style={{
                                                    backgroundColor: data.color,
                                                }}
                                            />
                                            <span className="font-medium">
                                                {data.name || "Nama Kategori"}
                                            </span>
                                            <div className="ml-auto">
                                                <div
                                                    className={`px-2 py-1 rounded text-xs text-white ${
                                                        data.is_active
                                                            ? "bg-green-500"
                                                            : "bg-gray-500"
                                                    }`}
                                                >
                                                    {data.is_active
                                                        ? "Aktif"
                                                        : "Tidak Aktif"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <Link href="/admin/categories">
                            <Button variant="outline" type="button">
                                Batal
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                "Perbarui Kategori"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
