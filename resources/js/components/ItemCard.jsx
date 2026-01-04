import { useCallback } from "react";
import { Link } from "@inertiajs/react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { MapPin, ChevronRight } from "lucide-react";
import LazyImage from "@/components/LazyImage.jsx";
import { formatRupiah } from "@/Utils/formatRupiah.js";

const ItemCard = ({ item, type, baseUrl }) => {
    const getImageUrl = useCallback(() => {
        if (!item.thumbnail) {
            return `${baseUrl}/storage/default-event-images/dubby.webp`;
        }

        // If thumbnail already contains full path (starts with /storage or http)
        if (item.thumbnail.startsWith('/storage') || item.thumbnail.startsWith('http')) {
            return item.thumbnail.startsWith('http') 
                ? item.thumbnail 
                : `${baseUrl}${item.thumbnail}`;
        }

        // For events, check if it's a default image
        if (type === "events" && item.thumbnail.includes("default-event-images")) {
            return `${baseUrl}/storage/default-event-images/${item.thumbnail.split('/').pop()}`;
        }

        // For all types, add /storage/thumbnails/ prefix if not already present
        if (item.thumbnail.includes("thumbnails/")) {
            return `${baseUrl}/storage/${item.thumbnail}`;
        }

        return `${baseUrl}/storage/thumbnails/${item.thumbnail}`;
    }, [item.thumbnail, type, baseUrl]);

    const getPriceDisplay = useCallback(() => {
        switch (type) {
            case "events":
                if (item.tickets?.length > 0 && item.tickets[0].price) {
                    return `Mulai ${formatRupiah(item.tickets[0].price)}`;
                }
                return "Gratis";
            case "services":
                return formatRupiah(item.price);
            case "buildings":
            case "propertys":
                return `${formatRupiah(item.price)}/Hari`;
            default:
                return "";
        }
    }, [item, type]);

    const getHref = useCallback(() => {
        const path = type === "propertys" ? "propertys" : type;
        return `/${path}/${item.id}`;
    }, [type, item.id]);

    const getTitle = useCallback(() => {
        switch (type) {
            case "events": return "Event";
            case "services": return "Jasa";
            case "buildings": return "Gedung";
            case "propertys": return "Property";
            default: return "Event";
        }
    }, [type]);

    const getBadgeColor = useCallback(() => {
        switch (type) {
            case "events": return "bg-blue-500 hover:bg-blue-600";
            case "services": return "bg-purple-500 hover:bg-purple-600";
            case "buildings": return "bg-orange-500 hover:bg-orange-600";
            case "propertys": return "bg-green-500 hover:bg-green-600";
            default: return "bg-primary";
        }
    }, [type]);

    return (
        <Link href={getHref()} className="block h-full">
            <Card className="group h-full w-full hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-border/50 bg-card overflow-hidden flex flex-col">
                <CardHeader className="p-0 relative">
                    <div className="aspect-[4/3] overflow-hidden">
                        <LazyImage
                            src={getImageUrl()}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
                        
                        <Badge 
                            className={`absolute top-3 right-3 capitalize font-medium text-white border-0 shadow-lg ${getBadgeColor()}`}
                        >
                            {getTitle()}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3 flex-grow">
                    <h3 className="font-bold text-lg line-clamp-2 capitalize text-card-foreground group-hover:text-primary transition-colors leading-tight">
                        {item.name}
                    </h3>
                    {item.location && (
                        <div className="flex items-start text-muted-foreground text-sm">
                            <MapPin className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0 text-primary/70" />
                            <span className="line-clamp-1">{item.location}</span>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="p-4 pt-0 mt-auto border-t border-border/50 bg-muted/20">
                    <div className="flex items-center justify-between w-full pt-3">
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Harga</span>
                            <span className="font-bold text-lg text-primary">
                                {getPriceDisplay()}
                            </span>
                        </div>
                        <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </Link>
    );
};

export default ItemCard;
