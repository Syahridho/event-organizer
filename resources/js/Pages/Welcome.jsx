import { Head, Link, usePage, router } from "@inertiajs/react";
import { useRef, useState, useCallback, useMemo } from "react";
import {
    LogOut,
    AlignJustify,
    Search,
    ChevronRight,
    MapPin,
    Calendar,
    Star,
} from "lucide-react";
import { IoCart, IoPersonCircle } from "react-icons/io5";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Rating from "react-rating";
import { IoTicket } from "react-icons/io5";
import { FaBuilding, FaStar, FaRegStar } from "react-icons/fa";
import { GiMicrophone } from "react-icons/gi";
import { GrFanOption } from "react-icons/gr";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import Footer from "@/components/footer";
import { formatRupiah } from "@/Utils/formatRupiah";
import MainLayout from "@/Layouts/Main";

const navLinks = [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Mitra", href: "#partner" },
];

const mobileMenuItems = [
    {
        label: "Tiket",
        href: "#tickets",
        icon: IoTicket,
        description: "Event & Konser",
    },
    {
        label: "Jasa",
        href: "#services",
        icon: GiMicrophone,
        description: "Vendor Profesional",
    },
    {
        label: "Gedung",
        href: "#buildings",
        icon: FaBuilding,
        description: "Venue & Tempat",
    },
    {
        label: "Property",
        href: "#properties",
        icon: GrFanOption,
        description: "Perlengkapan Acara",
    },
];

const testimonials = [
    {
        name: "Syahridho Arjuna Syahputra",
        role: "Programmer",
        image: "https://picsum.photos/300/300?random=1",
        rating: 4,
        message:
            "Pesan tiket konser di Eventnusa sangat mudah dan cepat. Tidak perlu antre panjang, tinggal klik langsung dapat e-tiket. Mantap!",
    },
    {
        name: "Sheila Putri",
        role: "Content Creator",
        image: "https://picsum.photos/300/300?random=2",
        rating: 5,
        message:
            "Gedung yang saya sewa bersih dan nyaman. Proses booking juga cepat banget!",
    },
    {
        name: "Adit Rahman",
        role: "Wedding Organizer",
        image: "https://picsum.photos/300/300?random=3",
        rating: 5,
        message:
            "Layanan vendor sangat profesional. Properti pesta lengkap dan harga transparan!",
    },
];

// Komponen LazyImage yang telah diperbaiki
const LazyImage = ({ src, alt, className, onLoad, onError, ...props }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    const handleLoad = useCallback(() => {
        setLoaded(true);
        onLoad?.();
    }, [onLoad]);

    const handleError = useCallback(() => {
        setError(true);
        setLoaded(true);
        onError?.();
    }, [onError]);

    return (
        <div className="relative overflow-hidden rounded-lg">
            {!loaded && <Skeleton className={className} />}
            <img
                src={src}
                alt={alt}
                className={`${className} transition-all duration-500 ${
                    loaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
                } ${loaded ? "" : "absolute inset-0"}`}
                onLoad={handleLoad}
                onError={handleError}
                loading="lazy"
                {...props}
            />
        </div>
    );
};

// Komponen ItemCard yang diperbaiki dengan shadcn Card
const ItemCard = ({ item, type, baseUrl }) => {
    const getImageUrl = useCallback(() => {
        if (type === "events") {
            return item.thumbnail.includes("randoms")
                ? `${baseUrl}/storage${item.thumbnail}`
                : `${baseUrl}/storage/thumbnails/${item.thumbnail}`;
        }
        return `${baseUrl}/storage/thumbnails/${item.thumbnail}`;
    }, [item.thumbnail, type, baseUrl]);

    const getPriceDisplay = useCallback(() => {
        switch (type) {
            case "events":
                if (item.tickets?.length > 0 && item.tickets[0].price) {
                    return `Mulai dari Rp ${item.tickets[0].price.toLocaleString()}`;
                }
                return "Gratis";
            case "services":
                return `Rp ${formatRupiah(item.price)}`;
            case "buildings":
            case "propertys":
                return `Rp ${formatRupiah(item.price)}/Hari`;
            default:
                return "";
        }
    }, [item, type]);

    const getHref = useCallback(() => {
        const path = type === "propertys" ? "properties" : type;
        return `/${path}/${item.id}`;
    }, [type, item.id]);

    const getTitle = useCallback(() => {
        switch (type) {
            case "events":
                return "Event";
            case "services":
                return "Jasa";
            case "buildings":
                return "Gedung";
            case "propertys":
                return "Property";
            default:
                return "Event";
        }
    }, [type]);

    return (
        <Link href={getHref()}>
            <Card className="group w-72 flex-shrink-0 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-border/50 bg-card">
                <CardHeader className="p-0">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
                        <LazyImage
                            src={getImageUrl()}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <Badge
                            variant="secondary"
                            className="absolute top-3 right-3 capitalize font-medium"
                        >
                            {getTitle(type)}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold text-lg line-clamp-2 capitalize text-card-foreground group-hover:text-primary transition-colors">
                        {item.name}
                    </h3>
                    <div className="flex items-center text-muted-foreground text-sm">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{item.location}</span>
                    </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                    <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-lg text-primary">
                            {getPriceDisplay()}
                        </span>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
                    </div>
                </CardFooter>
            </Card>
        </Link>
    );
};

