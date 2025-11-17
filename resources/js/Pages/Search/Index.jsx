import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MainLayout from "@/Layouts/Main";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Filter } from "lucide-react";

const LazyImage = ({ src, alt, className }) => {
    const [loaded, setLoaded] = useState(false);
    const [inView, setInView] = useState(false);
    const imgRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "50px" }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={imgRef} className={className}>
            {inView && (
                <>
                    {!loaded && (
                        <div className="w-full h-full bg-gray-200 animate-pulse rounded"></div>
                    )}
                    <img
                        src={src}
                        alt={alt}
                        className={`w-full h-full object-cover rounded transition-opacity duration-300 ${
                            loaded ? "opacity-100" : "opacity-0"
                        }`}
                        onLoad={() => setLoaded(true)}
                        loading="lazy"
                    />
                </>
            )}
        </div>
    );
};

export default function SearchPage({ products, keyword, type }) {
    const { ziggy } = usePage().props;
    const [activeFilter, setActiveFilter] = useState(type || "all");
    console.log(type);
    console.log(products);

    const baseUrl = ziggy.url;
    const getImageUrl = (thumbnail, type) => {
        console.log(thumbnail);
        // Kembalikan null jika tidak ada thumbnail, agar kita bisa render avatar huruf
        if (!thumbnail || thumbnail === null) {
            // For mitra type, return null to trigger avatar fallback
            if (type === "mitra") {
                return null;
            }
            // For other types, return default image
            return `${baseUrl}/storage/default-event-images/dubby.webp`;
        }

        if (type === "mitra") {
            return `${baseUrl}/storage/${thumbnail}`;
        }

        if (thumbnail.includes("default-event-images"))
            return `${baseUrl}/storage/${thumbnail}`;
        if (thumbnail.includes("thumbnails"))
            return `${baseUrl}/storage/${thumbnail}`;
        return thumbnail.startsWith("http")
            ? thumbnail
            : `${baseUrl}/storage/thumbnails/${thumbnail}`;
    };

    // Palet warna tetap (agar Tailwind tidak purging class)
    const COLOR_PALETTE = [
        "bg-blue-500",
        "bg-emerald-500",
        "bg-purple-500",
        "bg-rose-500",
        "bg-amber-500",
        "bg-indigo-500",
        "bg-teal-500",
        "bg-fuchsia-500",
    ];

    // Pilih warna deterministik berdasarkan nama/type
    const pickColorClass = (seed = "") => {
        let hash = 0;
        const s = String(seed);
        for (let i = 0; i < s.length; i++) {
            hash = (hash * 31 + s.charCodeAt(i)) | 0;
        }
        const idx = Math.abs(hash) % COLOR_PALETTE.length;
        return COLOR_PALETTE[idx];
    };

    // Ambil inisial huruf pertama (kapital)
    const getInitial = (name = "") => {
        const trimmed = String(name).trim();
        return trimmed.length ? trimmed[0].toUpperCase() : "?";
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("id-ID").format(price);
    };

    const getBadgeLabel = (productType) => {
        const labels = {
            event: "Event",
            service: "Layanan",
            building: "Gedung",
            property: "Properti",
            user: "Pengguna",
            mitra: "Mitra",
        };
        return labels[productType] || productType;
    };

    // Helper: tipe user
    const isUserType = (t) => t === "user" || t === "mitra";

    // Helper: tentukan URL sesuai tipe
    const getHrefForProduct = (product) => {
        const t = product.type;
        if (isUserType(t)) {
            const uuid = product.uuid || product.id;
            return `/chat/${uuid}`;
        }
        return `/${t + "s"}/${product.id}`;
    };

    const filters = [
        { value: "all", label: "Semua" },
        { value: "event", label: "Event" },
        { value: "building", label: "Gedung" },
        { value: "service", label: "Layanan" },
        { value: "property", label: "Properti" },
        { value: "mitra", label: "Mitra" },
    ];

    const handleFilterChange = (filterValue) => {
        setActiveFilter(filterValue);
        const params = new URLSearchParams();
        params.append("keyword", keyword);
        if (filterValue !== "all") {
            params.append("type", filterValue);
        }
        router.visit(`/search?${params.toString()}`, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <div className="min-h-screen mx-auto xl:max-w-[950px] p-4 mb-20 md:mb-0">
            <Head title="Pencarian" />
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">
                    Hasil Pencarian: "{keyword}"
                </h1>
                <p className="text-sm text-muted-foreground">
                    Ditemukan {products.length} hasil
                </p>
            </div>

            {/* Filter Tabs */}
            <div className="mb-6 border-b">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {filters.map((filter) => (
                        <Button
                            key={filter.value}
                            variant={
                                activeFilter === filter.value
                                    ? "default"
                                    : "ghost"
                            }
                            size="sm"
                            onClick={() => handleFilterChange(filter.value)}
                            className={`whitespace-nowrap transition-all ${
                                activeFilter === filter.value
                                    ? "shadow-sm"
                                    : "hover:bg-accent"
                            }`}
                        >
                            {filter.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Results */}
            {products.length === 0 ? (
                <div className="text-center py-12">
                    <div className="mb-4">
                        <Filter className="h-16 w-16 mx-auto text-gray-300" />
                    </div>
                    <p className="text-lg font-medium text-gray-600">
                        Tidak ada hasil ditemukan
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        Coba kata kunci atau filter lain
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {products.map((product) => (
                        <Link
                            key={`${product.type}-${product.id}`}
                            href={getHrefForProduct(product)}
                        >
                            <div className="border rounded-lg hover:shadow-lg transition-all duration-300 overflow-hidden group bg-white">
                                <div className="relative aspect-[4/3] overflow-hidden">
                                    {getImageUrl(product.thumbnail) ? (
                                        <LazyImage
                                            src={getImageUrl(
                                                product.thumbnail,
                                                product.type
                                            )}
                                            alt={product.name}
                                            className="w-full h-full"
                                        />
                                    ) : (
                                        <div
                                            className={`w-full h-full ${pickColorClass(
                                                product.name || product.type
                                            )} flex items-center justify-center rounded`}
                                        >
                                            <span className="text-white font-semibold text-3xl sm:text-4xl">
                                                {getInitial(
                                                    product.name || product.type
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <Badge
                                        variant={"default"}
                                        className="absolute top-3 right-3 font-medium shadow-sm"
                                    >
                                        {getBadgeLabel(product.type)}
                                    </Badge>
                                </div>
                                <div className="p-4 space-y-2">
                                    <h3 className="font-semibold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors min-h-[3rem]">
                                        {product.name}
                                    </h3>

                                    <div className="space-y-1.5">
                                        {product.price &&
                                            !isUserType(product.type) && (
                                                <div className="flex items-center gap-1">
                                                    <span className="font-bold text-lg text-green-600">
                                                        Rp{" "}
                                                        {formatPrice(
                                                            product.price
                                                        )}
                                                    </span>
                                                </div>
                                            )}

                                        {product.location && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                                <span className="text-sm line-clamp-1">
                                                    {product.location}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

SearchPage.layout = (page) => <MainLayout>{page}</MainLayout>;
