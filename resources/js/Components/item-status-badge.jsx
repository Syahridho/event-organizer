import React from "react";
import { Badge } from "@/components/ui/badge";

const ItemStatusBadge = ({ status }) => {
    let badgeClass =
        "bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300";
    let statusText = "Tidak Diketahui";

    switch (status) {
        case "pending":
            badgeClass =
                "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200";
            statusText = "Menunggu";
            break;
        case "on_process":
            badgeClass =
                "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200";
            statusText = "Diproses";
            break;
        case "ready_for_pickup":
            badgeClass =
                "bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200";
            statusText = "Siap Diambil";
            break;
        case "work":
            badgeClass =
                "bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200";
            statusText = "Siap Diambil";
            break;
        case "on_delivery":
            badgeClass =
                "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200";
            statusText = "Dalam Pengiriman";
            break;
        case "completed":
            badgeClass =
                "bg-green-100 text-green-800 border-green-300 hover:bg-green-200";
            statusText = "Selesai";
            break;
        case "cancelled":
            badgeClass =
                "bg-red-100 text-red-800 border-red-300 hover:bg-red-200";
            statusText = "Dibatalkan";
            break;
        default:
            badgeClass =
                "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200";
            statusText = "Tidak Diketahui";
            break;
    }

    return (
        <Badge className={`px-2 py-1 text-xs font-semibold ${badgeClass}`}>
            {statusText}
        </Badge>
    );
};

export default ItemStatusBadge;
