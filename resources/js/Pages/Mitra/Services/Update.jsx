import AppLayout from "@/Layouts/App/AppSidebarLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";

import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Button } from "@/components/ui/button.jsx";
import { ArrowLeft, Loader2 } from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import { lazy, Suspense } from "react";
import "react-quill/dist/quill.snow.css";

const ReactQuill = lazy(() => import("react-quill"));

const breadcrumbs = [
    {
        title: "Dashboard",
        href: "/dashboard",
    },
    {
        title: "Jasa",
        href: "/dashboard/service",
    },
    {
        title: "Edit",
        href: "/dashboard/service",
    },
];

export default function ServicesUpdate() {
    const { ziggy, service } = usePage().props;

    const { data, setData, post, processing } = useForm({
        name: service?.name ?? "",
        thumbnail: service?.thumbnail ?? null,
        description: service?.description ?? "",
        location: service?.location ?? "",
        price: service?.price ?? "",
        itemPhoto: service?.item_photos ?? [],
        _method: "put",
    });

    const handleAddPhoto = () => {
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

        post(route("services.update", service.id), formSubmit, {
            forceFormData: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Jasa" />
            <div className="p-4">
                <div className="mb-6 flex items-center">
                    <Link href="/dashboard/services">
                        <Button variant="ghost" className="cursor-pointer">
                            <ArrowLeft />
                        </Button>
                    </Link>
                    <span className="ms-2 text-lg font-semibold">
                        Tambahkan Jasa Anda
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
                                            ? `${ziggy.url}/storage/thumbnails/${data.thumbnail}`
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
                                                src={
                                                    typeof item.photo ===
                                                    "string"
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
                                            const newPhotos = [
                                                ...data.itemPhoto,
                                            ];
                                            newPhotos[index].photo = file;
                                            newPhotos[
                                                index
                                            ].caption = `${data.name} + ${index}`;
                                            setData("itemPhoto", newPhotos);
                                        }}
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
                        >
                            Tambahkan lebih banyak foto
                        </Button>
                    </div>

                    <div className="grid w-full items-center gap-3">
                        <Label htmlFor="name">Nama Jasa</Label>
                        <Input
                            type="name"
                            id="name"
                            placeholder="MC, Tari, dan lainnya"
                            onChange={(e) => setData("name", e.target.value)}
                            value={data.name}
                            required
                        />
                    </div>
                    <div className="grid w-full items-center gap-3">
                        <Label htmlFor="description">Deskripsi Jasa</Label>
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
                                    required
                                />
                            </Suspense>
                        </div>
                    </div>
                    <div className="grid w-full items-center gap-3">
                        <Label htmlFor="location">Lokasi</Label>
                        <Input
                            type="text"
                            id="location"
                            placeholder="Kota/Daerah"
                            onChange={(e) =>
                                setData("location", e.target.value)
                            }
                            value={data.location}
                            required
                        />
                    </div>
                    <div className="grid w-full items-center gap-3">
                        <Label htmlFor="price">Harga Jasa Perhari</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm ">
                                Rp.
                            </span>

                            <Input
                                type="text"
                                id="price"
                                placeholder="0"
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
                                className="appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none pl-10"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <Link href="/dashboard/services">
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