// Komponen CategorySection yang diperbaiki
const CategorySection = ({ title, items, type, baseUrl, id }) => {
    return (
        <section id={id} className="py-16 bg-background">
            <div className="container mx-auto max-w-7xl px-4 md:px-6">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                            {title}
                        </h2>
                        <p className="text-muted-foreground text-lg">
                            Pilihan terbaik untuk kebutuhan Anda
                        </p>
                    </div>
                    {/* 3. Tombol diperbaiki di sini */}
                    <Link
                        className="hidden md:flex items-center gap-2"
                        href={route("listings.show", { type: id })}
                    >
                        Lihat Semua
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                <ScrollArea className="w-full">
                    <div className="flex space-x-6 py-2">
                        {items.length > 0 ? (
                            items.map((item, index) => (
                                <ItemCard
                                    key={`${type}-${index}`}
                                    item={item}
                                    type={type}
                                    baseUrl={baseUrl}
                                />
                            ))
                        ) : (
                            <Card className="w-full py-16">
                                <CardContent className="text-center">
                                    <p className="text-muted-foreground text-lg">
                                        Tidak ada {title.toLowerCase()} yang
                                        ditemukan
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="mt-4"
                                        onClick={() => window.location.reload()}
                                    >
                                        Muat Ulang
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    <ScrollBar orientation="horizontal" className="mt-4" />
                </ScrollArea>
            </div>
        </section>
    );
};

// Komponen TestimonialSection yang diperbaiki
function TestimonialSection() {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const handleNext = useCallback(() => {
        setSelectedIndex((prev) => (prev + 1) % testimonials.length);
    }, []);

    const selectedTestimonial = useMemo(
        () => testimonials[selectedIndex],
        [selectedIndex]
    );

    return (
        <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            <div className="container mx-auto max-w-7xl px-4 md:px-6">
                <Tabs defaultValue="testimoni" className="w-full">
                    <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 h-12">
                        <TabsTrigger
                            value="testimoni"
                            className="text-sm font-medium"
                        >
                            Testimoni
                        </TabsTrigger>
                        <TabsTrigger
                            value="tentang"
                            className="text-sm font-medium"
                        >
                            Tentang
                        </TabsTrigger>
                        <TabsTrigger
                            value="gabung"
                            className="text-sm font-medium"
                        >
                            Bergabung
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="testimoni" className="mt-12">
                        <div className="grid lg:grid-cols-2 gap-12 items-start">
                            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-6">
                                {testimonials.map((user, idx) => (
                                    <Card
                                        key={idx}
                                        className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                                            selectedIndex === idx
                                                ? "ring-2 ring-primary shadow-lg scale-105"
                                                : "hover:shadow-md"
                                        }`}
                                        onClick={() => setSelectedIndex(idx)}
                                    >
                                        <CardContent className="p-6 text-center space-y-4">
                                            <Avatar className="w-16 h-16 mx-auto">
                                                <AvatarImage
                                                    src={`${user.image}&random=${idx}`}
                                                    alt={user.name}
                                                />
                                                <AvatarFallback>
                                                    {user.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="font-semibold text-foreground line-clamp-1">
                                                    {user.name}
                                                </h3>
                                                <p className="text-sm text-muted-foreground line-clamp-1">
                                                    {user.role}
                                                </p>
                                            </div>
                                            <Rating
                                                initialRating={user.rating}
                                                emptySymbol={
                                                    <Star className="w-4 h-4 text-muted fill-muted" />
                                                }
                                                fullSymbol={
                                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                }
                                                readonly
                                            />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <Card className="lg:sticky lg:top-8">
                                <CardHeader>
                                    <div className="w-12 h-1 bg-primary rounded-full mb-2" />
                                    <h3 className="text-2xl font-bold text-card-foreground">
                                        {selectedTestimonial.name}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {selectedTestimonial.role}
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <blockquote className="text-lg leading-relaxed text-muted-foreground border-l-4 border-primary pl-4 italic">
                                        "{selectedTestimonial.message}"
                                    </blockquote>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        variant="ghost"
                                        onClick={handleNext}
                                        className="p-0 text-primary hover:text-primary/80"
                                    >
                                        Testimoni Selanjutnya
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="tentang" className="mt-12">
                        <Card className="max-w-4xl mx-auto">
                            <CardHeader>
                                <h3 className="text-3xl font-bold text-card-foreground">
                                    Tentang Eventnusa
                                </h3>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <p className="text-lg leading-relaxed text-muted-foreground">
                                    Sistem digital yang terintegrasi dapat
                                    menjembatani kesenjangan antara Event
                                    Organizer (EO), peserta acara, serta
                                    penyedia venue dan vendor.
                                </p>
                                <p className="text-lg leading-relaxed text-muted-foreground">
                                    Eventnusa hadir sebagai solusi komprehensif
                                    yang tidak hanya memfasilitasi penjualan
                                    tiket secara efisien, tetapi juga
                                    mengintegrasikan platform pencarian dan
                                    pemesanan venue, jasa, dan produk pendukung
                                    acara dalam satu ekosistem digital yang
                                    mudah digunakan.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="gabung" className="mt-12">
                        <Card className="max-w-4xl mx-auto text-center">
                            <CardHeader className="space-y-4">
                                <h3 className="text-3xl font-bold text-card-foreground">
                                    Bergabung dengan Kami
                                </h3>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Jadilah bagian dari ekosistem event terbesar
                                    di Indonesia. Tingkatkan bisnis Anda dengan
                                    bergabung sebagai mitra Eventnusa dan
                                    jangkau lebih banyak customer.
                                </p>
                            </CardHeader>
                            <CardFooter className="justify-center">
                                <Button size="lg" className="px-8 py-3">
                                    Daftar Sebagai Mitra
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </section>
    );
}

export default function Welcome() {
    const { auth, ziggy, events, buildings, services, propertys } =
        usePage().props;
    const sheetCloseRef = useRef();
    const [searchQuery, setSearchQuery] = useState("");

    const handleLogout = useCallback(() => {
        router.post(
            "/logout",
            {},
            {
                onSuccess: () => {
                    sheetCloseRef.current?.click();
                },
            }
        );
    }, []);

    const handleNavigation = useCallback((path) => {
        router.visit(path);
    }, []);

    const handleSearch = useCallback(
        (e) => {
            e.preventDefault();
            if (searchQuery.trim()) {
                router.visit(`/search?q=${encodeURIComponent(searchQuery)}`);
            }
        },
        [searchQuery]
    );

    const AuthButtons = () => (
        <div className="flex gap-3 items-center">
            {auth.user ? (
                <>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route("cart.index")}>
                            <IoCart className="w-5 h-5" />
                        </Link>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hidden md:flex"
                            >
                                <IoPersonCircle className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="capitalize">
                                {auth.user.name}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => handleNavigation("/profile")}
                            >
                                Profil
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleNavigation("/purchase")}
                            >
                                Pesanan Saya
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Keluar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>
            ) : (
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleNavigation("/login")}
                    >
                        Masuk
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => handleNavigation("/register")}
                    >
                        Daftar
                    </Button>
                </div>
            )}
        </div>
    );

    const MobileSheet = () => (
        <Sheet>
            <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                    <AlignJustify className="w-5 h-5" />
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 mt-6">
                    {mobileMenuItems.map((item, idx) => {
                        const IconComponent = item.icon;
                        return (
                            <Button
                                key={idx}
                                variant="ghost"
                                className="justify-start h-auto p-4"
                                asChild
                            >
                                <Link href={item.href}>
                                    <IconComponent className="w-5 h-5 mr-3" />
                                    <div className="text-left">
                                        <div className="font-medium">
                                            {item.label}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {item.description}
                                        </div>
                                    </div>
                                </Link>
                            </Button>
                        );
                    })}
                </div>
                {auth.user && (
                    <>
                        <Separator className="my-4" />
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Keluar
                        </Button>
                    </>
                )}
                <SheetClose asChild>
                    <button ref={sheetCloseRef} className="hidden" />
                </SheetClose>
            </SheetContent>
        </Sheet>
    );

    return (
        <div className="bg-background min-h-screen">
            <Head title="Eventnusa - Solusi Digital untuk Event Organizer" />
            {/* Hero Section */}
            <section
                id="home"
                className="relative min-h-screen bg-cover bg-center flex items-center"
                style={{ backgroundImage: `url('${ziggy.url}/hero.jpg')` }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-secondary/90" />

                <div className="container mx-auto px-4 md:px-6 relative z-10 text-center text-primary-foreground">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <Badge variant="secondary" className="mb-4">
                            🎉 Platform Event Terlengkap di Indonesia
                        </Badge>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight">
                            Temukan & Kelola
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-accent">
                                Acara Impianmu
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl font-medium opacity-90 max-w-2xl mx-auto">
                            Solusi Digital untuk Kolaborasi Event Organizer dan
                            vendor lokal terpercaya
                        </p>
                    </div>
                </div>
            </section>
            {/* Quick Categories */}
            <section className="relative -mt-20 z-20 pb-20">
                <div className="container mx-auto max-w-6xl px-4 md:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {mobileMenuItems.map((item, idx) => {
                            const IconComponent = item.icon;
                            return (
                                <Card
                                    key={idx}
                                    className="group cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 border-border/50"
                                    asChild
                                >
                                    <Link href={item.href}>
                                        <CardContent className="p-6 text-center space-y-4">
                                            <div className="bg-gradient-to-br from-primary to-secondary w-16 h-16 rounded-2xl mx-auto flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                                <IconComponent className="w-8 h-8 text-primary-foreground" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
                                                    {item.label}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Link>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>
            <div className="flex-1 container mx-auto px-4 py-6">
                {/* Content Sections */}
                <CategorySection
                    id="events"
                    title="Acara yang Sedang Populer"
                    items={events}
                    type="events"
                    baseUrl={ziggy.url}
                />

                <div className="bg-secondary/5">
                    <CategorySection
                        id="services"
                        title="Andalan Utama dan Terbukti Efektif"
                        items={services}
                        type="services"
                        baseUrl={ziggy.url}
                    />
                </div>

                <CategorySection
                    id="buildings"
                    title="Sewa Lokasi dan Solusi Teruji"
                    items={buildings}
                    type="buildings"
                    baseUrl={ziggy.url}
                />

                <div className="bg-secondary/5">
                    <CategorySection
                        id="properties"
                        title="Solusi Sewa Perlengkapan Acara"
                        items={propertys}
                        type="propertys"
                        baseUrl={ziggy.url}
                    />
                </div>

                {/* Testimonial Section */}
                <TestimonialSection />

                {/* CTA Section */}
                <section className="py-20 ">
                    <div className="container mx-auto max-w-4xl text-center px-4 md:px-6">
                        <Card className="border-0 bg-slate-800 backdrop-blur-sm">
                            <CardContent className="p-12 space-y-6">
                                <Badge variant="secondary" className="mb-4">
                                    🚀 Bergabung Sekarang
                                </Badge>
                                <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
                                    Siap Bergabung dengan Kami?
                                </h2>
                                <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
                                    Jadilah mitra Eventnusa dan tingkatkan
                                    bisnis event Anda ke level selanjutnya
                                    dengan jangkauan yang lebih luas
                                </p>
                                <Button
                                    size="lg"
                                    variant="secondary"
                                    className="px-8 py-4 text-lg font-semibold"
                                    onClick={() =>
                                        handleNavigation("/partner/register")
                                    }
                                >
                                    Daftar Sebagai Mitra
                                    <ChevronRight className="ml-2 w-5 h-5" />
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </div>
        </div>
    );
}

Welcome.layout = (page) => <MainLayout>{page}</MainLayout>;
