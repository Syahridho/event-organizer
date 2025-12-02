import React, { useState, useMemo } from "react";
import { Head, Link } from "@inertiajs/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import MainLayout from "@/Layouts/Main";

// Skeleton component for item cards
const ItemSkeleton = () => (
    <Card className="transition-all duration-200">
        <CardHeader>
            <div className="flex justify-between items-start">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
            </div>
        </CardHeader>
        <CardContent>
            <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </div>
        </CardContent>
        <CardFooter>
            <Skeleton className="h-10 w-full" />
        </CardFooter>
    </Card>
);

const Profile = ({ mitra, allItems }) => {
    const [filterType, setFilterType] = useState("all");
    const [isLoading, setIsLoading] = useState(false);

    // Generate detail URL based on item type
    const getDetailUrl = (type, id) => {
        const routes = {
            event: "/events/" + id,
            service: "/services/" + id,
            building: "/buildings/" + id,
            rent_property: "/propertys/" + id,
        };

        return routes[type] || "/events/" + id;
    };

    // Convert allItems object to array if it's not already an array
    const itemsArray = useMemo(() => {
        return Array.isArray(allItems) ? allItems : Object.values(allItems);
    }, [allItems]);

    // Filter items based on selected type
    const filteredItems = useMemo(() => {
        if (filterType === "all") {
            return itemsArray;
        }
        return itemsArray.filter((item) => item.item_type === filterType);
    }, [itemsArray, filterType]);

    const getStatusColor = (status) => {
        switch (status) {
            case "active":
                return "bg-green-100 text-green-800";
            case "inactive":
                return "bg-gray-100 text-gray-800";
            case "banned":
                return "bg-red-100 text-red-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    const getItemTypeLabel = (itemType) => {
        switch (itemType) {
            case "event":
                return "Acara";
            case "service":
                return "Layanan";
            case "building":
                return "Gedung";
            case "rent_property":
                return "Properti Sewa";
            default:
                return itemType;
        }
    };

    // Simulate loading state for demonstration
    const handleFilterChange = (value) => {
        setIsLoading(true);
        setTimeout(() => {
            setFilterType(value);
            setIsLoading(false);
        }, 300);
    };

    return (
        <MainLayout>
            <Head title={`Profil Mitra - ${mitra.name}`} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Mitra Profile Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage
                                src={mitra.profile_photo}
                                alt={mitra.name}
                            />
                            <AvatarFallback className="text-2xl">
                                {mitra.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {mitra.name}
                            </h1>
                            <p className="text-lg text-gray-600">
                                @{mitra.username}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Items Section */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-gray-900">
                            Semua Layanan
                        </h2>

                        {/* Filter Select */}
                        <Select
                            value={filterType}
                            onValueChange={handleFilterChange}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="event">Acara</SelectItem>
                                <SelectItem value="service">Layanan</SelectItem>
                                <SelectItem value="building">Gedung</SelectItem>
                                <SelectItem value="rent_property">
                                    Properti Sewa
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Loading State or Items Grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <ItemSkeleton key={`skeleton-${index}`} />
                            ))}
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg shadow">
                            <p className="text-gray-500 text-lg">
                                {filterType === "all"
                                    ? "Belum ada layanan yang tersedia"
                                    : `Belum ada ${getItemTypeLabel(
                                          filterType
                                      )} yang tersedia`}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
                            {filteredItems?.map((item) => {
                                const isActive = item.status === "active";
                                const detailUrl = getDetailUrl(
                                    item.item_type,
                                    item.id
                                );

                                return (
                                    <Link
                                        href={detailUrl}
                                        className={`block h-full ${
                                            !isActive
                                                ? "pointer-events-none opacity-60"
                                                : ""
                                        }`}
                                    >
                                        <Card
                                            key={`${item.item_type}-${item.id}`}
                                            className="transition-all duration-200 hover:shadow-lg h-full flex flex-col"
                                        >
                                            <CardHeader className="flex-shrink-0">
                                                {/* Thumbnail */}
                                                {item.thumbnail_url && (
                                                    <div className="mb-3 rounded-lg overflow-hidden">
                                                        <img
                                                            src={
                                                                item.thumbnail_url
                                                            }
                                                            alt={item.name}
                                                            className="w-full h-40 object-cover"
                                                        />
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-start">
                                                    <CardTitle className="text-lg line-clamp-2">
                                                        {item.name}
                                                    </CardTitle>
                                                    <Badge
                                                        className={getStatusColor(
                                                            item.status
                                                        )}
                                                    >
                                                        {item.status}
                                                    </Badge>
                                                </div>
                                                <CardDescription>
                                                    {getItemTypeLabel(
                                                        item.item_type
                                                    )}
                                                </CardDescription>
                                            </CardHeader>

                                            <CardContent className="flex-grow">
                                                {item.price && (
                                                    <p className="text-xl font-bold text-green-600 mb-2">
                                                        {formatPrice(
                                                            item.price
                                                        )}
                                                    </p>
                                                )}
                                            </CardContent>

                                            <CardFooter className="flex-shrink-0">
                                                {isActive ? (
                                                    <Button className="w-full">
                                                        Lihat Detail
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        className="w-full"
                                                        variant="outline"
                                                        disabled
                                                    >
                                                        Tidak Tersedia
                                                    </Button>
                                                )}
                                            </CardFooter>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default Profile;
