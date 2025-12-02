import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/Utils/formatRupiah";
import {
    FaTicketAlt,
    FaCalendarAlt,
    FaEdit,
} from "react-icons/fa";

const CheckoutItemList = memo(({
    items,
    itemNotes,
    onEditNote,
}) => {
    return (
        <div className="space-y-4">
            {items.map((item, index) => (
                <div
                    key={`${item.cart_id}-${index}`}
                    className="bg-white rounded-lg border p-4 shadow-sm"
                >
                    <div className="flex gap-4">
                        {/* Thumbnail */}
                        <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                            {item.thumbnail ? (
                                <img
                                    src={
                                        item.thumbnail.startsWith("http")
                                            ? item.thumbnail
                                            : `/${item.thumbnail}`
                                    }
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <FaTicketAlt />
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex justify-between">
                            <div className="space-y-1">
                                <h3 className="font-medium text-gray-900 line-clamp-2">
                                    {item.name}
                                </h3>
                                {item.type === "ticket" && item.ticket_name && (
                                    <p className="text-sm text-gray-500">
                                        {item.ticket_name}
                                    </p>
                                )}

                                {/* Rent Days / Event Date */}
                                {item.rent_days && (
                                    <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">
                                        <FaCalendarAlt className="mr-1" />
                                        {new Date(
                                            item.rent_days
                                        ).toLocaleDateString("id-ID", {
                                            weekday: "long",
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </div>
                                )}

                                {/* Note Display */}
                                {itemNotes[item.cart_id] && (
                                    <div className="mt-2 text-xs bg-yellow-50 text-yellow-800 p-2 rounded border border-yellow-100">
                                        <span className="font-semibold">
                                            Catatan:
                                        </span>{" "}
                                        {itemNotes[item.cart_id]}
                                    </div>
                                )}

                                <div className="text-xs text-gray-600">
                                    Rp {formatRupiah(item.price)} ×{" "}
                                    {item.quantity}{" "}
                                    {["service", "building", "property"].includes(
                                        item.type
                                    ) &&
                                        item.rent_days &&
                                        "Hari"}
                                    {["ticket"].includes(item.type) && "Tiket"}
                                </div>
                            </div>

                            <div className="text-right space-y-2">
                                <div className="font-bold text-sm text-blue-600">
                                    Rp{" "}
                                    {formatRupiah(item.price * item.quantity)}
                                </div>

                                {/* Add Note Button */}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onEditNote(item)}
                                    className="text-xs"
                                >
                                    <FaEdit className="mr-1" />
                                    {itemNotes[item.cart_id]
                                        ? "Edit Catatan"
                                        : "Tambah Catatan"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
});

CheckoutItemList.displayName = "CheckoutItemList";

export default CheckoutItemList;
