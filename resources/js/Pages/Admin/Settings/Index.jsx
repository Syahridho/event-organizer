"use client";
import * as React from "react";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import clsx from "clsx";
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
    CardFooter,
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
import { toast } from "sonner";

const breadcrumbs = [
    { title: "Dashboard", href: "/admin/dashboard" },
    { title: "Pengaturan", href: "/admin/dashboard/setting" },
];

export default function AdminSettingDashboard({ auth, setting }) {
    const { ziggy } = usePage().props;

    // State Pajak
    const [pajakType, setPajakType] = React.useState(
        setting?.tax_type || "percent"
    );
    const [pajakAmount, setPajakAmount] = React.useState(
        String(setting?.tax_value || 0)
    );

    // State SEO
    const [seoSiteName, setSeoSiteName] = React.useState(
        setting?.site_name || ""
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

    // State Logo (logo website kecil)
    const [logo, setLogo] = React.useState(setting?.logo || "");
    const [newLogoFile, setNewLogoFile] = React.useState(null);
    const [newLogoPreview, setNewLogoPreview] = React.useState(null);

    // State Hero Image (dari seo_image - gambar besar hero)
    const [heroImage, setHeroImage] = React.useState(setting?.seo_image || "");
    const [newHeroFile, setNewHeroFile] = React.useState(null);
    const [newHeroPreview, setNewHeroPreview] = React.useState(null);

    const [isModal, setIsModal] = React.useState({
        tax: false,
        seo: false,
        hero: false,
    });
    const [isLoading, setIsLoading] = React.useState(false);

    // Sync logo dan hero image (seo_image) dengan prop setting
    React.useEffect(() => {
        if (setting?.logo) {
            setLogo(setting.logo);
        }
        if (setting?.seo_image) {
            setHeroImage(setting.seo_image);
        }
    }, [setting?.logo, setting?.seo_image]);

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
                        toast.success("Berhasil Memperbarui Pajak");
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

    const handleSaveHero = async () => {
        setIsLoading(true);
        router.post(
            route("admin.settings.hero.update"),
            {
                hero_image: newHeroFile,
            },
            {
                onSuccess: () => {
                    setIsModal((prev) => ({ ...prev, hero: false }));
                    setNewHeroFile(null);
                    setNewHeroPreview(null);
                    toast.success("Berhasil Memperbarui Hero");
                },
                onError: (errors) => {
                    console.error("Error update hero:", errors);
                },
                onFinish: () => {
                    setIsLoading(false);
                },
            }
        );
    };

    const handleSaveSeo = async () => {
        try {
            setIsLoading(true);

            router.post(
                route("admin.settings.store"),
                {
                    seo_title: seoTitle,
                    site_name: seoSiteName,
                    seo_description: seoDescription,
                    seo_keywords: seoKeywords,
                    seo_author: seoAuthor,
                    seo_publisher: seoPublisher,
                    newlogo: newLogoFile ?? logo,
                },
                {
                    onSuccess: () => {
                        setIsModal((prev) => ({ ...prev, seo: false }));
                        setNewLogoFile(null);
                        setNewLogoPreview(null);
                        toast.success("Berhasil Memperbarui SEO");
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
                route("admin.settings.updateMaintenance.update"),
                {
                    maintenance_mode: checked,
                },
                {
                    onSuccess: () => {
                        setMaintenanceMode(checked);
                        toast.success("Mode Maintenance Perbarui");
                    },
                    onError: (errors) => {
                        console.error("Error toggle maintenance:", errors);
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
            setMaintenanceMode(!checked);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {/* CARD PAJAK */}
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
                                    {setting?.tax_type === "percent"
                                        ? `${setting?.tax_value}%`
                                        : `Rp. ${formatRupiah(
                                              setting?.tax_value || 0
                                          )}` || "Rp. 0"}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* CARD SEO - FIXED */}
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
                                                    <Label htmlFor="seo_site_name">
                                                        Site Nama
                                                    </Label>
                                                    <Input
                                                        id="seo_site_name"
                                                        value={seoSiteName}
                                                        onChange={(e) =>
                                                            setSeoSiteName(
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                {/* LOGO WEBSITE - FIXED */}
                                                <div className="grid gap-2">
                                                    <Label htmlFor="logo_upload">
                                                        Logo Website
                                                    </Label>
                                                    <Label
                                                        htmlFor="logo_upload"
                                                        className={clsx(
                                                            "mx-auto w-20 h-20 rounded-lg shadow-sm border-2 flex justify-center items-center cursor-pointer hover:bg-muted transition-colors",
                                                            !newLogoPreview &&
                                                                !logo &&
                                                                "border-dashed"
                                                        )}
                                                    >
                                                        {newLogoPreview ? (
                                                            <img
                                                                src={
                                                                    newLogoPreview
                                                                }
                                                                alt="Preview Logo"
                                                                className="w-full h-full object-cover rounded-lg"
                                                            />
                                                        ) : logo ? (
                                                            <img
                                                                src={`${ziggy.url}/storage/seo/${logo}`}
                                                                alt="Logo Website"
                                                                className="w-full h-full object-cover rounded-lg"
                                                            />
                                                        ) : (
                                                            <span className="text-2xl text-muted-foreground">
                                                                +
                                                            </span>
                                                        )}
                                                    </Label>
                                                    <Input
                                                        id="logo_upload"
                                                        type="file"
                                                        accept="image/png,image/jpeg,image/jpg,image/webp"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file =
                                                                e.target
                                                                    .files?.[0];
                                                            if (!file) return;

                                                            if (
                                                                file.type !==
                                                                "image/png"
                                                            ) {
                                                                toast.warning(
                                                                    "Gunakan format PNG 32x32. File non-PNG akan dikonversi ke PNG otomatis saat disimpan."
                                                                );
                                                            }

                                                            setNewLogoFile(
                                                                file
                                                            );
                                                            setNewLogoPreview(
                                                                URL.createObjectURL(
                                                                    file
                                                                )
                                                            );
                                                        }}
                                                    />
                                                    <p className="text-xs text-center text-muted-foreground">
                                                        Klik untuk mengganti •
                                                        Max 2MB
                                                    </p>
                                                    <p className="text-xs text-center text-red-600">
                                                        Disarankan PNG 32x32.
                                                        File non-PNG akan
                                                        otomatis dikonversi ke
                                                        PNG saat disimpan.
                                                    </p>
                                                </div>

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
                                                        maxLength={60}
                                                    />
                                                    <span className="text-xs text-muted-foreground">
                                                        {seoTitle.length}/60
                                                        Kata
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
                                                    />
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
                                    <h1 className="truncate">
                                        {setting?.seo_title ||
                                            "SEO belum dikonfigurasi"}
                                    </h1>
                                    <h1 className="truncate">
                                        {setting?.seo_description ||
                                            "SEO belum dikonfigurasi"}
                                    </h1>
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* CARD MAINTENANCE MODE */}
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle className="mb-2">
                                Mode Pemeliharaan
                            </CardTitle>
                            <CardDescription>
                                Aktifkan mode pemeliharaan untuk menampilkan
                                halaman pemeliharaan kepada pengguna
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow pt-0">
                            {maintenanceMode && (
                                <div className="bg-orange-50 p-3 rounded-lg mt-3">
                                    <p className="text-sm text-orange-800">
                                        ⚠ Mode pemeliharaan aktif. Semua
                                        pengguna akan melihat halaman
                                        pemeliharaan kecuali admin.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="maintenance-mode"
                                    checked={maintenanceMode}
                                    onCheckedChange={handleToggleMaintenance}
                                    disabled={isLoading}
                                />
                                <Label htmlFor="maintenance-mode">
                                    {maintenanceMode ? "Aktif" : "Nonaktif"}
                                </Label>
                            </div>
                        </CardFooter>
                    </Card>

                    {/* CARD HERO IMAGE */}
                    <Card className="w-full">
                        <CardHeader className="mb-2 flex flex-row items-center justify-between gap-2">
                            <CardTitle>Tampilan hero web</CardTitle>
                            <Dialog
                                open={isModal.hero}
                                onOpenChange={(value) =>
                                    setIsModal((prev) => ({
                                        ...prev,
                                        hero: value,
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
                                        <DialogTitle>Hero</DialogTitle>
                                        <DialogDescription>
                                            Klik gambar untuk mengganti,{" "}
                                            <span className="text-red-500">
                                                Max 2MB*
                                            </span>
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4">
                                        <div className="grid w-full items-center gap-3">
                                            <Label
                                                htmlFor="hero-image-upload"
                                                className={clsx(
                                                    "mx-auto w-full h-74 rounded shadow border flex justify-center items-center rounded cursor-pointer hover:bg-muted ",
                                                    !newHeroPreview &&
                                                        !heroImage &&
                                                        "border-dashed"
                                                )}
                                            >
                                                {newHeroPreview ? (
                                                    <img
                                                        src={newHeroPreview}
                                                        alt="Preview Hero Baru"
                                                        className="h-full w-full border object-cover shadow"
                                                    />
                                                ) : heroImage ? (
                                                    <img
                                                        src={`${ziggy.url}/storage/seo/${heroImage}`}
                                                        alt="Hero Image"
                                                        className="h-full w-full border object-cover shadow"
                                                    />
                                                ) : (
                                                    "+"
                                                )}
                                            </Label>
                                            <Input
                                                id="hero-image-upload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file =
                                                        e.target.files?.[0];
                                                    if (file) {
                                                        setNewHeroFile(file);
                                                        setNewHeroPreview(
                                                            URL.createObjectURL(
                                                                file
                                                            )
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
                                            onClick={handleSaveHero}
                                            disabled={isLoading}
                                        >
                                            {isLoading
                                                ? "Menyimpan..."
                                                : "Simpan"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>

                        <CardContent>
                            <div className="aspect-video rounded-md overflow-hidden bg-muted/50">
                                {heroImage ? (
                                    <img
                                        src={`${ziggy.url}/storage/seo/${heroImage}`}
                                        alt="image hero"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                        (Hero image belum diatur)
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
