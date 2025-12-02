import React from "react";
import {
    Ticket,
    Wrench,
    Building2,
    Home,
    Package,
    XCircle,
    AlertCircle,
} from "lucide-react";

export const TYPE_LABELS = {
    ticket: "Tiket Event",
    service: "Jasa",
    building: "Gedung",
    property: "Properti",
};

export const TYPE_COLORS = {
    ticket: "bg-purple-100 text-purple-700 border-purple-200",
    service: "bg-blue-100 text-blue-700 border-blue-200",
    building: "bg-green-100 text-green-700 border-green-200",
    property: "bg-orange-100 text-orange-700 border-orange-200",
};

export const getTypeLabel = (type) => TYPE_LABELS[type] || type;
export const getTypeColor = (type) =>
    TYPE_COLORS[type] || "bg-gray-100 text-gray-700 border-gray-200";

export const getTypeIcon = (type) => {
    const TYPE_ICONS = {
        ticket: Ticket,
        service: Wrench,
        building: Building2,
        property: Home,
    };
    return TYPE_ICONS[type] || Package;
};

export const getDetailUrl = (type, eventId, itemId) => {
    const urlMap = {
        ticket: `/events/${eventId}`,
        service: `/services/${itemId}`,
        building: `/buildings/${itemId}`,
        property: `/propertys/${itemId}`,
    };
    return urlMap[type] || "#";
};

export const checkItemStatus = (item) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Rule 1: Sold Out Detection
    if (item.is_sold_out || item.item?.is_sold_out) {
        return {
            disabled: true,
            reason: "Item ini sudah habis terjual",
            type: "sold_out",
            severity: "error",
        };
    }

    // Rule 2: Booked by Other User
    if (
        item.is_booked_by_other &&
        ["service", "building", "property"].includes(item.type)
    ) {
        return {
            disabled: true,
            reason: "Tanggal ini sudah dibooking oleh user lain. Silakan hapus atau pilih tanggal lain.",
            type: "booked_by_other",
            severity: "error",
        };
    }

    // Rule 3: Backend Unavailability Flag
    if (item.is_unavailable == "unavailable") {
        if (item.type === "ticket") {
            return {
                disabled: true,
                reason: "Kuota tiket sudah habis atau tidak mencukupi",
                type: "unavailable",
                severity: "error",
            };
        } else {
            return {
                disabled: true,
                reason: "Tanggal ini sudah dibooking oleh orang lain",
                type: "booked",
                severity: "error",
            };
        }
    }

    // Rule 4: Rent Date Expiry for Rentable Items
    if (
        ["service", "building", "property"].includes(item.type) &&
        item.rent_days
    ) {
        const rentDate = new Date(item.rent_days);
        rentDate.setHours(0, 0, 0, 0);

        if (rentDate < now) {
            return {
                disabled: true,
                reason: "Tanggal sewa sudah terlewat. Silakan pilih tanggal baru.",
                type: "rent_expired",
                severity: "warning",
            };
        }
    }

    // Rule 5: Ticket Date Validation
    if (item.type === "ticket" && item.item?.event) {
        const event = item.item.event;

        // Check event end date
        const eventDateEnd = event.event_date_end
            ? new Date(event.event_date_end)
            : null;

        // Check ticket sales end date
        const ticketDateEnd = event.ticket_date_end
            ? new Date(event.ticket_date_end)
            : null;

        if (eventDateEnd) {
            eventDateEnd.setHours(23, 59, 59, 999);
            if (eventDateEnd < now) {
                return {
                    disabled: true,
                    reason: "Event sudah berakhir",
                    type: "event_ended",
                    severity: "error",
                };
            }
        }

        if (ticketDateEnd) {
            ticketDateEnd.setHours(23, 59, 59, 999);
            if (ticketDateEnd < now) {
                return {
                    disabled: true,
                    reason: "Periode penjualan tiket sudah berakhir",
                    type: "sales_ended",
                    severity: "error",
                };
            }
        }
    }

    // Rule 6: Ticket Sold Out
    if (item.type === "ticket" && item.item?.quota <= 0) {
        return {
            disabled: true,
            reason: "Tiket sudah habis terjual. Silakan hapus dari keranjang.",
            type: "ticket_sold",
            severity: "error",
            allowDelete: true,
        };
    }

    // Rule 7: Mitra on Leave
    if (item.is_mitra_on_leave) {
        return {
            disabled: true,
            reason: "Mitra sedang cuti pada tanggal yang dipilih. Silakan pilih tanggal lain.",
            type: "mitra_on_leave",
            severity: "warning",
        };
    }

    // Rule 8: Banned Event
    if (
        item.type === "ticket" &&
        (item.item?.event?.status === "banned" || item.is_event_banned)
    ) {
        return {
            disabled: true,
            reason: "Event ini telah dilarang/banned. Tidak dapat dibeli.",
            type: "event_banned",
            severity: "error",
            allowDelete: true,
        };
    }

    // Rule 9: Already Booked by User
    if (item.is_already_booked_by_me) {
        return {
            disabled: true,
            reason:
                item.booking_conflict_reason ||
                "Item ini sudah dibooking oleh Anda. Silakan hapus dari keranjang.",
            type: "already_booked_by_me",
            severity: "error",
            allowDelete: true,
        };
    }

    return { disabled: false, reason: null, type: null, severity: null };
};

export const getSeverityIcon = (severity) => {
    switch (severity) {
        case "error":
            return <XCircle className="w-4 h-4" />;
        case "warning":
            return <AlertCircle className="w-4 h-4" />;
        default:
            return <AlertCircle className="w-4 h-4" />;
    }
};

export const getSeverityColors = (severity) => {
    switch (severity) {
        case "error":
            return {
                bg: "bg-red-50",
                border: "border-red-200",
                text: "text-red-900",
                icon: "text-red-600",
            };
        case "warning":
            return {
                bg: "bg-amber-50",
                border: "border-amber-200",
                text: "text-amber-900",
                icon: "text-amber-600",
            };
        default:
            return {
                bg: "bg-gray-50",
                border: "border-gray-200",
                text: "text-gray-900",
                icon: "text-gray-600",
            };
    }
};

export const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
        // Handle both "T" and space as separator for time to support "YYYY-MM-DD HH:mm:ss" and ISO format
        const cleanDate = dateString.split(/[T ]/)[0];
        const [year, month, day] = cleanDate.split("-");
        
        // Ensure we have valid parts before creating Date
        if (!year || !month || !day) {
            return dateString;
        }

        const date = new Date(year, month - 1, day);

        if (isNaN(date.getTime())) {
            return dateString;
        }

        return date.toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    } catch (e) {
        console.error("Error formatting date:", e, dateString);
        return dateString;
    }
};
