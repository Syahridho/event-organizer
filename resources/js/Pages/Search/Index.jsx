import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";
import MainLayout from "@/Layouts/Main.jsx";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import { Filter } from "lucide-react";
import ItemCard from "@/Components/ItemCard.jsx";

// Component for User/Mitra cards (different from ItemCard)
const UserCard = ({ user, baseUrl }) => {
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

    const pickColorClass = (seed = "") => {
        let hash = 0;
        const s = String(seed);
        for (let i = 0; i < s.length; i++) {
            hash = (hash * 31 + s.charCodeAt(i)) | 0;
        }
        const idx = Math.abs(hash) % COLOR_PALETTE.length;
        return COLOR_PALETTE[idx];
    };

    const getInitial = (name = "") => {
        const trimmed = String(name).trim();
        return trimmed.length ? trimmed[0].toUpperCase() : "?";
    };

    const getImageUrl = () => {
        if (!user.thumbnail) return null;
        return `${baseUrl}/storage/${user.thumbnail}`;
    };

    const href = `/chat/${user.uuid || user.id}`;

    return (
        <Link href={href} className="block h-full">
            <div className="group h-full border rounded-lg hover:shadow-lg transition-all duration-300 overflow-hidden bg-card flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden">
                    {getImageUrl() ? (
                        <img
                            src={getImageUrl()}
                            alt={user.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                    ) : (
                        <div
                            className={`w-full h-full ${pickColorClass(
                                user.name || user.type
                            )} flex items-center justify-center`}
                        >
                            <span className="text-white font-semibold text-5xl">
                                {getInitial(user.name || user.type)}
                            </span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
                    <Badge className="absolute top-3 right-3 capitalize font-medium text-white border-0 shadow-lg bg-indigo-500 hover:bg-indigo-600">
                        Mitra
                    </Badge>
                </div>
                <div className="p-4 flex-grow flex flex-col justify-center">
                    <h3 className="font-bold text-lg line-clamp-2 capitalize text-card-foreground group-hover:text-primary transition-colors leading-tight text-center">
                        {user.name}
                    </h3>
                </div>
            </div>
        </Link>
    );
};

export default function SearchPage({ products, keyword, type }) {
    const { ziggy } = usePage().props;
    const [activeFilter, setActiveFilter] = useState(type || "all");
    const baseUrl = ziggy.url;

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

    // Convert product type to ItemCard type format
    const getItemCardType = (productType) => {
        const typeMap = {
            event: "events",
            service: "services",
            building: "buildings",
            property: "propertys",
        };
        return typeMap[productType] || productType;
    };

    const isUserType = (t) => t === "user" || t === "mitra";

    return (
        <div className="min-h-screen mx-auto xl:max-w-[1200px] p-4 md:p-6 mb-20 md:mb-0">
            <Head title="Pencarian" />
            
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    Hasil Pencarian: "{keyword}"
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) =>
                        isUserType(product.type) ? (
                            <UserCard
                                key={`${product.type}-${product.id}`}
                                user={product}
                                baseUrl={baseUrl}
                            />
                        ) : (
                            <ItemCard
                                key={`${product.type}-${product.id}`}
                                item={product}
                                type={getItemCardType(product.type)}
                                baseUrl={baseUrl}
                            />
                        )
                    )}
                </div>
            )}
        </div>
    );
}

SearchPage.layout = (page) => <MainLayout>{page}</MainLayout>;
