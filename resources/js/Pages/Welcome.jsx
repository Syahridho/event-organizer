import { Head, Link, usePage, router } from "@inertiajs/react";
import { useRef, useState, useCallback, useMemo } from "react";
import {
    LogOut,
    AlignJustify,
    ChevronRight,
    Star,
} from "lucide-react";

// Use optimized Icon component instead of direct imports
import {
    IoCart,
    IoPersonCircle,
    IoTicket,
    FaBuilding,
    GiMicrophone,
    GrFanOption,
} from "@/components/Icon";

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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Rating from "react-rating";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import MainLayout from "@/Layouts/Main";

// Import new components
import CategorySection from "@/Components/Welcome/CategorySection";
import MobileMenu from "@/Components/Welcome/MobileMenu";

const mobileMenuItems = [
    {
        label: "Tiket",
        href: "events",
        icon: IoTicket,
        description: "Event & Konser",
        bgGradient: "from-blue-500 to-indigo-600",
        iconColor: "text-white",
        hoverBg: "hover:from-blue-600 hover:to-indigo-700",
    },
    {
        label: "Jasa",
        href: "services",
        icon: GiMicrophone,
        description: "Vendor Profesional",
        bgGradient: "from-purple-500 to-pink-600",
        iconColor: "text-white",
        hoverBg: "hover:from-purple-600 hover:to-pink-700",
    },
    {
        label: "Gedung",
        href: "buildings",
        icon: FaBuilding,
        description: "Venue & Tempat",
        bgGradient: "from-orange-500 to-red-600",
        iconColor: "text-white",
        hoverBg: "hover:from-orange-600 hover:to-red-700",
    },
    {
        label: "Property",
        href: "propertys",
        icon: GrFanOption,
        description: "Perlengkapan Acara",
        bgGradient: "from-green-500 to-emerald-600",
        iconColor: "text-white",
        hoverBg: "hover:from-green-600 hover:to-emerald-700",
    },
];

function TestimonialSection({ testimonials: propTestimonials }) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const testimonials = propTestimonials || [];

    const handleNext = useCallback(() => {
        setSelectedIndex((prev) => (prev + 1) % testimonials.length);
    }, [testimonials.length]);

    const selectedTestimonial = useMemo(
        () => testimonials[selectedIndex],
        [testimonials, selectedIndex]
    );

    return (
        <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            <div className="container mx-auto max-w-7xl px-4 md:px-6">
                <Tabs defaultValue="testimoni" className="w-full">
                    <TabsList className="grid w-full max-w-sm mx-auto grid-cols-2 h-12">
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
                  
                    </TabsList>

                    <TabsContent value="testimoni" className="mt-12">
                        {testimonials.length > 0 ? (
                            <div className="grid lg:grid-cols-2 gap-12 items-start">
                                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-6">
                                    {testimonials.map((user, idx) => (
                                        <Card
                                            key={user.id}
                                            className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                                                selectedIndex === idx
                                                    ? "ring-2 ring-primary shadow-lg scale-105"
                                                    : "hover:shadow-md"
                                            }`}
                                            onClick={() =>
                                                setSelectedIndex(idx)
                                            }
                                        >
                                            <CardContent className="p-6 text-center space-y-4">
                                                <Avatar className="w-16 h-16 mx-auto">
                                                    <AvatarImage
                                                        src={
                                                            user.author_image_url ||
                                                            `https://picsum.photos/300/300?random=${idx}`
                                                        }
                                                        alt={user.author_name}
                                                    />
                                                    <AvatarFallback>
                                                        {user.author_name.charAt(
                                                            0
                                                        )}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h3 className="font-semibold text-foreground line-clamp-1">
                                                        {user.author_name}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                                        {user.author_title}
                                                    </p>
                                                </div>
                                                <Rating
                                                    initialRating={
                                                        user.star_rating
                                                    }
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

                                {selectedTestimonial && (
                                    <Card className="lg:sticky lg:top-8">
                                        <CardHeader>
                                            <div className="w-12 h-1 bg-primary rounded-full mb-2" />
                                            <h3 className="text-2xl font-bold text-card-foreground">
                                                {
                                                    selectedTestimonial.author_name
                                                }
                                            </h3>
                                            <p className="text-muted-foreground">
                                                {
                                                    selectedTestimonial.author_title
                                                }
                                            </p>
                                        </CardHeader>
                                        <CardContent>
                                            <blockquote className="text-lg leading-relaxed text-muted-foreground border-l-4 border-primary pl-4 italic">
                                                "{selectedTestimonial.quote}"
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
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground text-lg">
                                    No testimonials available
                                </p>
                            </div>
                        )}
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

                </Tabs>
            </div>
        </section>
    );
}

export default function Welcome() {
    const {
        auth,
        ziggy,
        events,
        buildings,
        services,
        propertys,
        testimonials,
        hero,
    } = usePage().props;
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
                
                {/* Use the new MobileMenu component */}
                <MobileMenu />

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
            <section
                id="home"
                className="relative min-h-screen bg-cover bg-center flex items-center"
                style={{
                    backgroundImage: `url('${ziggy.url}/storage/seo/${hero}')`,
                }}
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
                                    className="group cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 border-border/50 overflow-hidden"
                                    asChild
                                >
                                    <Link href={item.href}>
                                        <CardContent className="p-6 text-center space-y-4">
                                            <div className={`bg-gradient-to-br ${item.bgGradient} ${item.hoverBg} w-16 h-16 rounded-2xl mx-auto flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                                                <IconComponent className={`w-8 h-8 ${item.iconColor}`} />
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
                    subtitle="Temukan event seru dan menarik di sekitarmu"
                    items={events}
                    type="events"
                    baseUrl={ziggy.url}
                />

                <div className="bg-secondary/5">
                    <CategorySection
                        id="services"
                        title="Andalan Utama dan Terbukti Efektif"
                        subtitle="Vendor jasa profesional untuk mensukseskan acaramu"
                        items={services}
                        type="services"
                        baseUrl={ziggy.url}
                    />
                </div>

                <CategorySection
                    id="buildings"
                    title="Sewa Lokasi dan Solusi Teruji"
                    subtitle="Pilihan gedung dan venue terbaik untuk berbagai acara"
                    items={buildings}
                    type="buildings"
                    baseUrl={ziggy.url}
                />

                <div className="bg-secondary/5">
                    <CategorySection
                        id="property"
                        title="Solusi Sewa Perlengkapan Acara"
                        subtitle="Lengkapi kebutuhan acaramu dengan peralatan berkualitas"
                        items={propertys}
                        type="propertys"
                        baseUrl={ziggy.url}
                    />
                </div>

                {/* Testimonial Section */}
                <TestimonialSection testimonials={testimonials} />

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
