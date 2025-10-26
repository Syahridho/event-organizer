import React from "react";
import { Badge } from "@/components/ui/badge";

/**
 * OPTIMIZED: Item Status Badge with O(1) lookup
 * - Eliminates switch statement with constant object lookup
 * - Faster rendering with no conditional logic
 * - Consistent styling with shadcn/ui Badge component
 * - Responsive text sizing
 */

// O(1) status configuration lookup
const STATUS_CONFIG = {
    pending: {
        label: "Menunggu",
        className:
            "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200",
    },
    confirmed: {
        label: "Diterima",
        className:
            "bg-green-100 text-green-800 border-green-300 hover:bg-green-200",
    },
    on_process: {
        label: "Diproses",
        className:
            "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200",
    },
    ready_for_pickup: {
        label: "Siap Diambil",
        className:
            "bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200",
    },
    work: {
        label: "Sedang Dikerjakan",
        className:
            "bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200",
    },
    otw: {
        label: "Dalam Pengiriman",
        className:
            "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200",
    },
    completed: {
        label: "Selesai",
        className:
            "bg-green-100 text-green-800 border-green-300 hover:bg-green-200",
    },
    cancelled: {
        label: "Dibatalkan",
        className: "bg-red-100 text-red-800 border-red-300 hover:bg-red-200",
    },
};

// Default fallback configuration
const DEFAULT_CONFIG = {
    label: "Tidak Diketahui",
    className: "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200",
};

const ItemStatusBadge = ({ status }) => {
    // O(1) lookup for status configuration
    const config = status
        ? STATUS_CONFIG[status] || DEFAULT_CONFIG
        : DEFAULT_CONFIG;

    return (
        <Badge
            className={`px-2 py-1 text-xs font-semibold transition-colors ${config.className}`}
        >
            {config.label}
        </Badge>
    );
};

export default ItemStatusBadge;
