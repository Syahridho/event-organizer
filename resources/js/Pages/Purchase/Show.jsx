import React, { useMemo, useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import PaymentStatusBadge from "@/Components/payment-status-badge.jsx";
import formatDateIndo from "@/Utils/formatDateIndo.js";
import { formatRupiah } from "@/Utils/formatRupiah.js";
import { Button } from "@/components/ui/button.jsx";
import { ArrowLeft } from "lucide-react";
import MainLayout from "@/Layouts/Main.jsx";
import Countdown from "@/Utils/CountDown.jsx";
import { useCallback } from "react";

export default function Show({ transaction }) {
    const { ziggy } = usePage().props;

    const expiredDate = new Date(transaction.expired_at?.replace(" ", "T"));
    const [isExpired, setIsExpired] = useState(
        expiredDate.getTime() - 1000 <= Date.now()
    );

    const subtotal = useMemo(
        () =>
            (transaction.items || []).reduce(
                (sum, it) =>
                    sum + (Number(it.price) || 0) * (Number(it.qty) || 0),
                0
            ),
        [transaction.items]
    );
    const getItemThumbnail = useCallback(
        (item) => {
            const thumb =
                item?.thumbnail ||
                item?.item?.thumbnail ||
                item?.item?.event?.thumbnail;
            if (!thumb) return "/default-event-images/dubby.webp";
            return thumb.includes("default-event-images")
                ? `${ziggy.url}/storage${thumb}`
                : `${ziggy.url}/storage/thumbnails/${thumb}`;
        },
        [ziggy.url]
    );

    const taxAmount = Number(transaction.tax) || 0;

    return (
        <>
            <Head title={`Detail Pesanan ${transaction.order_id}`} />

            <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 my-6 sm:my-10">
                {/* Back Button */}
                <Button
                    onClick={() => window.history.back()}
                    variant="outline"
                    size="sm"
                    className="mb-4 sm:mb-6"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                </Button>

                {/* Order Info */}
                <Card>
                    <CardContent className="p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <h1 className="text-lg font-semibold">
                                Order ID: {transaction.order_id}
                            </h1>
                            <PaymentStatusBadge
                                status={transaction.status}
                                expired_at={transaction.expired_at}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                            <span className="text-gray-600">Total</span>
                            <span className="font-medium">
                                Rp{" "}
                                {parseInt(transaction.total).toLocaleString()}
                            </span>

                            {/* <span className="text-gray-600">Metode Bayar</span> */}
                            {/* <span>
                                {transaction.payment_type || (
                                    <Badge variant="outline">
                                        Belum dipilih
                                    </Badge>
                                )}
                            </span> */}

                            <span className="text-gray-600">Tanggal</span>
                            <span>
                                {formatDateIndo(transaction.created_at)}
                            </span>

                            <span className="text-gray-600">Batas Waktu</span>
                            <span className="flex items-center gap-2">
                                {transaction.status === "pending" ? (
                                    <Countdown
                                        expired_at={transaction.expired_at}
                                        onExpired={() => setIsExpired(true)}
                                    />
                                ) : (
                                    formatDateIndo(transaction.expired_at)
                                )}
                            </span>
                        </div>

                        {/* Link bayar jika pending dan belum melewati 1 detik dari batas waktu */}
                        {transaction.status === "pending" &&
                            transaction.redirect_url &&
                            !isExpired && (
                                <a
                                    href={transaction.redirect_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 w-full sm:w-auto px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 text-center"
                                >
                                    Lanjutkan Pembayaran
                                </a>
                            )}
                    </CardContent>
                </Card>

                {/* Items */}
                <Card>
                    <CardContent className="p-4">
                        <h2 className="text-lg font-semibold mb-4">
                            Item Pesanan
                        </h2>
                        <div className="space-y-4">
                            {transaction.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-3 gap-3"
                                >
                                    <div className="flex items-center space-x-3">
                                        <img
                                            src={getItemThumbnail(item)}
                                            alt={item.item.name}
                                            className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg"
                                        />
                                        <div>
                                            <p className="font-medium text-sm sm:text-base">
                                                {item.item.name}
                                            </p>
                                            <p className="text-xs sm:text-sm text-gray-500">
                                                x{item.qty} • Rp{" "}
                                                {formatRupiah(item.price)}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-medium text-sm sm:text-base">
                                        Rp {formatRupiah(item.price * item.qty)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* ✅ Ringkasan Pembayaran */}
                        <div className="mt-4 pt-3 space-y-2">
                            <div className="flex justify-between items-center text-sm sm:text-base">
                                <span>Subtotal</span>
                                <span>Rp {formatRupiah(subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm sm:text-base">
                                <span>Pajak</span>
                                <span>Rp {formatRupiah(taxAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-base sm:text-lg font-semibold border-t mt-8 pt-6">
                                <span>Total Pembayaran</span>
                                <span>
                                    Rp {formatRupiah(transaction.total)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Show.layout = (page) => <MainLayout children={page} />;
