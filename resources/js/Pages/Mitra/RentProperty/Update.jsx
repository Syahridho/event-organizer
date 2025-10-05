import { useState } from "react";
import LocationInputWithMap from "@/components/location-input-with-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AppLayout from "@/Layouts/App/AppSidebarLayout";
import { formatRupiahInput } from "@/Utils/formatRupiah";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import clsx from "clsx";
import { toast } from "@/hooks/use-toast";

const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Property", href: "/dashboard/rents" },
];

export default function RentUpdate() {
    const { rent, ziggy } = usePage().props;

    const { data, setData, processing, post } = useForm({
        name: rent?.name ?? "",
        thumbnail: rent?.thumbnail ?? null,
        description: rent?.description ?? "",
        capacity: rent?.capacity ?? "",
        price: rent?.price ? formatRupiahInput(rent.price) : "",
        pin: rent?.pin ? rent.pin.split(",").map(Number) : [0.5071, 101.4478],
        location: rent?.location ?? "",
        itemPhoto: rent?.item_photos ?? [],
        _method: "put",
    });

    const [uiState, setUiState] = useState({ isLoadingSearch: false });

    const handleChange = (e) => {
        const formatted = formatRupiahInput(e.target.value);
        setData("price", formatted);
    };

    const handleAddPhoto = () => {
        const last = data.itemPhoto.at(-1);
        if (last && !last.photo) {
            toast({
                title: "Isi kolom yang kosong terlebih dahulu",
                variant: "destructive",
            });
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

    const handleSubmit = (e) => {
        e.preventDefault();

        if (data.itemPhoto.some((item) => !item.photo)) {
            toast({
                title: "Isi semua foto tambahan terlebih dahulu",
                variant: "destructive",
            });
            return;
        }

        const formSubmit = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach((item, idx) => {
                    if (item && typeof item === "object") {
                        Object.entries(item).forEach(([k, v]) => {
                            formSubmit.append(`${key}[${idx}][${k}]`, v ?? "");
                        });
                    }
                });
            } else if (value !== null && value !== undefined) {
                formSubmit.append(
                    key,
                    key === "price" ? value.replace(/\./g, "") : value
                );
            }
        });

        post(route("rents.update", rent.id), formSubmit, {
            forceFormData: true,
            onProgress: () => console.log(data),
            onSuccess: () => console.log("Success"),
            onError: (errors) =>
                console.error("Form submission error:", errors),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard rent" />
            <div className="p-4">
                <div className="mb-6 flex items-center">
                    <Link href="/dashboard/rents">
                        <Button variant="ghost" className="cursor-pointer">
                            <ArrowLeft />
                        </Button>
                    </Link>
                    <span className="ms-2 text-lg font-semibold">
                        Tambahkan Gedung Anda
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

                    <Button
                        type="button"
                        variant="link"
                        onClick={handleAddPhoto}
                        className="text-xs px-0 mx-auto"
                    >
                        Tambahkan lebih banyak foto
                    </Button>

                    <div className="grid w-full gap-3">
                        <Label htmlFor="name">Nama Sewa</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid w-full gap-3">
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) =>
                                setData("description", e.target.value)
                            }
                            required
                        />
                    </div>

                    <div className="grid w-full gap-3">
                        <Label htmlFor="price">Harga Sewa Perhari</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                                Rp.
                            </span>
                            <Input
                                id="price"
                                value={data.price}
                                onChange={handleChange}
                                required
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <LocationInputWithMap
                        isEditing={!!rent.id}
                        location={data.location}
                        pin={data.pin}
                        isLoadingSearch={uiState.isLoadingSearch}
                        onLocationChange={(val) => setData("location", val)}
                        onPinChange={(coords) => setData("pin", coords)}
                        setIsLoadingSearch={(val) =>
                            setUiState({ isLoadingSearch: val })
                        }
                        initialLocationFromDB={rent.location}
                    />

                    <Button type="submit" disabled={processing}>
                        {processing ? "Loading..." : "Kirim"}
                    </Button>
                </form>
            </div>
        </AppLayout>
    );
}
