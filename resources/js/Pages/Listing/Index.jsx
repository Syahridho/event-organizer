import { Head, Link, usePage, router } from "@inertiajs/react";
import { useState, useCallback } from "react";
import {
    ChevronRight,
    MapPin,
    Filter,
    Grid3x3,
    LayoutList,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import MainLayout from "@/Layouts/Main.jsx";
import { formatRupiah } from "@/Utils/formatRupiah.js";

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
            {!loaded && <Skeleton className="absolute inset-0 w-full h-full" />}
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
            return item.thumbnail?.includes("default-event-images")
                ? `${baseUrl}/storage${item.thumbnail}`
                : `${baseUrl}/storage/thumbnails/${item.thumbnail}`;
        }
        return `${baseUrl}/storage/thumbnails/${item.thumbnail}`;
    }, [item.thumbnail, item.type, baseUrl]);

    const getPriceDisplay = useCallback(() => {
        switch (item.type) {
            case "event":
                // Events tidak punya kolom price, tampilkan label khusus
                return item.price
                    ? `Rp ${formatRupiah(item.price)}`
                    : "Lihat Harga";
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
                                variant="secondary"
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
                                {/* <p className="text-muted-foreground text-sm line-clamp-2">
                                    {item.description}
                                </p> */}
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
                            variant="secondary"
                            className="absolute top-3 right-3 font-medium"
                        >
                            {badge.label}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold text-lg line-clamp-2 capitalize text-card-foreground group-hover:text-primary transition-colors ">
                        {item.name}
                    </h3>
                    {/* <p className="text-muted-foreground text-sm line-clamp-2 min-h-[2.5rem]">
                        {item.description}
                    </p> */}
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
const Pagination = ({ links, _currentPage, _lastPage }) => {
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
    const { items, ziggy, categories } = usePage().props;
    const [viewMode, setViewMode] = useState("grid");
    const [filterType, setFilterType] = useState("all");
    const [filterCategory, setFilterCategory] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const filteredItems = items.data.filter((item) => {
        const typeMatch = filterType === "all" || item.type === filterType;

        // Handle category_ids which could be a string of comma-separated IDs or null
        let categoryIds = [];
        if (item.category_ids) {
            categoryIds = item.category_ids
                .split(",")
                .map((id) => parseInt(id.trim()));
        }

        // Debug: Log category filtering
        console.log(
            `Item: ${item.name}, Type: ${item.type}, Category IDs: ${categoryIds}, Filter Category: ${filterCategory}`
        );

        const categoryMatch =
            filterCategory === "all" ||
            (item.category_ids &&
                categoryIds.includes(parseInt(filterCategory)));

        const searchMatch =
            searchTerm === "" ||
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.location &&
                item.location.toLowerCase().includes(searchTerm.toLowerCase()));

        const result = typeMatch && categoryMatch && searchMatch;

        // Debug: Log filter result
        console.log(
            `Type Match: ${typeMatch}, Category Match: ${categoryMatch}, Search Match: ${searchMatch}, Result: ${result}`
        );

        return result;
    });

    const handleFilterChange = (filterType, value) => {
        setIsLoading(true);
        setTimeout(() => {
            if (filterType === "type") {
                setFilterType(value);
            } else if (filterType === "category") {
                setFilterCategory(value);
            }
            setIsLoading(false);
        }, 500); // Simulasi loading delay
    };

    return (
        <div className="bg-background min-h-screen">
            <Head title="Semua Listing - Eventnusa" />

            {/* Hero Section */}
            <section className="bg-primary py-16">
                <div className="container mx-auto max-w-7xl px-4 md:px-6">
                    <div className="text-center text-primary-foreground space-y-4">
                        <Badge variant="secondary" className="mb-2">
                            🎯 Rekomendasi Terbaik
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground">
                            Jelajahi Semua Penawaran
                        </h1>
                        <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
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
                        <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                            <div className="flex items-center gap-4 w-full">
                                <Filter className="w-5 h-5 text-muted-foreground" />
                                <div className="relative w-full sm:w-[250px]">
                                    <input
                                        type="text"
                                        placeholder="Cari nama atau lokasi..."
                                        className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        disabled={isLoading}
                                    />
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"
                                    >
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <path d="m21 21-4.35-4.35"></path>
                                    </svg>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 w-full">
                                <Select
                                    value={filterType}
                                    onValueChange={(value) =>
                                        handleFilterChange("type", value)
                                    }
                                    disabled={isLoading}
                                >
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Filter Tipe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Semua Tipe
                                        </SelectItem>
                                        <SelectItem value="event">
                                            Event
                                        </SelectItem>
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

                                <Select
                                    value={filterCategory}
                                    onValueChange={(value) =>
                                        handleFilterChange("category", value)
                                    }
                                    disabled={isLoading}
                                >
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Filter Kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Semua Kategori
                                        </SelectItem>
                                        {categories &&
                                            categories.map((category) => (
                                                <SelectItem
                                                    key={category.id}
                                                    value={category.id.toString()}
                                                >
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm text-muted-foreground">
                                        Memuat...
                                    </span>
                                </div>
                            ) : (
                                <span className="text-sm text-muted-foreground">
                                    {filteredItems.length} item
                                </span>
                            )}
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
                    {isLoading ? (
                        <div
                            className={
                                viewMode === "grid"
                                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                    : "flex flex-col gap-6"
                            }
                        >
                            {Array.from({ length: 8 }).map((_, index) => (
                                <Card key={index} className="overflow-hidden">
                                    <Skeleton className="aspect-[4/3] w-full" />
                                    <CardContent className="p-4 space-y-3">
                                        <Skeleton className="h-6 w-3/4" />
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-4 w-4" />
                                            <Skeleton className="h-4 w-1/2" />
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <Skeleton className="h-6 w-1/3" />
                                            <Skeleton className="h-8 w-8" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : filteredItems.length > 0 ? (
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
                                    onClick={() => {
                                        setFilterType("all");
                                        setFilterCategory("all");
                                        setSearchTerm("");
                                    }}
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
