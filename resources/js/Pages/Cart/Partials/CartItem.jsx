import React, { memo } from "react";
import { Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Trash2,
    Calendar,
    Minus,
    Plus,
    Clock,
} from "lucide-react";
import { formatRupiah } from "@/Utils/formatRupiah";
import {
    checkItemStatus,
    getSeverityColors,
    getSeverityIcon,
    getTypeLabel,
    getTypeColor,
    getTypeIcon,
    getDetailUrl,
    formatDate,
} from "@/Utils/cartUtils.jsx";

const CartItem = memo(({
    item,
    isSelected,
    onSelect,
    onQtyChange,
    onDelete,
    onDeliveryChange,
    baseUrl,
}) => {
    const status = checkItemStatus(item);
    const colors = status.severity ? getSeverityColors(status.severity) : null;
    const TypeIcon = getTypeIcon(item.type);

    const [imageError, setImageError] = React.useState(false);

    const getThumbnailSrc = (cartItem) => {
        if (imageError) {
            return `https://placehold.co/96x96/e5e7eb/7f8388?text=${(
                cartItem.type || "I"
            )
                .charAt(0)
                .toUpperCase()}`;
        }
        const thumbnailPath =
            cartItem.type === "ticket"
                ? cartItem.item?.event?.thumbnail
                : cartItem.item?.thumbnail;
        
        if (!thumbnailPath) {
            return `https://placehold.co/96x96/e5e7eb/7f8388?text=${(
                cartItem.type || "I"
            )
                .charAt(0)
                .toUpperCase()}`;
        }

        const path = thumbnailPath.replace(/^\/+/, "");
        if (
            path.includes("default-event-images") ||
            path.includes("storage")
        ) {
            return `${baseUrl}/storage/${path}`;
        }
        return `${baseUrl}/storage/thumbnails/${path}`;
    };

    return (
        <div
            className={`p-4 transition-colors ${
                status.disabled ? "bg-gray-50/50" : "hover:bg-gray-50/50"
            }`}
        >
            <div className="flex gap-4">
                {/* Checkbox */}
                <div className="pt-1">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onSelect(item.id)}
                        disabled={
                            status.disabled &&
                            !status.allowDelete &&
                            status.type !== "ticket_sold" &&
                            status.type !== "event_banned" &&
                            status.type !== "already_booked_by_me"
                        }
                        className={
                            status.disabled && !status.allowDelete
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                        }
                    />
                </div>

                {/* Image */}
                <div className="relative w-24 h-24 flex-shrink-0">
                    <img
                        src={getThumbnailSrc(item)}
                        alt={
                            item.type === "ticket"
                                ? item.item?.event?.name
                                : item.item?.name
                        }
                        className={`w-full h-full object-cover rounded-lg border ${
                            status.disabled ? "opacity-50 grayscale" : ""
                        }`}
                        loading="lazy"
                        onError={() => setImageError(true)}
                    />
                    <div className="absolute top-1 left-1">
                        <Badge
                            variant="secondary"
                            className={`text-[10px] px-1.5 h-5 ${getTypeColor(
                                item.type
                            )}`}
                        >
                            <TypeIcon className="w-3 h-3 mr-1" />
                            {getTypeLabel(item.type)}
                        </Badge>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start gap-2">
                            <Link
                                href={getDetailUrl(
                                    item.type,
                                    item.item?.event_id,
                                    item.item_id
                                )}
                                className={`font-medium text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors ${
                                    status.disabled ? "text-gray-500" : ""
                                }`}
                            >
                                {item.type === "ticket"
                                    ? item.item?.event?.name
                                    : item.item?.name}
                            </Link>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-red-600 -mt-1 -mr-2"
                                onClick={() => onDelete(item.id)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>

                        {item.type === "ticket" && (
                            <p className="text-sm text-gray-500 mt-1">
                                {item.item?.name}
                            </p>
                        )}

                        {/* Rent Date / Event Date */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            {item.rent_days && (
                                <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{formatDate(item.rent_days)}</span>
                                </div>
                            )}
                            {item.type === "ticket" &&
                                item.item?.event?.event_date_start && (
                                    <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2 py-1 rounded">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>
                                            {formatDate(
                                                item.item.event.event_date_start
                                            )}
                                        </span>
                                    </div>
                                )}
                            {item.type === "ticket" &&
                                item.item?.event?.time_start && (
                                    <div className="flex items-center gap-1.5 bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>
                                            {item.item.event.time_start.substring(
                                                0,
                                                5
                                            )}{" "}
                                            WIB
                                        </span>
                                    </div>
                                )}
                        </div>

                        {/* Error/Warning Message */}
                        {status.disabled && status.reason && (
                            <div
                                className={`mt-2 flex items-start gap-2 text-xs p-2 rounded-md ${colors.bg} ${colors.text} border ${colors.border}`}
                            >
                                <div className={`mt-0.5 ${colors.icon}`}>
                                    {getSeverityIcon(status.severity)}
                                </div>
                                <span>{status.reason}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 mt-3">
                        {/* Delivery Options for Property */}
                        {item.type === "property" &&
                            (!status.disabled || status.type === "ticket_sold") &&
                            (() => {
                                const hasPickup =
                                    item.item?.picked_up === 1 ||
                                    item.item?.picked_up === true;
                                const hasDelivery =
                                    item.item?.delivered === 1 ||
                                    item.item?.delivered === true;

                                if (!hasPickup && !hasDelivery) {
                                    return (
                                        <div className="text-xs text-yellow-800 bg-yellow-50 p-2 rounded border border-yellow-100">
                                            Metode penyewaan belum ditentukan
                                        </div>
                                    );
                                }

                                if (
                                    (hasPickup && !hasDelivery) ||
                                    (!hasPickup && hasDelivery)
                                ) {
                                    const singleLabel = hasPickup
                                        ? "Ambil di Tempat"
                                        : "Antar ke Alamat";
                                    return (
                                        <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 flex justify-between">
                                            <span>{singleLabel}</span>
                                            <span className="text-slate-500">
                                                (Opsi tunggal)
                                            </span>
                                        </div>
                                    );
                                }

                                return (
                                    <Select
                                        value={
                                            item.delivery_type ||
                                            (hasPickup ? "pickup" : "delivery")
                                        }
                                        onValueChange={(value) =>
                                            onDeliveryChange(item.id, value)
                                        }
                                        disabled={
                                            status.disabled &&
                                            status.type !== "ticket_sold" &&
                                            status.type !== "event_banned" &&
                                            status.type !== "already_booked_by_me"
                                        }
                                    >
                                        <SelectTrigger className="w-full h-8 text-xs">
                                            <SelectValue placeholder="Pilih pengiriman" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {hasPickup && (
                                                <SelectItem value="pickup">
                                                    Ambil di Tempat
                                                </SelectItem>
                                            )}
                                            {hasDelivery && (
                                                <SelectItem value="delivery">
                                                    Antar ke Alamat
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                );
                            })()}

                        <div className="flex items-end justify-between">
                            <div className="font-semibold text-blue-600">
                                Rp {formatRupiah(item.item?.price)}
                            </div>

                            {/* Quantity Control */}
                            {item.type === "ticket" ? (
                                <div className="flex items-center border rounded-lg bg-white shadow-sm">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-l-lg hover:bg-gray-50"
                                        onClick={() =>
                                            onQtyChange(item.id, item.item_qty - 1)
                                        }
                                        disabled={
                                            item.item_qty <= 1 ||
                                            (status.disabled &&
                                                status.type !== "ticket_sold" &&
                                                status.type !== "event_banned" &&
                                                status.type !==
                                                    "already_booked_by_me")
                                        }
                                    >
                                        <Minus className="w-3 h-3" />
                                    </Button>
                                    <div className="w-10 text-center text-sm font-medium">
                                        {item.item_qty}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-r-lg hover:bg-gray-50"
                                        onClick={() =>
                                            onQtyChange(item.id, item.item_qty + 1)
                                        }
                                        disabled={
                                            status.disabled &&
                                            status.type !== "ticket_sold" &&
                                            status.type !== "event_banned" &&
                                            status.type !== "already_booked_by_me"
                                        }
                                    >
                                        <Plus className="w-3 h-3" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-lg border">
                                    1 Paket
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Separator className="mt-4" />
        </div>
    );
});

CartItem.displayName = "CartItem";

export default CartItem;
