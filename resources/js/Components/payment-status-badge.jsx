import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

/**
 * OPTIMIZED: Payment Status Badge with O(1) lookup
 * - Uses constant object for instant status mapping
 * - Auto-detects expired transactions in real-time
 * - Consistent styling with shadcn/ui Badge component
 */

// O(1) status configuration lookup
const STATUS_CONFIG = {
    authorize: {
        label: "Otorisasi",
        className:
            "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200",
    },
    capture: {
        label: "Diterima",
        className:
            "bg-green-100 text-green-700 border-green-200 hover:bg-green-200",
    },
    settlement: {
        label: "Berhasil",
        className:
            "bg-green-100 text-green-700 border-green-200 hover:bg-green-200",
    },
    pending: {
        label: "Menunggu Pembayaran",
        className:
            "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200",
    },
    deny: {
        label: "Ditolak",
        className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200",
    },
    cancelled: {
        label: "Dibatalkan",
        className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200",
    },
    expire: {
        label: "Kedaluwarsa",
        className:
            "bg-gray-200 text-gray-700 border-gray-300 hover:bg-gray-300",
    },
    expired: {
        label: "Waktu Habis",
        className:
            "bg-gray-200 text-gray-700 border-gray-300 hover:bg-gray-300",
    },
    failure: {
        label: "Gagal",
        className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200",
    },
    refund: {
        label: "Refund",
        className:
            "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200",
    },
    partial_refund: {
        label: "Refund Sebagian",
        className:
            "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200",
    },
    chargeback: {
        label: "Chargeback",
        className:
            "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200",
    },
    partial_chargeback: {
        label: "Chargeback Sebagian",
        className:
            "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200",
    },
    sold_out: {
        label: "Sudah Habis Terjual",
        className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200",
    },
};

// Default fallback configuration
const DEFAULT_CONFIG = {
    label: "Status Tidak Dikenal",
    className: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200",
};

export default function PaymentStatusBadge({ status, expired_at }) {
    // FIXED: Use state to track expired status that updates in real-time
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        // Only check expiration for pending transactions
        if (!expired_at || status !== "pending") {
            setIsExpired(false);
            return;
        }

        // Function to check if expired
        const checkExpired = () => {
            try {
                const expiredDate = new Date(expired_at.replace(" ", "T"));
                const expired = expiredDate.getTime() <= Date.now();
                setIsExpired(expired);
                return expired;
            } catch (e) {
                return false;
            }
        };

        // Check immediately
        const expired = checkExpired();

        // If not expired yet, set up interval to check every second
        if (!expired) {
            const interval = setInterval(() => {
                const nowExpired = checkExpired();
                // Stop interval once expired
                if (nowExpired) {
                    clearInterval(interval);
                }
            }, 1000); // Check every 1 second

            return () => clearInterval(interval);
        }
    }, [expired_at, status]);

    // FIXED: Override status to "expired" if transaction time has passed
    const finalStatus = isExpired ? "expired" : status;

    // O(1) lookup for status configuration
    const config = finalStatus
        ? STATUS_CONFIG[finalStatus] || DEFAULT_CONFIG
        : DEFAULT_CONFIG;

    return (
        <Badge
            className={`font-medium text-xs sm:text-sm px-2 w-fit sm:px-3 py-1 rounded-full transition-colors ${config.className}`}
        >
            {config.label}
        </Badge>
    );
}
