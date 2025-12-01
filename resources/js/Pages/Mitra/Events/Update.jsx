import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppLayout from "@/Layouts/App/AppSidebarLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import {
    ArrowLeft,
    Loader2,
    LoaderCircle,
    Notebook,
    Plus,
    Trash2,
    Shuffle,
} from "lucide-react";

import {
    getNextImage,
    getImageUrl,
    handleImageError,
} from "@/features/randomImage";
import { Textarea } from "@/components/ui/textarea";
import CalendarWithTime from "@/components/CalenderWithTime";
import LocationPickerMap from "@/components/location-picker-map";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Modal from "@/components/Modal";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import useDebounce from "@/Utils/useDebounce";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import LocationInputWithMap from "@/components/location-input-with-map";
import { formatRupiahInput } from "@/Utils/formatRupiah";
import "react-quill/dist/quill.snow.css";

const ReactQuill = lazy(() => import("react-quill"));

export default function UpdateEvent() {
    const { ziggy, event, flash, adminSettings } = usePage().props;

    const breadcrumbs = [
        { title: "Dashboard", href: "/dashboard" },
        { title: "Events", href: "/dashboard/event" },
        {
            title: event ? "Edit Event" : "Perbarui",
            href: event
                ? `/dashboard/events/${event.id}/edit`
                : "/dashboard/events/create",
        },
    ];

    const formRef = useRef(null);

    const startDateRef = useRef(null);
    const [dateError, setDateError] = useState({ start: false });

    const ticketNames = ["VVIP", "VIP", "Reguler", "Free"];

    const [typeTicket, setTypeTicket] = useState({
        VVIP: false,
        VIP: false,
        Reguler: false,
        Free: false,
    });

    const [uiState, setUiState] = useState({
        checkSpeaker: false,
        checkTicket: false,
        checkDescription: false,
        confirm: false,
        isLoadingSearch: false,
    });

    // Determine if the original thumbnail is a user-uploaded image
    const isOriginalThumbnailUserUpload =
        event?.thumbnail && !event.thumbnail.includes("default-event-images");

    const { data, setData, processing, post } = useForm({
        name: event?.name ?? "",
        description: event?.description ?? "",
        thumbnail: event?.thumbnail ?? null,
        originalThumbnail: event?.thumbnail ?? null, // Track original thumbnail
        isUserUploadedImage: isOriginalThumbnailUserUpload, // Track if original was user upload
        pin: event.pin ? event.pin.split(",").map(Number) : [0.5071, 101.4478],
        location: event?.location ?? "",
        speakers: event?.speakers ?? [],
        event_mode: event?.event_mode ?? "Offline",
        link_meeting: event?.link_meeting ?? "",
        event_date_start: event?.event_date_start ?? null,
        event_date_end:
            event?.event_date_end === event?.event_date_start
                ? null
                : event?.event_date_end,
        tickets:
            event?.tickets?.map((t) => ({
                id: t.id,
                name: t.name,
                price: t.price,
                quota: t.quota,
            })) ?? [],
        ticket_date_start: event?.ticket_date_start ?? null,
        ticket_date_end: event?.ticket_date_end ?? null,
        _method: "put",
    });

    const debounce = useDebounce(data.location, 500);

    const handleAddSpeaker = () => {
        setData("speakers", [
            ...data.speakers,
            { name: "", photo: null, description: "" },
        ]);
    };

    const handleRemoveSpeaker = (index) => {
        const newSpeakers = data.speakers.filter((_, i) => i !== index);
        setData("speakers", newSpeakers);
        if (newSpeakers.length === 0) {
            setUiState((prev) => ({ ...prev, checkSpeaker: false }));
        }
    };

    const handleSwitch = (key, value) => {
        setUiState((prev) => ({ ...prev, [key]: value }));
    };

    const handleSearch = async (query) => {
        handleSwitch("isLoadingSearch", true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${query}`,
                {
                    headers: {
                        "User-Agent": "2255201047@filkom.unilak.ac.id",
                    },
                }
            );
            const data = await res.json();
            if (data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                setData("pin", [lat, lon]);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            handleSwitch("isLoadingSearch", false);
        }
    };

    const submit = async (e) => {
        e.preventDefault();

        setDateError({ start: false });

        if (!formRef.current) {
            console.error("Form ref not found");
            return;
        }

        if (!data.event_date_start) {
            setDateError({ start: true });
            startDateRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
            return;
        }

        const formSubmit = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            if (key === "thumbnail") {
                if (value instanceof File) {
                    formSubmit.append(key, value);
                    // Mark that we're uploading a new file
                    formSubmit.append("thumbnail_changed", "true");
                } else if (
                    typeof value === "string" &&
                    value.startsWith("/default-event-images")
                ) {
                    formSubmit.append(key, value);
                    // Check if we're switching from user upload to default
                    if (
                        data.isUserUploadedImage &&
                        value !== data.originalThumbnail
                    ) {
                        formSubmit.append("delete_old_thumbnail", "true");
                    }
                } else if (typeof value === "string") {
                    formSubmit.append(
                        key,
                        value.replace(/^\/storage\/thumbnails\//, "")
                    );
                }
            } else if (
                key === "originalThumbnail" ||
                key === "isUserUploadedImage"
            ) {
                // Skip these fields, they're for client-side tracking only
                return;
            } else if (Array.isArray(value)) {
                value.forEach((item, idx) => {
                    if (typeof item === "object" && item !== null) {
                        Object.entries(item).forEach(([k, v]) => {
                            const finalValue =
                                k === "price"
                                    ? Number(String(v).replace(/\./g, ""))
                                    : v ?? "";
                            formSubmit.append(
                                `${key}[${idx}][${k}]`,
                                finalValue
                            );
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
            } else if (value instanceof Date) {
                formSubmit.append(key, value.toISOString());
            } else if (value !== null && value !== undefined) {
                formSubmit.append(key, value);
            }
        });

        post(route("events.update", event.id), formSubmit, {
            forceFormData: true,
        });
    };

    useEffect(() => {
        if (event?.speakers?.length > 0) {
            setUiState((prev) => ({ ...prev, checkSpeaker: true }));
        }

        if (event?.tickets?.length > 0) {
            setUiState((prev) => ({ ...prev, checkTicket: true }));

            const ticketStates = {};
            event.tickets.forEach((ticket) => {
                ticketStates[ticket.name] = true;
            });
            setTypeTicket(ticketStates);
        }
    }, []);

    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            setUiState((prev) => ({
                ...prev,
                checkSpeaker: event.speakers.length > 0,
                checkTicket: event.tickets.length > 0,
            }));
            return;
        }

        handleSearch(debounce);
    }, [debounce]);
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Event" />

            <div className="p-4">
                <div className="mb-6 flex items-center">
                    <Link href="/dashboard/events">
                        <Button variant="ghost" className="cursor-pointer">
                            <ArrowLeft />
                        </Button>
                    </Link>
                    <span className="ms-2 text-lg font-semibold">
                        Perbarui Event Anda
                    </span>
                </div>
                <form ref={formRef} onSubmit={submit} className="space-y-4">
                    <div className="grid h-auto w-full grid-cols-1 xl:grid-cols-3 xl:gap-8">
                        <div className="col-span-1 mb-12 flex flex-col justify-center gap-2 xl:justify-normal">
                            <Label
                                htmlFor="thumbnail"
                                className="text-muted-foreground hover:bg-muted mx-auto aspect-square h-auto w-52 cursor-pointer overflow-hidden rounded border shadow hover:shadow-xl xl:h-80 xl:w-full"
                            >
                                {data.thumbnail ? (
                                    typeof data.thumbnail === "string" ? (
                                        <img
                                            src={
                                                data.thumbnail.includes(
                                                    "default-event-images"
                                                )
                                                    ? `${
                                                          ziggy.url
                                                      }/storage/default-event-images/${data.thumbnail.replace(
                                                          "/default-event-images/",
                                                          ""
                                                      )}`
                                                    : `${ziggy.url}/storage/thumbnails/${data.thumbnail}`
                                            }
                                            alt="thumbnail Acara"
                                            className="h-full w-full border object-cover shadow"
                                            onError={handleImageError}
                                        />
                                    ) : (
                                        data.thumbnail instanceof File && (
                                            <img
                                                src={URL.createObjectURL(
                                                    data.thumbnail
                                                )}
                                                alt="thumbnail Acara"
                                                className="h-full w-full border object-cover shadow"
                                            />
                                        )
                                    )
                                ) : (
                                    <div className="flex items-center justify-center h-full w-full bg-gray-200 text-gray-500">
                                        <span className="text-sm">
                                            Gambar tidak tersedia
                                        </span>
                                    </div>
                                )}
                            </Label>
                            <Input
                                id="thumbnail"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setData("thumbnail", file);
                                    }
                                }}
                                className="absolute -z-10 w-12 opacity-0"
                            />
                            <Button
                                type="button"
                                className="mx-auto inline-block w-fit"
                                variant="secondary"
                                onClick={() => {
                                    const randomImage =
                                        getNextImage(adminSettings);
                                    if (randomImage) {
                                        setData(
                                            "thumbnail",
                                            `/default-event-images/${randomImage}`
                                        );
                                    }
                                }}
                            >
                                <Shuffle />
                            </Button>
                        </div>
                        <div className="col-span-2 grid gap-6">
                            <div className="grid gap-2">
                                <Textarea
                                    id="name"
                                    name="name"
                                    placeholder="Judul Event"
                                    rows={1}
                                    className="text-primary/90 w-full resize-none overflow-hidden rounded border-none bg-transparent !p-0 !text-4xl font-semibold shadow-none outline-none focus-visible:border-none focus-visible:ring-0"
                                    onInput={(e) => {
                                        e.currentTarget.style.height = "auto";
                                        e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                                    }}
                                    value={data.name}
                                    onChange={(e) =>
                                        setData("name", e.target.value)
                                    }
                                />
                            </div>
                            <div className="sm:grid sm:grid-cols-5 gap-4">
                                <div className="col-span-4 flex flex-col">
                                    <div className="bg-muted flex items-center justify-between gap-2 rounded-t p-2.5 sm:px-6 md:py-2">
                                        <h5 className="text-sm leading-none font-medium">
                                            Mulai
                                        </h5>
                                        <CalendarWithTime
                                            dateTime={data.event_date_start}
                                            setDateTime={(date) =>
                                                setData(
                                                    "event_date_start",
                                                    date
                                                )
                                            }
                                            className={`w-fit ${
                                                dateError.start
                                                    ? "border-red-500"
                                                    : ""
                                            }`}
                                        />
                                    </div>
                                    <div className="bg-muted flex items-center justify-between gap-2 rounded-b p-2.5 sm:px-6 md:py-2">
                                        <h5 className="text-sm leading-none font-medium">
                                            Selesai
                                        </h5>
                                        <CalendarWithTime
                                            dateTime={data.event_date_end}
                                            setDateTime={(date) =>
                                                setData("event_date_end", date)
                                            }
                                            className="w-fit"
                                            disableDateLeft={
                                                data.event_date_start
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2 w-full mt-3 sm:mt-0">
                                    <div className="grid gap-2">
                                        <Select
                                            name="event_mode"
                                            value={data.event_mode}
                                            onValueChange={(value) => {
                                                setData("event_mode", value);
                                            }}
                                        >
                                            <SelectTrigger className="flex h-full w-full justify-center">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectItem
                                                        value="Offline"
                                                        defaultChecked
                                                    >
                                                        Offline
                                                    </SelectItem>
                                                    <SelectLabel>
                                                        Online
                                                    </SelectLabel>
                                                    <SelectItem value="Google Meet">
                                                        Via Google Meet
                                                    </SelectItem>
                                                    <SelectItem value="Zoom">
                                                        Via Zoom
                                                    </SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">
                                    Perbarui Deskripsi
                                </Label>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() =>
                                        setUiState((prev) => ({
                                            ...prev,
                                            checkDescription: true,
                                        }))
                                    }
                                    className="text-primary/80 inline-block h-auto p-4 text-left w-full"
                                >
                                    <span className="flex items-center gap-2">
                                        <Notebook /> Deskripsi
                                    </span>
                                    <p className="overflow-hidden line-clamp-1 whitespace-pre-wrap">
                                        {data?.description}
                                    </p>
                                </Button>
                                <Modal
                                    show={uiState.checkDescription}
                                    onClose={() =>
                                        setUiState((prev) => ({
                                            ...prev,
                                            checkDescription: false,
                                        }))
                                    }
                                    maxWidth="lg"
                                >
                                    <Card className="w-full ">
                                        <CardHeader>
                                            <CardTitle>
                                                <Label htmlFor="description">
                                                    Deskripsi Event
                                                </Label>
                                            </CardTitle>

                                            <div className="mt-4 space-y-4">
                                                <div className="h-80">
                                                    <Suspense fallback={<div className="p-4 text-center">Loading editor...</div>}>
                                                        <ReactQuill
                                                            theme="snow"
                                                            value={data.description}
                                                            onChange={(content) =>
                                                                setData(
                                                                    "description",
                                                                    content
                                                                )
                                                            }
                                                            placeholder="Masukkan deskripsi..."
                                                            className="h-64"
                                                        />
                                                    </Suspense>
                                                </div>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                </Modal>
                            </div>
                            {data.event_mode === "Offline" ? (
                                <LocationInputWithMap
                                    isEditing={event.id}
                                    location={data.location}
                                    pin={data.pin}
                                    isLoadingSearch={uiState.isLoadingSearch}
                                    onLocationChange={(val) =>
                                        setData("location", val)
                                    }
                                    onPinChange={(coords) =>
                                        setData("pin", coords)
                                    }
                                    setIsLoadingSearch={(val) =>
                                        handleSwitch("isLoadingSearch", val)
                                    }
                                    initialLocationFomDB={event.location}
                                />
                            ) : (
                                <div className="grid gap-2">
                                    <Label htmlFor="linkMeet">
                                        Link {data.event_mode}
                                    </Label>
                                    <Input
                                        id="linkMeet"
                                        type="text"
                                        placeholder={`Link ${data?.event_mode}`}
                                        value={data.link_meeting}
                                        onChange={(e) => {
                                            setData(
                                                "link_meeting",
                                                e.target.value
                                            );
                                        }}
                                        required
                                    />
                                    {uiState.isLoadingSearch && (
                                        <LoaderCircle className="absolute right-2.5 bottom-2.5 h-4 w-4 animate-spin text-gray-300" />
                                    )}
                                </div>
                            )}
                            <div className="grid gap-2 rounded border p-4 shadow-md">
                                <div className="items-left flex flex-col space-x-3 rounded">
                                    <div className="flex w-full items-center justify-between space-x-2">
                                        <Label
                                            htmlFor="speakers"
                                            className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Ada Pemateri/Bintang tamu
                                        </Label>
                                        <Switch
                                            id="speakers"
                                            checked={uiState.checkSpeaker}
                                            onCheckedChange={(checked) => {
                                                handleSwitch(
                                                    "checkSpeaker",
                                                    checked
                                                );
                                                if (checked) {
                                                    if (
                                                        data.speakers.length ===
                                                        0
                                                    ) {
                                                        setData("speakers", [
                                                            {
                                                                name: "",
                                                                photo: null,
                                                                description: "",
                                                            },
                                                        ]);
                                                    }
                                                } else {
                                                    setData("speakers", []);
                                                }
                                            }}
                                        />
                                    </div>
                                    {uiState.checkSpeaker && (
                                        <div className="mt-6 grid gap-6">
                                            {data.speakers.map(
                                                (speaker, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex flex-col gap-2"
                                                    >
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-4">
                                                                <Label
                                                                    htmlFor={`photo-${
                                                                        speaker.id ||
                                                                        index
                                                                    }`}
                                                                    className="text-muted-foreground hover:bg-muted aspect-square w-24 cursor-pointer overflow-hidden rounded-full border  shadow hover:shadow-xl"
                                                                >
                                                                    {data
                                                                        .speakers[
                                                                        index
                                                                    ]?.photo ? (
                                                                        <img
                                                                            src={
                                                                                typeof data
                                                                                    .speakers[
                                                                                    index
                                                                                ]
                                                                                    .photo ===
                                                                                "string"
                                                                                    ? `${ziggy.url}/storage/speakers/${data.speakers[index].photo}`
                                                                                    : URL.createObjectURL(
                                                                                          data
                                                                                              .speakers[
                                                                                              index
                                                                                          ]
                                                                                              .photo
                                                                                      )
                                                                            }
                                                                            alt={`Foto Pemateri ${
                                                                                index +
                                                                                1
                                                                            }`}
                                                                            className="h-full w-full border object-cover shadow"
                                                                        />
                                                                    ) : (
                                                                        <div className="flex h-full w-full items-center justify-center text-2xl text-gray-400">
                                                                            +
                                                                        </div>
                                                                    )}
                                                                </Label>

                                                                <div className="flex flex-col w-full gap-2">
                                                                    <Input
                                                                        id={`photo-${
                                                                            speaker.id ||
                                                                            index
                                                                        }`}
                                                                        accept="image/*"
                                                                        type="file"
                                                                        onChange={(
                                                                            e
                                                                        ) => {
                                                                            const file =
                                                                                e
                                                                                    .target
                                                                                    .files?.[0];
                                                                            if (
                                                                                file
                                                                            ) {
                                                                                const newSpeakers =
                                                                                    [
                                                                                        ...data.speakers,
                                                                                    ];
                                                                                newSpeakers[
                                                                                    index
                                                                                ].photo =
                                                                                    file;
                                                                                setData(
                                                                                    "speakers",
                                                                                    newSpeakers
                                                                                );
                                                                            }
                                                                        }}
                                                                        className="absolute -z-10 w-12 opacity-0"
                                                                        required={
                                                                            !data
                                                                                .speakers[
                                                                                index
                                                                            ]
                                                                                ?.photo
                                                                        }
                                                                    />
                                                                    <div className="flex items-center gap-2">
                                                                        <Input
                                                                            type="text"
                                                                            placeholder={`Nama Pemateri`}
                                                                            value={
                                                                                speaker.name
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) => {
                                                                                const newSpeakers =
                                                                                    [
                                                                                        ...data.speakers,
                                                                                    ];
                                                                                newSpeakers[
                                                                                    index
                                                                                ].name =
                                                                                    e.target.value;
                                                                                setData(
                                                                                    "speakers",
                                                                                    newSpeakers
                                                                                );
                                                                            }}
                                                                            required
                                                                        />
                                                                        <Button
                                                                            type="button"
                                                                            variant="destructive"
                                                                            onClick={() =>
                                                                                handleRemoveSpeaker(
                                                                                    index
                                                                                )
                                                                            }
                                                                        >
                                                                            <Trash2 />
                                                                        </Button>
                                                                    </div>
                                                                    <Input
                                                                        type="text"
                                                                        placeholder={`Pangkat`}
                                                                        value={
                                                                            speaker.description
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) => {
                                                                            const newSpeakers =
                                                                                [
                                                                                    ...data.speakers,
                                                                                ];
                                                                            newSpeakers[
                                                                                index
                                                                            ].description =
                                                                                e.target.value;
                                                                            setData(
                                                                                "speakers",
                                                                                newSpeakers
                                                                            );
                                                                        }}
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                className="h-8 w-8 cursor-pointer rounded-full"
                                                onClick={handleAddSpeaker}
                                            >
                                                <Plus />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid gap-6 rounded border p-4 shadow-md">
                                <div className="items-left flex flex-col space-x-3 rounded ">
                                    <div className="flex w-full items-center justify-between space-x-2">
                                        <Label
                                            htmlFor="ticket"
                                            className="leading-none font-medium"
                                        >
                                            Custom tiket
                                        </Label>
                                        <Switch
                                            id="ticket"
                                            checked={uiState.checkTicket}
                                            onCheckedChange={(checked) => {
                                                setUiState((prev) => ({
                                                    ...prev,
                                                    checkTicket: checked,
                                                }));
                                                if (!uiState.checkTicket) {
                                                    setData("tickets", []);
                                                    setTypeTicket({
                                                        VVIP: false,
                                                        VIP: false,
                                                        Reguler: false,
                                                        Free: false,
                                                    });
                                                }
                                            }}
                                        />
                                    </div>

                                    {flash?.warnings && (
                                        <Alert className="mb-4 border-yellow-600">
                                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                            <AlertTitle className="text-yellow-600">
                                                Peringatan Perubahan Tiket
                                            </AlertTitle>
                                            <AlertDescription>
                                                <ul className="list-disc pl-4 space-y-1 text-sm text-yellow-600">
                                                    {flash.warnings.map(
                                                        (warning, index) => (
                                                            <li key={index}>
                                                                {warning}
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {uiState.checkTicket && (
                                        <div className="mt-6 flex flex-col gap-4">
                                            <div className="flex flex-col gap-6">
                                                {ticketNames.map(
                                                    (ticketName) => {
                                                        const ticketData =
                                                            data.tickets.find(
                                                                (t) =>
                                                                    t.name ===
                                                                    ticketName
                                                            );
                                                        const isChecked =
                                                            typeTicket[
                                                                ticketName
                                                            ];

                                                        return (
                                                            <div
                                                                key={ticketName}
                                                                className="grid h-fit basis-1/3 gap-4 space-y-2 rounded-md border p-4 shadow transition duration-500"
                                                            >
                                                                <div className="flex gap-2">
                                                                    <Checkbox
                                                                        checked={
                                                                            isChecked
                                                                        }
                                                                        onCheckedChange={(
                                                                            checked
                                                                        ) => {
                                                                            const newChecked =
                                                                                Boolean(
                                                                                    checked
                                                                                );
                                                                            setTypeTicket(
                                                                                {
                                                                                    ...typeTicket,
                                                                                    [ticketName]:
                                                                                        newChecked,
                                                                                }
                                                                            );

                                                                            if (
                                                                                newChecked
                                                                            ) {
                                                                                const existingTicket =
                                                                                    event?.tickets?.find(
                                                                                        (
                                                                                            t
                                                                                        ) =>
                                                                                            t.name ===
                                                                                            ticketName
                                                                                    );

                                                                                const alreadyInData =
                                                                                    data.tickets.find(
                                                                                        (
                                                                                            t
                                                                                        ) =>
                                                                                            t.name ===
                                                                                            ticketName
                                                                                    );

                                                                                if (
                                                                                    !alreadyInData
                                                                                ) {
                                                                                    setData(
                                                                                        "tickets",
                                                                                        [
                                                                                            ...data.tickets,
                                                                                            {
                                                                                                id: existingTicket?.id,
                                                                                                name: ticketName,
                                                                                                price:
                                                                                                    existingTicket?.price ||
                                                                                                    0,
                                                                                                quota:
                                                                                                    existingTicket?.quota ||
                                                                                                    0,
                                                                                            },
                                                                                        ]
                                                                                    );
                                                                                }
                                                                            } else {
                                                                                setData(
                                                                                    "tickets",
                                                                                    data.tickets.filter(
                                                                                        (
                                                                                            ticket
                                                                                        ) =>
                                                                                            ticket.name !==
                                                                                            ticketName
                                                                                    )
                                                                                );
                                                                            }
                                                                        }}
                                                                    />
                                                                    <Label>
                                                                        {
                                                                            ticketName
                                                                        }
                                                                    </Label>
                                                                </div>

                                                                {isChecked && (
                                                                    <>
                                                                        <div className="flex w-full flex-col gap-2">
                                                                            {ticketName ==
                                                                            "Free" ? (
                                                                                <Badge
                                                                                    className="w-fit"
                                                                                    variant="secondary"
                                                                                >
                                                                                    Harga
                                                                                    Tiket
                                                                                    Gratis
                                                                                </Badge>
                                                                            ) : (
                                                                                <>
                                                                                    <Label
                                                                                        htmlFor={`harga-${ticketName}`}
                                                                                    >
                                                                                        Harga
                                                                                    </Label>
                                                                                    <div className="relative">
                                                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm ">
                                                                                            Rp.
                                                                                        </span>

                                                                                        <Input
                                                                                            type="text"
                                                                                            id={`harga-${ticketName}`}
                                                                                            placeholder="Harga Tiket"
                                                                                            value={
                                                                                                ticketData?.price ===
                                                                                                0
                                                                                                    ? ""
                                                                                                    : formatRupiahInput(
                                                                                                          ticketData?.price
                                                                                                      )
                                                                                            }
                                                                                            onChange={(
                                                                                                e
                                                                                            ) => {
                                                                                                const val =
                                                                                                    e
                                                                                                        .target
                                                                                                        .value;
                                                                                                setData(
                                                                                                    "tickets",
                                                                                                    data.tickets.map(
                                                                                                        (
                                                                                                            ticket
                                                                                                        ) =>
                                                                                                            ticket.name ===
                                                                                                            ticketName
                                                                                                                ? {
                                                                                                                      ...ticket,
                                                                                                                      price:
                                                                                                                          val ===
                                                                                                                          ""
                                                                                                                              ? 0
                                                                                                                              : formatRupiahInput(
                                                                                                                                    val
                                                                                                                                ),
                                                                                                                  }
                                                                                                                : ticket
                                                                                                    )
                                                                                                );
                                                                                            }}
                                                                                            className="pl-10 bg-background text-foreground appearance-none 
                                                                                                                                                                                                           [&::-webkit-outer-spin-button]:appearance-none 
                                                                                                                                                                                                           [&::-webkit-inner-spin-button]:appearance-none"
                                                                                            required
                                                                                        />
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                        </div>

                                                                        <div className="flex w-full flex-col gap-2">
                                                                            <Label
                                                                                htmlFor={`quota-${ticketName}`}
                                                                            >
                                                                                Jumlah
                                                                                Tiket
                                                                            </Label>
                                                                            <Input
                                                                                id={`quota-${ticketName}`}
                                                                                type="number"
                                                                                className="bg-background text-foreground appearance-none 
                                                                                                                            [&::-webkit-outer-spin-button]:appearance-none 
                                                                                                                            [&::-webkit-inner-spin-button]:appearance-none"
                                                                                placeholder="Batas Jumlah Tiket"
                                                                                value={
                                                                                    ticketData?.quota ===
                                                                                    0
                                                                                        ? ""
                                                                                        : ticketData?.quota
                                                                                }
                                                                                onChange={(
                                                                                    e
                                                                                ) => {
                                                                                    const val =
                                                                                        e
                                                                                            .target
                                                                                            .value;
                                                                                    setData(
                                                                                        "tickets",
                                                                                        data.tickets.map(
                                                                                            (
                                                                                                ticket
                                                                                            ) =>
                                                                                                ticket.name ===
                                                                                                ticketName
                                                                                                    ? {
                                                                                                          ...ticket,
                                                                                                          quota:
                                                                                                              val ===
                                                                                                              ""
                                                                                                                  ? 0
                                                                                                                  : Number(
                                                                                                                        val
                                                                                                                    ),
                                                                                                      }
                                                                                                    : ticket
                                                                                        )
                                                                                    );
                                                                                }}
                                                                                onWheel={(
                                                                                    e
                                                                                ) =>
                                                                                    e.target.blur()
                                                                                }
                                                                                required
                                                                            />
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                )}
                                            </div>
                                            <div className="grid max-w-full gap-2 border-t py-4">
                                                <Label className="mb-2">
                                                    Batas Jual Tiket
                                                </Label>
                                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                                    <div className="grid gap-2">
                                                        <div className="flex items-center gap-1">
                                                            <h5 className="text-muted-foreground text-sm">
                                                                Tiket mulai jual
                                                            </h5>
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger className="bg-primary h-3.5 w-3.5 rounded-full text-xs text-white">
                                                                        !
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>
                                                                            Jika
                                                                            tidak
                                                                            isi
                                                                            akan
                                                                            dijual
                                                                            sekarang
                                                                        </p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </div>

                                                        <CalendarWithTime
                                                            dateTime={
                                                                data.ticket_date_start
                                                            }
                                                            setDateTime={(
                                                                date
                                                            ) =>
                                                                setData(
                                                                    "ticket_date_start",
                                                                    date
                                                                )
                                                            }
                                                            disableDateRight={
                                                                data.ticket_date_end ??
                                                                data.event_date_start
                                                            }
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <div className="flex items-center gap-1">
                                                            <h5 className="text-muted-foreground text-sm">
                                                                Tiket selesai
                                                                jual
                                                            </h5>{" "}
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger className="bg-primary h-3.5 w-3.5 rounded-full text-xs text-white">
                                                                        !
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>
                                                                            Jika
                                                                            tidak
                                                                            isi
                                                                            akan
                                                                            mengikuti
                                                                            tanggal
                                                                            acara
                                                                            mulai
                                                                        </p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </div>
                                                        <CalendarWithTime
                                                            dateTime={
                                                                data.ticket_date_end
                                                            }
                                                            setDateTime={(
                                                                date
                                                            ) =>
                                                                setData(
                                                                    "ticket_date_end",
                                                                    date
                                                                )
                                                            }
                                                            disableDateLeft={
                                                                data.ticket_date_start
                                                            }
                                                            disableDateRight={
                                                                data.event_date_start
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-end gap-4">
                                <Link href="/dashboard/events">
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
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
