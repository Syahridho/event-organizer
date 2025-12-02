import { useState, lazy, Suspense } from "react";
import LocationInputWithMap from "@/Components/location-input-with-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppLayout from "@/Layouts/App/AppSidebarLayout";
import { formatRupiahInput } from "@/Utils/formatRupiah";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import "react-quill/dist/quill.snow.css";

const ReactQuill = lazy(() => import("react-quill"));

const breadcrumbs = [
    {
        title: "Dashboard",
        href: "/dashboard",
    },
    {
        title: "Gedung",
        href: "/dashboard/buildings",
    },
    {
        title: "Tambahkan",
        href: "/dashboard/buildings/create",
    },
];

export default function BuildingsCreate() {
    const { ziggy } = usePage().props;
    const { data, setData, processing, post } = useForm({
        name: "",
        thumbnail: null,
        description: "",
        capacity: "",
        price: "",
        pin: [0.5071, 101.4478],
        location: "",
        itemPhoto: [],
    });

    const [uiState, setUiState] = useState({
        isLoadingSearch: false,
    });

    const handleChange = (e) => {
        const formatted = formatRupiahInput(e.target.value);
        setData("price", formatted);
    };

    const handleSwitch = (key, value) => {
        setUiState((prev) => ({ ...prev, [key]: value }));
    };

    const handleAddPhoto = () => {
        // Batasi maksimal 5 gambar
        if (data.itemPhoto.length >= 5) {
            toast.error("Maksimal 5 gambar saja yang dapat ditambahkan");
            return;
        }

        if (data.itemPhoto.length > 0) {
            const lastPhoto = data.itemPhoto[data.itemPhoto.length - 1];
            if (!lastPhoto.photo) {
                toast.warning("Isi kolom yang kosong terlebih dahulu");
                return;
            }
        }

        setData("itemPhoto", [...data.itemPhoto, { photo: null, caption: "" }]);
    };

    const handleRemovePhoto = (index) => {
        const newItemPhoto = data.itemPhoto.filter((_, i) => i !== index);
        setData("itemPhoto", newItemPhoto);
    };

    const submit = (e) => {
        e.preventDefault();

        const hasEmptyPhoto = data.itemPhoto.some((item) => !item.photo);

        if (hasEmptyPhoto) {
            toast.warning("isi foto terlebih dahulu");
            return;
        }

        const formSubmit = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach((item, idx) => {
                    if (typeof item === "object" && item !== null) {
                        Object.entries(item).forEach(([k, v]) => {
                            formSubmit.append(`${key}[${idx}][${k}]`, v ?? "");
                        });
                    } else {
                        formSubmit.append(
                            `${key}[${idx}]`,
                            item !== null && item !== undefined
                                ? String(item)
                                : ""
                        );
                    }
                });
            } else if (value !== null && value !== undefined) {
                formSubmit.append(key, value);
            }
        });

        post(route("buildings.store"), formSubmit, {
            forceFormData: true,
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
                        Tambahkan Gedung Anda
                    </span>
                </div>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid w-full items-center gap-3">
                        <Label
                            htmlFor="name"
                            className={clsx(
                                "mx-auto w-44 h-44 border flex justify-center items-center rounded cursor-pointer hover:bg-muted ",
                                !data.thumbnail && "border-dashed"
                            )}
                        >
                            {data.thumbnail ? (
                                <img
                                    src={
                                        typeof data.thumbnail === "string"
                                            ? `${ziggy.url}/storage${data.thumbnail}`
                                            : URL.createObjectURL(
                                                  data.thumbnail
                                              )
                                    }
                                    alt="Thumbnail Jasa"
                                    className="h-full w-full border object-cover shadow"
                                />
                            ) : (
                                "+"
                            )}
                        </Label>
                        <Input
                            id="name"
                            type="file"
                            accept="image/*"
                            className="absolute w-2 -z-50 opacity-0"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    setData("thumbnail", file);
                                }
                            }}
                            required
                        />
                    </div>
                    <div className="flex justify-center flex-wrap gap-2 ">
                        {Array.isArray(data.itemPhoto) &&
                            data.itemPhoto.map((item, index) => (
                                <div
                                    key={index}
                                    className="relative w-44 h-44 mb-4 sm:w-36 sm:h-36"
                                >
                                    <Label
                                        htmlFor={`item-photo-${index}`}
                                        className={clsx(
                                            "absolute inset-0 border flex justify-center items-center cursor-pointer hover:bg-muted rounded-md overflow-hidden",
                                            !item.photo && "border-dashed"
                                        )}
                                    >
                                        {item.photo ? (
                                            <img
                                                src={URL.createObjectURL(
                                                    item.photo
                                                )}
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
                                            const newPhotos = [
                                                ...data.itemPhoto,
                                            ];
                                            newPhotos[index].photo = file;
                                            newPhotos[
                                                index
                                            ].caption = `${data.name} + ${index}`;
                                            setData("itemPhoto", newPhotos);
                                        }}
                                        required
                                    />

                                    <Button
                                        type="button"
                                        variant="destructive"
                                        className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full text-xs flex items-center justify-center shadow-md hover:bg-red-600"
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
                            disabled={data.itemPhoto.length >= 5}
                        >
                            {data.itemPhoto.length >= 5 
                                ? `Maksimal 5 gambar (${data.itemPhoto.length}/5)`
                                : `Tambahkan lebih banyak foto (${data.itemPhoto.length}/5)`
                            }
                        </Button>
                    </div>
                    <div className="grid w-full items-center gap-3">
                        <Label htmlFor="name">Nama Gedung</Label>
                        <Input
                            type="name"
                            id="name"
                            placeholder="Nama gedung"
                            onChange={(e) => setData("name", e.target.value)}
                            value={data.name}
                            required
                        />
                    </div>
                    <div className="space-y-3">
                        <Label htmlFor="description">Deskripsi Gedung</Label>
                        <div className="rounded-lg border border-gray-200 overflow-hidden">
                            <Suspense fallback={<div className="p-4 text-center">Loading editor...</div>}>
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
                    <div className="grid w-full items-center gap-3">
                        <Label htmlFor="capacity">Kapasitas</Label>
                        <div className="relative w-full">
                            <Input
                                type="text"
                                id="capacity"
                                placeholder="0"
                                onChange={(e) =>
                                    setData(
                                        "capacity",
                                        e.target.value.replace(/\D/g, "")
                                    )
                                }
                                value={data.capacity}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                required
                                className="pr-16 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />

                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                                Orang
                            </span>
                        </div>
                    </div>
                    <div className="grid w-full items-center gap-3">
                        <Label htmlFor="price">Harga Sewa Perhari</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm ">
                                Rp.
                            </span>

                            <Input
                                type="text"
                                id="price"
                                placeholder="0"
                                value={data.price}
                                onChange={handleChange}
                                className="pl-10 bg-background text-foreground appearance-none 
                                            [&::-webkit-outer-spin-button]:appearance-none 
                                            [&::-webkit-inner-spin-button]:appearance-none"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid w-full items-center gap-3">
                        <LocationInputWithMap
                            isEditing={false}
                            location={data.location}
                            pin={data.pin}
                            isLoadingSearch={uiState.isLoadingSearch}
                            onLocationChange={(val) => setData("location", val)}
                            onPinChange={(coords) => setData("pin", coords)}
                            setIsLoadingSearch={(val) =>
                                handleSwitch("isLoadingSearch", val)
                            }
                        />
                    </div>
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
                                    <Loader2 className="animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                "Simpan"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
