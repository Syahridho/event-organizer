import React from "react";
import { Badge } from "@/components/ui/badge";

export default function PaymentStatusBadge({ status }) {
    if (!status) {
        return <Badge variant="outline">Status tidak diketahui</Badge>;
    }

    // Mapping status Midtrans ke bahasa Indonesia + style warna
    const statusMap = {
        authorize: {
            label: "Otorisasi",
            className: "bg-blue-100 text-blue-700",
        },
        capture: {
            label: "Diterima",
            className: "bg-green-100 text-green-700",
        },
        settlement: {
            label: "Berhasil",
            className: "bg-green-100 text-green-700",
        },
        pending: {
            label: "Menunggu Pembayaran",
            className: "bg-yellow-100 text-yellow-700",
        },
        deny: { label: "Ditolak", className: "bg-red-100 text-red-700" },
        cancelled: {
            label: "Dibatalkan",
            className: "bg-red-100 text-red-700",
        },
        expire: {
            label: "Kedaluwarsa",
            className: "bg-gray-200 text-gray-700",
        },
        failure: { label: "Gagal", className: "bg-red-100 text-red-700" },
        refund: { label: "Refund", className: "bg-purple-100 text-purple-700" },
        partial_refund: {
            label: "Refund Sebagian",
            className: "bg-purple-100 text-purple-700",
        },
        chargeback: {
            label: "Chargeback",
            className: "bg-orange-100 text-orange-700",
        },
        partial_chargeback: {
            label: "Chargeback Sebagian",
            className: "bg-orange-100 text-orange-700",
        },
    };

    const { label, className } = statusMap[status] || {
        label: "Status Tidak Dikenal",
        className: "bg-gray-100 text-gray-700",
    };

    return (
        <Badge className={`font-medium px-3 py-1 rounded-full ${className}`}>
            {label}
        </Badge>
    );
}
