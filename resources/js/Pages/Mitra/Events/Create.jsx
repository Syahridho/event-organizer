import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppLayout from "@/Layouts/App/AppSidebarLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import {
    ArrowLeft,
    Loader2,
    LoaderCircle,
    Shuffle,
    Notebook,
    Plus,
    Trash2,
} from "lucide-react";
import { getNextImage } from "@/features/randomImage";
import { Textarea } from "@/components/ui/textarea";
import CalendarWithTime from "@/components/CalenderWithTime";
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
import ReactQuill from "react-quill";
import "quill/dist/quill.snow.css";

const breadcrumbs = [
    {
        title: "Dashboard",
        href: "/dashboard",
    },
    {
        title: "Event",
        href: "/dashboard/event",
    },
    {
        title: "Tambahkan",
        href: "/dashboard/event/create",
    },
];

export default function CreateEvent() {
    const { ziggy } = usePage().props;
    const formRef = useRef(null);

    const startDateRef = useRef(null);
    const [dateError, setDateError] = useState({ start: false });

    const ticketNames = ["VVIP", "VIP", "Reguler", "Free"];

    const [typeTicket, setTypeTicket] = useState({
        VVIP: false,
        VIP: false,
        Reguler: false,
    });

    const [uiState, setUiState] = useState({
        checkSpeaker: false,
        checkTicket: false,
        checkDescription: false,
        confirm: false,
        isLoadingSearch: false,
    });

    const { data, setData, post, processing } = useForm({
        name: "",
        description: "",
        thumbnail: "/randoms/1.webp",
        pin: [0.5071, 101.4478],
        location: "",
        speakers: [],
        event_mode: "Offline",
        link_meeting: "",
        event_date_start: null,
        event_date_end: null,
        tickets: [],
        ticket_date_start: null,
        ticket_date_end: null,
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
            setDateError({
                start: true,
            });
            startDateRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
            return;
        }

        const formSubmit = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach((item, idx) => {
                    if (typeof item === "object" && item !== null) {
                        Object.entries(item).forEach(([k, v]) => {
                            const finalValue =
                                k === "price"
                                    ? Number(String(v).replace(/\./g, ""))
                                    : v ?? "";
                            console.log(finalValue);
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

        console.table([...formSubmit.entries()]);

        post(route("events.store"), formSubmit, {
            forceFormData: true,
        });
    };

    useEffect(() => {
        if (data.location != "") {
            handleSearch(debounce);
        }
    }, [debounce]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Event" />

            <div className="p-4">
                <div className="mb-6 flex items-center">
                    <Link href="/dashboard/event">
                        <Button variant="ghost" className="cursor-pointer">
                            <ArrowLeft />
                        </Button>
                    </Link>
                    <span className="ms-2 text-lg font-semibold">
                        Tambahkan Event Anda
                    </span>
                </div>
                <form ref={formRef} onSubmit={submit} className="space-y-4">
                    <div className="grid h-auto w-full grid-cols-1 xl:grid-cols-3 xl:gap-8">
                        <div className="col-span-1 mb-12 flex flex-col justify-center gap-2 xl:justify-normal">
                            <Label
                                htmlFor="thumbnail"
                                className="text-muted-foreground hover:bg-muted mx-auto aspect-square h-auto w-52 cursor-pointer overflow-hidden rounded border shadow hover:shadow-xl xl:h-80 xl:w-full"
                            >
                                {data.thumbnail && (
                                    <img
                                        src={
                                            typeof data.thumbnail === "string"
                                                ? `${ziggy.url}/storage${data.thumbnail}`
                                                : URL.createObjectURL(
                                                      data.thumbnail
                                                  )
                                        }
                                        alt="Thumbnail Acara"
                                        className="h-full w-full border object-cover shadow"
                                    />
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
                                    const randomImage = getNextImage();
                                    setData(
                                        "thumbnail",
                                        `/randoms/${randomImage}`
                                    );
                                }}
                            >
                                <Shuffle />
                            </Button>
                        </div>
                        <div className="col-span-2 grid gap-6">
                            <div className="grid gap-2">
                                <Textarea
                                    id="title"
                                    name="title"
                                    placeholder="Judul Event"
                                    required
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
                                    Tambahkan Deskripsi
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
                                    className="text-primary/80 block h-auto p-4 text-left"
                                >
                                    <span className="flex items-center gap-2">
                                        <Notebook /> Deskripsi
                                    </span>
                                </Button>

                                {uiState.checkDescription && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                                            onClick={() =>
                                                setUiState((prev) => ({
                                                    ...prev,
                                                    checkDescription: false,
                                                }))
                                            }
                                        />

                                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                                            <Card className="w-full max-w-2xl max-h-[85vh] overflow-hidden pointer-events-auto">
                                                <CardHeader className="pb-4">
                                                    <div className="flex items-center justify-between">
                                                        <CardTitle className="text-lg">
                                                            Deskripsi Event
                                                        </CardTitle>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                setUiState(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        checkDescription: false,
                                                                    })
                                                                )
                                                            }
                                                            className="h-8 w-8 p-0 hover:bg-gray-100"
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>

                                                    <div className="mt-4 space-y-4">
                                                        <div className="h-80">
                                                            <ReactQuill
                                                                theme="snow"
                                                                value={
                                                                    data.description
                                                                }
                                                                onChange={(
                                                                    content
                                                                ) =>
                                                                    setData(
                                                                        "description",
                                                                        content
                                                                    )
                                                                }
                                                                placeholder="Masukkan deskripsi..."
                                                                className="h-64"
                                                            />
                                                        </div>

                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    setUiState(
                                                                        (
                                                                            prev
                                                                        ) => ({
                                                                            ...prev,
                                                                            checkDescription: false,
                                                                        })
                                                                    )
                                                                }
                                                            >
                                                                Batal
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                onClick={() =>
                                                                    setUiState(
                                                                        (
                                                                            prev
                                                                        ) => ({
                                                                            ...prev,
                                                                            checkDescription: false,
                                                                        })
                                                                    )
                                                                }
                                                            >
                                                                Simpan
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                            </Card>
                                        </div>
                                    </>
                                )}
                            </div>
                            {data.event_mode === "Offline" ? (
                                <LocationInputWithMap
                                    isEditing={false}
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
                                                                    htmlFor={`photo-${index}`}
                                                                    className="text-muted-foreground hover:bg-muted aspect-square w-24 cursor-pointer overflow-hidden rounded-full border  shadow hover:shadow-xl"
                                                                >
                                                                    {data
                                                                        .speakers[
                                                                        index
                                                                    ].photo ? (
                                                                        <img
                                                                            src={URL.createObjectURL(
                                                                                data
                                                                                    .speakers[
                                                                                    index
                                                                                ]
                                                                                    .photo
                                                                            )}
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

                                                                <div className="flex w-full flex-col gap-2">
                                                                    <Input
                                                                        id={`photo-${index}`}
                                                                        type="file"
                                                                        required
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
                                                    });
                                                }
                                            }}
                                        />
                                    </div>

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
                                                                                setData(
                                                                                    "tickets",
                                                                                    [
                                                                                        ...data.tickets,
                                                                                        {
                                                                                            name: ticketName,
                                                                                            price: 0,
                                                                                            quota: 0,
                                                                                        },
                                                                                    ]
                                                                                );
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
                                                                                                ticketData?.price
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
                                                                                type="text"
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
                                        "Simpan"
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
