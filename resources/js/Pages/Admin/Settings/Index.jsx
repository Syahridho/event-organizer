"use client";
import * as React from "react";
import { Head, router, useForm } from "@inertiajs/react";
import { cn } from "@/Lib/utils";
import { PencilLine, Check, ChevronsUpDown } from "lucide-react";

import AppLayout from "@/Layouts/App/AppSidebarLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { formatRupiah, formatRupiahInput } from "@/Utils/formatRupiah";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const breadcrumbs = [
    { title: "Dashboard", href: "/admin/dashboard" },
    { title: "Pengaturan", href: "/admin/dashboard/setting" },
];

export default function AdminSettingDashboard({ auth, setting }) {
    const [pajakType, setPajakType] = React.useState(
        setting?.tax_type || "percent"
    );
    const [pajakAmount, setPajakAmount] = React.useState(
        String(setting?.tax_value || 0)
    );

    const [seoTitle, setSeoTitle] = React.useState(setting?.seo_title || "");
    const [seoDescription, setSeoDescription] = React.useState(
        setting?.seo_description || ""
    );
    const [seoKeywords, setSeoKeywords] = React.useState(
        setting?.seo_keywords || ""
    );
    const [seoImage, setSeoImage] = React.useState(setting?.seo_image || "");
    const [seoTwitterCard, setSeoTwitterCard] = React.useState(
        setting?.seo_twitter_card || "summary"
    );
    const [seoOgType, setSeoOgType] = React.useState(
        setting?.seo_og_type || "website"
    );
    const [seoCanonicalUrl, setSeoCanonicalUrl] = React.useState(
        setting?.seo_canonical_url || ""
    );
    const [seoRobots, setSeoRobots] = React.useState(
        setting?.seo_robots || "index"
    );
    const [seoAuthor, setSeoAuthor] = React.useState(setting?.seo_author || "");
    const [seoPublisher, setSeoPublisher] = React.useState(
        setting?.seo_publisher || ""
    );
    const [maintenanceMode, setMaintenanceMode] = React.useState(
        setting?.maintenance_mode || false
    );

    const [isModal, setIsModal] = React.useState({
        tax: false,
        seo: false,
    });
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSave = async () => {
        try {
            setIsLoading(true);

            router.post(
                route("admin.settings.tax.update"),
                {
                    tax_type: pajakType,
                    tax_value: pajakAmount,
                },
                {
                    onSuccess: () => {
                        setIsModal((prev) => ({ ...prev, tax: false }));
                    },
                    onError: (errors) => {
                        console.error("Error update pajak:", errors);
                    },
                    onFinish: () => {
                        setIsLoading(false);
                    },
                }
            );
        } catch (error) {
            console.error("Terjadi kesalahan:", error);
            setIsLoading(false);
        }
    };

    const handleSaveSeo = async () => {
        try {
            setIsLoading(true);

            router.post(
                route("admin.settings.store"),
                {
                    seo_title: seoTitle,
                    seo_description: seoDescription,
                    seo_keywords: seoKeywords,
                    seo_image: seoImage,
                    seo_twitter_card: seoTwitterCard,
                    seo_og_type: seoOgType,
                    seo_canonical_url: seoCanonicalUrl,
                    seo_robots: seoRobots,
                    seo_author: seoAuthor,
                    seo_publisher: seoPublisher,
                },
                {
                    onSuccess: () => {
                        setIsModal((prev) => ({ ...prev, seo: false }));
                    },
                    onError: (errors) => {
                        console.error("Error update SEO:", errors);
                    },
                    onFinish: () => {
                        setIsLoading(false);
                    },
                }
            );
        } catch (error) {
            console.error("Terjadi kesalahan:", error);
            setIsLoading(false);
        }
    };

    const handleToggleMaintenance = async (checked) => {
        try {
            setIsLoading(true);

            router.post(
                route("admin.settings.store"),
                {
                    maintenance_mode: checked,
                },
                {
                    onSuccess: () => {
                        setMaintenanceMode(checked);
                    },
                    onError: (errors) => {
                        console.error("Error toggle maintenance:", errors);
                        // Revert the switch if there's an error
                        setMaintenanceMode(!checked);
                    },
                    onFinish: () => {
                        setIsLoading(false);
                    },
                }
            );
        } catch (error) {
            console.error("Terjadi kesalahan:", error);
            setIsLoading(false);
            // Revert the switch if there's an error
            setMaintenanceMode(!checked);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="aspect-video rounded-xl bg-muted/50 ">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle className="mb-2 flex items-center gap-2">
                                    Pajak
                                    <Dialog
                                        open={isModal.tax}
                                        onOpenChange={(value) =>
                                            setIsModal((prev) => ({
                                                ...prev,
                                                tax: value,
                                            }))
                                        }
                                    >
                                        <DialogTrigger>
                                            <PencilLine
                                                size={18}
                                                className="text-muted-foreground"
                                            />
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Pajak</DialogTitle>
                                                <DialogDescription className="text-red-600">
                                                    ⚠ Pastikan pajak sudah
                                                    sesuai
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4">
                                                <div className="grid gap-3">
                                                    <Label htmlFor="tipe_pajak">
                                                        Tipe Pajak
                                                    </Label>
                                                    <Select
                                                        value={pajakType}
                                                        onValueChange={(
                                                            value
                                                        ) =>
                                                            setPajakType(value)
                                                        }
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Pilih Tipe Pajak" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="percent">
                                                                Persen %
                                                            </SelectItem>
                                                            <SelectItem value="fixed">
                                                                Tetap Rp.
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <Label htmlFor="jumlah">
                                                    Jumlah
                                                </Label>
                                                <div className="relative">
                                                    {pajakType === "fixed" ? (
                                                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                            Rp.
                                                        </span>
                                                    ) : pajakType ===
                                                      "percent" ? (
                                                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                            %
                                                        </span>
                                                    ) : null}

                                                    <Input
                                                        id="jumlah"
                                                        name="jumlah"
                                                        placeholder="Masukkan Jumlah Pajak"
                                                        type={
                                                            pajakType ===
                                                            "fixed"
                                                                ? "text"
                                                                : "number"
                                                        }
                                                        className={`appearance-none pl-10 ${
                                                            pajakType ===
                                                            "percent"
                                                                ? "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                                                                : ""
                                                        }`}
                                                        value={
                                                            pajakType ===
                                                            "fixed"
                                                                ? formatRupiahInput(
                                                                      pajakAmount
                                                                  )
                                                                : pajakAmount
                                                        }
                                                        onChange={(e) => {
                                                            const val =
                                                                e.target.value;
                                                            if (
                                                                pajakType ===
                                                                "fixed"
                                                            ) {
                                                                const numericVal =
                                                                    val.replace(
                                                                        /\D/g,
                                                                        ""
                                                                    );
                                                                setPajakAmount(
                                                                    numericVal
                                                                );
                                                            } else {
                                                                setPajakAmount(
                                                                    val
                                                                );
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button variant="outline">
                                                        Batal
                                                    </Button>
                                                </DialogClose>
                                                <Button
                                                    onClick={handleSave}
                                                    disabed={isLoading}
                                                >
                                                    {isLoading
                                                        ? "Menyimpan..."
                                                        : "Simpan"}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </CardTitle>

                                {/* Tampilkan Pajak */}
                                <CardDescription>
                                    {setting?.tax_type === "percent"
                                        ? `${setting?.tax_value}%`
                                        : `Rp. ${formatRupiah(
                                              setting?.tax_value || 0
                                          )}` || "Rp. 0"}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                    <div className="aspect-video rounded-xl bg-muted/50 ">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle className="mb-2 flex items-center gap-2">
                                    SEO
                                    <Dialog
                                        open={isModal.seo}
                                        onOpenChange={(value) =>
                                            setIsModal((prev) => ({
                                                ...prev,
                                                seo: value,
                                            }))
                                        }
                                    >
                                        <DialogTrigger>
                                            <PencilLine
                                                size={18}
                                                className="text-muted-foreground"
                                            />
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>
                                                    SEO Settings
                                                </DialogTitle>
                                                <DialogDescription className="text-red-600">
                                                    ⚠ Pastikan pengaturan SEO
                                                    sudah sesuai
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="seo_title">
                                                        SEO Title
                                                    </Label>
                                                    <Input
                                                        id="seo_title"
                                                        value={seoTitle}
                                                        onChange={(e) =>
                                                            setSeoTitle(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Enter SEO title"
                                                        maxLength={60}
                                                    />
                                                    <span className="text-xs text-muted-foreground">
                                                        {seoTitle.length}/60
                                                        characters
                                                    </span>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="seo_description">
                                                        SEO Description
                                                    </Label>
                                                    <Textarea
                                                        id="seo_description"
                                                        value={seoDescription}
                                                        onChange={(e) =>
                                                            setSeoDescription(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Enter SEO description"
                                                        maxLength={160}
                                                    />
                                                    <span className="text-xs text-muted-foreground">
                                                        {seoDescription.length}
                                                        /160 characters
                                                    </span>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="seo_keywords">
                                                        SEO Keywords
                                                    </Label>
                                                    <Input
                                                        id="seo_keywords"
                                                        value={seoKeywords}
                                                        onChange={(e) =>
                                                            setSeoKeywords(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Enter SEO keywords (comma separated)"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="seo_image">
                                                        SEO Image URL
                                                    </Label>
                                                    <Input
                                                        id="seo_image"
                                                        value={seoImage}
                                                        onChange={(e) =>
                                                            setSeoImage(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Enter SEO image URL"
                                                        type="url"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="seo_twitter_card">
                                                        Twitter Card Type
                                                    </Label>
                                                    <Select
                                                        value={seoTwitterCard}
                                                        onValueChange={
                                                            setSeoTwitterCard
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="summary">
                                                                Summary
                                                            </SelectItem>
                                                            <SelectItem value="summary_large_image">
                                                                Summary Large
                                                                Image
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="seo_og_type">
                                                        Open Graph Type
                                                    </Label>
                                                    <Select
                                                        value={seoOgType}
                                                        onValueChange={
                                                            setSeoOgType
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="website">
                                                                Website
                                                            </SelectItem>
                                                            <SelectItem value="article">
                                                                Article
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="seo_canonical_url">
                                                        Canonical URL
                                                    </Label>
                                                    <Input
                                                        id="seo_canonical_url"
                                                        value={seoCanonicalUrl}
                                                        onChange={(e) =>
                                                            setSeoCanonicalUrl(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Enter canonical URL"
                                                        type="url"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="seo_robots">
                                                        Robots Meta
                                                    </Label>
                                                    <Select
                                                        value={seoRobots}
                                                        onValueChange={
                                                            setSeoRobots
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="index">
                                                                Index, Follow
                                                            </SelectItem>
                                                            <SelectItem value="follow">
                                                                Index, No Follow
                                                            </SelectItem>
                                                            <SelectItem value="noindex">
                                                                No Index, Follow
                                                            </SelectItem>
                                                            <SelectItem value="nofollow">
                                                                No Index, No
                                                                Follow
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="seo_author">
                                                        Author
                                                    </Label>
                                                    <Input
                                                        id="seo_author"
                                                        value={seoAuthor}
                                                        onChange={(e) =>
                                                            setSeoAuthor(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Enter author name"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="seo_publisher">
                                                        Publisher
                                                    </Label>
                                                    <Input
                                                        id="seo_publisher"
                                                        value={seoPublisher}
                                                        onChange={(e) =>
                                                            setSeoPublisher(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Enter publisher name"
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button variant="outline">
                                                        Batal
                                                    </Button>
                                                </DialogClose>
                                                <Button
                                                    onClick={handleSaveSeo}
                                                    disabled={isLoading}
                                                >
                                                    {isLoading
                                                        ? "Menyimpan..."
                                                        : "Simpan"}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </CardTitle>
                                <CardDescription>
                                    {setting?.seo_title ||
                                        "SEO belum dikonfigurasi"}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                    <div className="aspect-video rounded-xl bg-muted/50 ">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle className="mb-2">
                                    Mode Pemeliharaan
                                </CardTitle>
                                <CardDescription>
                                    Aktifkan mode pemeliharaan untuk menampilkan
                                    halaman pemeliharaan kepada pengguna
                                </CardDescription>
                                <div className="flex items-center space-x-2 pt-4">
                                    <Switch
                                        id="maintenance-mode"
                                        checked={maintenanceMode}
                                        onCheckedChange={
                                            handleToggleMaintenance
                                        }
                                        disabled={isLoading}
                                    />
                                    <Label htmlFor="maintenance-mode">
                                        {maintenanceMode ? "Aktif" : "Nonaktif"}
                                    </Label>
                                </div>
                                {maintenanceMode && (
                                    <div className="bg-orange-50 p-3 rounded-lg mt-3">
                                        <p className="text-sm text-orange-800">
                                            ⚠ Mode pemeliharaan aktif. Semua
                                            pengguna akan melihat halaman
                                            pemeliharaan kecuali admin.
                                        </p>
                                    </div>
                                )}
                            </CardHeader>
                        </Card>
                    </div>
                    <div className="aspect-video rounded-xl bg-muted/50 "></div>
                    <div className="aspect-video rounded-xl bg-muted/50 "></div>
                </div>
            </div>
        </AppLayout>
    );
}
