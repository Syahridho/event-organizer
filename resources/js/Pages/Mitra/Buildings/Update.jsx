import { useState, lazy, Suspense } from "react";
import LocationInputWithMap from "@/Components/location-input-with-map.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import AppLayout from "@/Layouts/App/AppSidebarLayout";
import { formatRupiahInput } from "@/Utils/formatRupiah.js";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import {
    ArrowLeft,
    Loader2,
    LoaderCircle,
    Plus,
    Trash2,
    Notebook,
} from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge.jsx";
import { useCsrfToken } from "@/hooks/useCsrfToken";
import "react-quill/dist/quill.snow.css";

const ReactQuill = lazy(() => import("react-quill"));

const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Gedung", href: "/dashboard/buildings" },
    {
        title: "Edit",
        href: "/dashboard/buildings",
    },
];

export default function BuildingsCreate() {
    const { building, ziggy, categories } = usePage().props;
    const { csrfToken } = useCsrfToken();

    const { data, setData, processing, post } = useForm({
        name: building?.name ?? "",
        thumbnail: building?.thumbnail ?? null,
        description: building?.description ?? "",
        capacity: building?.capacity ?? "",
        price: building?.price ?? "",
        pin: building?.pin
            ? building.pin.split(",").map(Number)
            : [0.5071, 101.4478],
        location: building?.location ?? "",
        itemPhoto: building?.item_photos ?? [],
        selected_categories:
            building?.categories?.map((cat) => ({
                id: cat.id,
                name: cat.name,
            })) ?? [],
        _method: "put",
    });

    const [uiState, setUiState] = useState({
        isLoadingSearch: false,
        categorySearch: "",
        categorySearchResults: [],
        isLoadingCategories: false,
    });

    const handleChange = (e) => {
        const formatted = formatRupiahInput(e.target.value);
        setData("price", formatted);
    };

    const handleAddPhoto = () => {
        const last = data.itemPhoto.at(-1);
        if (last && !last.photo) {
            toast.warning("Isi kolom yang kosong terlebih dahulu");
            return;
        }
        setData("itemPhoto", [...data.itemPhoto, { photo: null, caption: "" }]);
    };

    const handleRemovePhoto = (index) => {
        setData(
            "itemPhoto",
            data.itemPhoto.filter((_, i) => i !== index)
        );
    };

    const handleCategorySearch = async (query) => {
        if (!query.trim()) {
            setUiState((prev) => ({
                ...prev,
                categorySearchResults: [],
                isLoadingCategories: false,
            }));
            return;
        }

        setUiState((prev) => ({ ...prev, isLoadingCategories: true }));

        try {
            const response = await fetch(
                `/dashboard/categories/api?search=${encodeURIComponent(query)}`,
                {
                    headers: {
                        Accept: "application/json",
                        "X-CSRF-TOKEN": csrfToken,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setUiState((prev) => ({
                    ...prev,
                    categorySearchResults: data.categories || [],
                    isLoadingCategories: false,
                }));
            } else {
                setUiState((prev) => ({
                    ...prev,
                    categorySearchResults: [],
                    isLoadingCategories: false,
                }));
            }
        } catch (error) {
            console.error("Error searching categories:", error);
            setUiState((prev) => ({
                ...prev,
                categorySearchResults: [],
                isLoadingCategories: false,
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (data.itemPhoto.some((item) => !item.photo)) {
            toast.warning("Isi semua foto tambahan terlebih dahulu");
            return;
        }

        const formSubmit = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            // Handle selected_categories specially - extract only IDs for backend
            if (key === "selected_categories") {
                const categoryIds = value.map((cat) => cat.id);

                // Always send category_ids array, even if empty
                if (categoryIds.length > 0) {
                    categoryIds.forEach((id, idx) => {
                        formSubmit.append(`category_ids[${idx}]`, id);
                    });
                } else {
                    // Send empty array to explicitly clear categories
                    formSubmit.append("category_ids", "");
                }
            } else if (Array.isArray(value)) {
                value.forEach((item, idx) => {
                    if (item && typeof item === "object") {
                        Object.entries(item).forEach(([k, v]) => {
                            formSubmit.append(`${key}[${idx}][${k}]`, v ?? "");
                        });
                    }
                });
            } else if (value !== null && value !== undefined) {
                if (key === "price") {
                    const cleanedPrice =
                        typeof value === "string"
                            ? value.replace(/\./g, "")
                            : String(value);
                    formSubmit.append(key, cleanedPrice);
                } else {
                    formSubmit.append(key, value);
                }
            }
        });

        post(route("buildings.update", building.id), formSubmit, {
            forceFormData: true,
            onError: (errors) =>
                console.error("Form submission error:", errors),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Building" />
            <div className="p-4">
                <div className="mb-6 flex items-center">
                    <Link href="/dashboard/buildings">
                        <Button variant="ghost" className="cursor-pointer">
                            <ArrowLeft />
                        </Button>
                    </Link>
                    <span className="ms-2 text-lg font-semibold">
                        Edit Gedung Anda
                    </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid w-full items-center gap-3">
                        <Label
                            htmlFor="thumbnail"
                            className={clsx(
                                "mx-auto w-44 h-44 border flex justify-center items-center rounded cursor-pointer hover:bg-muted",
                                !data.thumbnail && "border-dashed"
                            )}
                        >
                            {data.thumbnail ? (
                                <img
                                    src={
                                        typeof data.thumbnail === "string"
                                            ? `${ziggy.url}/storage/thumbnails/${data.thumbnail}`
                                            : URL.createObjectURL(
                                                  data.thumbnail
                                              )
                                    }
                                    alt="Thumbnail Jasa"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                "+"
                            )}
                        </Label>
                        <Input
                            id="thumbnail"
                            type="file"
                            name="thumbnail"
                            accept="image/*"
                            className="absolute w-2 -z-50 opacity-0"
                            onChange={(e) =>
                                setData("thumbnail", e.target.files?.[0])
                            }
                        />
                    </div>

                    <div className="flex justify-center flex-wrap gap-2">
                        {data.itemPhoto.map((item, index) => (
                            <div key={index} className="relative w-44 h-44">
                                <Label
                                    htmlFor={`item-photo-${index}`}
                                    className={clsx(
                                        "absolute inset-0 border flex justify-center items-center cursor-pointer hover:bg-muted rounded-md overflow-hidden",
                                        !item.photo && "border-dashed"
                                    )}
                                >
                                    {item.photo ? (
                                        <img
                                            src={
                                                typeof item.photo === "string"
                                                    ? `${ziggy.url}/storage/item-photos/${item.photo}`
                                                    : URL.createObjectURL(
                                                          item.photo
                                                      )
                                            }
                                            alt={`Photo ${index}`}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-2xl font-bold text-gray-400">
                                            +
                                        </span>
                                    )}
                                </Label>
                                <Input
                                    id={`item-photo-${index}`}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        const updated = [...data.itemPhoto];
                                        updated[index].photo = file;
                                        updated[
                                            index
                                        ].caption = `${data.name} + ${index}`;
                                        setData("itemPhoto", updated);
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                                    onClick={() => handleRemovePhoto(index)}
                                >
                                    ×
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="grid w-full items-center gap-3">
                        <Button
                            type="button"
                            variant="link"
                            onClick={() => handleAddPhoto()}
                            className="text-xs px-0 mx-auto"
                        >
                            Tambahakan lebih banyak foto
                        </Button>
                    </div>

                    <div className="grid w-full gap-3">
                        <Label htmlFor="name">Nama Gedung</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid w-full gap-3">
                        <Label htmlFor="description">Deskripsi Gedung</Label>
                        <div className="rounded-lg border border-gray-200 overflow-hidden">
                            <Suspense
                                fallback={
                                    <div className="p-4 text-center">
                                        Loading editor...
                                    </div>
                                }
                            >
                                <ReactQuill
                                    theme="snow"
                                    value={data.description}
                                    onChange={(content) =>
                                        setData("description", content)
                                    }
                                    className="[&_.ql-toolbar]:bg-gray-50 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-200 [&_.ql-toolbar]:border-x-0 [&_.ql-toolbar]:border-t-0 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[120px] [&_.ql-editor]:text-sm"
                                    placeholder="Masukkan deskripsi..."
                                />
                            </Suspense>
                        </div>
                    </div>

                    <div className="grid w-full gap-3">
                        <Label htmlFor="capacity">Kapasitas</Label>
                        <div className="relative">
                            <Input
                                id="capacity"
                                value={data.capacity}
                                onChange={(e) =>
                                    setData(
                                        "capacity",
                                        e.target.value.replace(/\D/g, "")
                                    )
                                }
                                inputMode="numeric"
                                required
                                className="pr-16"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                Orang
                            </span>
                        </div>
                    </div>

                    <div className="grid w-full gap-3">
                        <Label htmlFor="price">Harga Gedung Perhari</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                                Rp.
                            </span>
                            <Input
                                id="price"
                                value={new Intl.NumberFormat("id-ID").format(
                                    data.price
                                )}
                                onChange={(e) => {
                                    const value = e.target.value.replace(
                                        /\D/g,
                                        ""
                                    );
                                    setData("price", value);
                                }}
                                required
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2 rounded border p-4 shadow-md bg-white">
                        <div className="flex w-full items-center justify-between">
                            <Label
                                htmlFor="categories"
                                className="text-sm font-bold text-gray-700"
                            >
                                Kategori Gedung
                            </Label>
                        </div>

                        <p className="text-xs text-muted-foreground mt-1">
                            Kaitkan minimal 1 kategori ke gedung ini agar mudah
                            ditemukan.
                        </p>

                        <div className="mt-4 grid gap-4">
                            {/* Input Pencarian Kategori */}
                            <div className="relative group">
                                <Input
                                    placeholder="Cari kategori (contoh: Workshop, Seminar...)"
                                    value={uiState.categorySearch || ""}
                                    onChange={(e) => {
                                        const query = e.target.value;
                                        setUiState((prev) => ({
                                            ...prev,
                                            categorySearch: query,
                                        }));
                                        handleCategorySearch(query);
                                    }}
                                    className="w-full border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary pr-10"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {uiState.isLoadingCategories ? (
                                        <LoaderCircle className="h-4 w-4 animate-spin text-gray-400" />
                                    ) : (
                                        <Plus className="h-4 w-4 text-gray-400" />
                                    )}
                                </div>

                                {/* Dropdown Hasil Pencarian (Style LinkedIn) */}
                                {uiState.categorySearch && (
                                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-xl max-h-60 overflow-y-auto">
                                        {/* Section: Saat ini di bagian Kategori Anda */}
                                        <div className="p-2 bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b">
                                            Hasil Pencarian
                                        </div>

                                        {uiState.categorySearchResults.length >
                                        0 ? (
                                            uiState.categorySearchResults.map(
                                                (category) => (
                                                    <div
                                                        key={category.id}
                                                        className="flex items-center justify-between p-3 hover:bg-slate-100 cursor-pointer transition-colors border-b last:border-0"
                                                        onClick={() => {
                                                            // Check if category is already selected
                                                            const isAlreadySelected =
                                                                data.selected_categories?.some(
                                                                    (cat) =>
                                                                        cat.id ===
                                                                        category.id
                                                                );

                                                            if (
                                                                !isAlreadySelected
                                                            ) {
                                                                setData(
                                                                    "selected_categories",
                                                                    [
                                                                        ...(data.selected_categories ||
                                                                            []),
                                                                        {
                                                                            id: category.id,
                                                                            name: category.name,
                                                                        },
                                                                    ]
                                                                );
                                                            }
                                                            setUiState(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    categorySearch:
                                                                        "",
                                                                    categorySearchResults:
                                                                        [],
                                                                })
                                                            );
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="w-3 h-3 rounded-full"
                                                                style={{
                                                                    backgroundColor:
                                                                        category.color ||
                                                                        "#cbd5e1",
                                                                }}
                                                            />
                                                            <span className="text-sm font-medium text-gray-800">
                                                                {category.name}
                                                            </span>
                                                        </div>
                                                        {data.selected_categories?.some(
                                                            (cat) =>
                                                                cat.id ===
                                                                category.id
                                                        ) && (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-[10px] text-green-600 bg-green-50 border-green-200"
                                                            >
                                                                Terpilih
                                                            </Badge>
                                                        )}
                                                    </div>
                                                )
                                            )
                                        ) : (
                                            <div className="p-4 text-center text-sm text-muted-foreground italic">
                                                Tidak ditemukan hasil untuk "
                                                {uiState.categorySearch}"
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Daftar Badge Kategori Terpilih */}
                            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 rounded-lg bg-slate-50/50 border border-dashed border-slate-200">
                                {data.selected_categories &&
                                data.selected_categories.length > 0 ? (
                                    data.selected_categories.map((category) => {
                                        // Find the full category object to get color
                                        const fullCategory = categories?.find(
                                            (cat) => cat.id === category.id
                                        );
                                        return (
                                            <Badge
                                                key={category.id}
                                                variant="secondary"
                                                className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 bg-white border border-slate-200 hover:border-red-200 transition-all group"
                                            >
                                                <div
                                                    className="w-2 h-2 rounded-full shadow-sm"
                                                    style={{
                                                        backgroundColor:
                                                            fullCategory?.color ||
                                                            "#94a3b8",
                                                    }}
                                                />
                                                <span className="text-sm font-semibold text-gray-700">
                                                    {category.name}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setData(
                                                            "selected_categories",
                                                            data.selected_categories.filter(
                                                                (cat) =>
                                                                    cat.id !==
                                                                    category.id
                                                            )
                                                        )
                                                    }
                                                    className="ml-1 p-0.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        );
                                    })
                                ) : (
                                    <div className="flex items-center gap-2 text-sm text-slate-400 italic px-2">
                                        <Notebook className="h-4 w-4" /> Belum
                                        ada kategori dipilih
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <LocationInputWithMap
                        isEditing={!!building.id}
                        location={data.location}
                        pin={data.pin}
                        isLoadingSearch={uiState.isLoadingSearch}
                        onLocationChange={(val) => setData("location", val)}
                        onPinChange={(coords) => setData("pin", coords)}
                        setIsLoadingSearch={(val) =>
                            setUiState({ isLoadingSearch: val })
                        }
                        initialLocationFromDB={building.location}
                    />

                    <div className="flex justify-end gap-4">
                        <Link href="/dashboard/buildings">
                            <Button
                                variant="secondary"
                                className="cursor-pointer"
                            >
                                Batalkan
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            className="cursor-pointer"
                            disabled={processing}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="animate-spin" />{" "}
                                    Loading...
                                </>
                            ) : (
                                "Edit"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
