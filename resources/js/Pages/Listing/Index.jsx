import { Head, Link, usePage, router } from "@inertiajs/react";
import { useState, useCallback } from "react";
import { ChevronRight, MapPin, Filter, Grid3x3, LayoutList } from "lucide-react";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import MainLayout from "@/Layouts/Main";
import { formatRupiah } from "@/Utils/formatRupiah";

// LazyImage Component
const LazyImage = ({ src, alt, className, ...props }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    const handleLoad = useCallback(() => {
        setLoaded(true);
    }, []);

    const handleError = useCallback(() => {
        setError(true);
        setLoaded(true);
    }, []);

    return (
        <div className="relative overflow-hidden rounded-t-lg w-full h-full">
            {!loaded && (
                <Skeleton className="absolute inset-0 w-full h-full" />
            )}
            <img
                src={error ? "/placeholder.jpg" : src}
                alt={alt}
                className={`${className} transition-all duration-300 ${
                    loaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={handleLoad}
                onError={handleError}
                loading="lazy"
                {...props}
            />
        </div>
    );
};

// ItemCard Component with Grid & List View Support
const ItemCard = ({ item, baseUrl, viewMode }) => {
    const getImageUrl = useCallback(() => {
        if (item.type === "event") {
            return item.thumbnail?.includes("randoms")
                ? `${baseUrl}/storage${item.thumbnail}`
                : `${baseUrl}/storage/thumbnails/${item.thumbnail}`;
        }
        return `${baseUrl}/storage/thumbnails/${item.thumbnail}`;
    }, [item.thumbnail, item.type, baseUrl]);

    const getPriceDisplay = useCallback(() => {
        switch (item.type) {
            case "event":
                // Events tidak punya kolom price, tampilkan label khusus
                return item.price ? `Rp ${formatRupiah(item.price)}` : "Lihat Harga";
            case "service":
                return `Rp ${formatRupiah(item.price)}`;
            case "building":
            case "property":
                return `Rp ${formatRupiah(item.price)}/Hari`;
            default:
                return "";
        }
    }, [item]);

    const getHref = useCallback(() => {
        return `/${item.type_slug}/${item.id}`;
    }, [item]);

    const getTypeBadge = useCallback(() => {
        const badges = {
            event: { label: "Event", variant: "default" },
            service: { label: "Jasa", variant: "secondary" },
            building: { label: "Gedung", variant: "outline" },
            property: { label: "Property", variant: "destructive" },
        };
        return badges[item.type] || badges.event;
    }, [item.type]);

    const badge = getTypeBadge();

    if (viewMode === "list") {
        return (
            <Link href={getHref()}>
                <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                    <div className="flex flex-col sm:flex-row">
                        <div className="relative sm:w-72 h-48 sm:h-auto flex-shrink-0">
                            <LazyImage
                                src={getImageUrl()}
                                alt={item.name}
                                className="w-full h-full object-cover sm:rounded-l-lg"
                            />
                            <Badge
                                variant={badge.variant}
                                className="absolute top-3 right-3 font-medium"
                            >
                                {badge.label}
                            </Badge>
                        </div>
                        <div className="flex flex-col justify-between p-6 flex-1">
                            <div className="space-y-3">
                                <h3 className="font-bold text-xl line-clamp-2 capitalize text-card-foreground group-hover:text-primary transition-colors">
                                    {item.name}
                                </h3>
                                <p className="text-muted-foreground text-sm line-clamp-2">
                                    {item.description}
                                </p>
                                <div className="flex items-center text-muted-foreground text-sm">
                                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                                    <span className="line-clamp-1">
                                        {item.location}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                <span className="font-bold text-xl text-primary">
                                    {getPriceDisplay()}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                                >
                                    Lihat Detail
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </Link>
        );
    }

    // Grid View (Default)
    return (
        <Link href={getHref()}>
            <Card className="group h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-border/50 bg-card">
                <CardHeader className="p-0">
                    <div className="relative aspect-[4/3] overflow-hidden">
                        <LazyImage
                            src={getImageUrl()}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <Badge
                            variant={badge.variant}
                            className="absolute top-3 right-3 font-medium"
                        >
                            {badge.label}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold text-lg line-clamp-2 capitalize text-card-foreground group-hover:text-primary transition-colors min-h-[3.5rem]">
                        {item.name}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 min-h-[2.5rem]">
                        {item.description}
                    </p>
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

// Pagination Component
const Pagination = ({ links, currentPage, lastPage }) => {
    if (!links || links.length <= 3) return null;

    return (
        <div className="flex items-center justify-center gap-2 flex-wrap">
            {links.map((link, index) => {
                if (!link.url) {
                    return (
                        <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            disabled
                            className="min-w-[2.5rem]"
                        >
                            <span
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        </Button>
                    );
                }

                return (
                    <Button
                        key={index}
                        variant={link.active ? "default" : "outline"}
                        size="sm"
                        onClick={() => router.visit(link.url)}
                        className="min-w-[2.5rem]"
                    >
                        <span
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    </Button>
                );
            })}
        </div>
    );
};

// Main Component
export default function Index() {
    const { items, ziggy } = usePage().props;
    const [viewMode, setViewMode] = useState("grid");
    const [filterType, setFilterType] = useState("all");

    const filteredItems = items.data.filter((item) => {
        if (filterType === "all") return true;
        return item.type === filterType;
    });

    return (
        <div className="bg-background min-h-screen">
            <Head title="Semua Listing - Eventnusa" />

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-primary via-primary/90 to-secondary py-16">
                <div className="container mx-auto max-w-7xl px-4 md:px-6">
                    <div className="text-center text-primary-foreground space-y-4">
                        <Badge variant="secondary" className="mb-2">
                            🎯 Rekomendasi Terbaik
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-bold">
                            Jelajahi Semua Penawaran
                        </h1>
                        <p className="text-xl opacity-90 max-w-2xl mx-auto">
                            Temukan event, jasa, gedung, dan property terbaik
                            untuk kebutuhan Anda
                        </p>
                    </div>
                </div>
            </section>

            {/* Filter & Controls */}
            <section className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b shadow-sm">
                <div className="container mx-auto max-w-7xl px-4 md:px-6 py-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <Filter className="w-5 h-5 text-muted-foreground" />
                            <Select
                                value={filterType}
                                onValueChange={setFilterType}
                            >
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Filter Tipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Tipe
                                    </SelectItem>
                                    <SelectItem value="event">Event</SelectItem>
                                    <SelectItem value="service">
                                        Jasa
                                    </SelectItem>
                                    <SelectItem value="building">
                                        Gedung
                                    </SelectItem>
                                    <SelectItem value="property">
                                        Property
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <span className="text-sm text-muted-foreground">
                                {filteredItems.length} item
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant={
                                    viewMode === "grid" ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setViewMode("grid")}
                            >
                                <Grid3x3 className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={
                                    viewMode === "list" ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setViewMode("list")}
                            >
                                <LayoutList className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content */}
            <section className="py-12">
                <div className="container mx-auto max-w-7xl px-4 md:px-6">
                    {filteredItems.length > 0 ? (
                        <>
                            <div
                                className={
                                    viewMode === "grid"
                                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                        : "flex flex-col gap-6"
                                }
                            >
                                {filteredItems.map((item, index) => (
                                    <ItemCard
                                        key={`${item.type}-${item.id}-${index}`}
                                        item={item}
                                        baseUrl={ziggy.url}
                                        viewMode={viewMode}
                                    />
                                ))}
                            </div>

                            {/* Pagination */}
                            <Separator className="my-12" />
                            <Pagination
                                links={items.links}
                                currentPage={items.current_page}
                                lastPage={items.last_page}
                            />
                        </>
                    ) : (
                        <Card className="py-20">
                            <CardContent className="text-center space-y-4">
                                <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
                                    <Filter className="w-10 h-10 text-muted-foreground" />
                                </div>
                                <h3 className="text-xl font-semibold">
                                    Tidak Ada Item Ditemukan
                                </h3>
                                <p className="text-muted-foreground">
                                    Coba ubah filter atau kembali lagi nanti
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => setFilterType("all")}
                                >
                                    Reset Filter
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </section>
        </div>
    );
}

Index.layout = (page) => <MainLayout>{page}</MainLayout>;
