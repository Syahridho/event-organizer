import { Head, Link, usePage } from "@inertiajs/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PaymentStatusBadge from "@/components/payment-status-badge";
import formatDateIndo from "@/Utils/formatDateIndo";

export default function Show({ transaction }) {
    const { ziggy } = usePage().props;
    return (
        <>
            <Head title={`Detail Pesanan ${transaction.order_id}`} />

            <div className="max-w-3xl mx-auto p-4 space-y-6">
                {/* Back Button */}
                <Link
                    href={route("purchase.index")}
                    className="text-blue-500 hover:underline"
                >
                    ← Kembali ke daftar
                </Link>

                {/* Order Info */}
                <Card>
                    <CardContent className="p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <h1 className="text-lg font-semibold">
                                Order ID: {transaction.order_id}
                            </h1>
                            <PaymentStatusBadge status={transaction.status} />
                        </div>

                        <div className="grid grid-cols-2 gap-y-2 text-sm">
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
                            <span>
                                {formatDateIndo(transaction.expired_at)}
                            </span>
                        </div>

                        {/* Link bayar jika pending */}
                        {transaction.status === "pending" &&
                            transaction.redirect_url && (
                                <a
                                    href={transaction.redirect_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block mt-2 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600"
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
                                    className="flex items-center justify-between border-b pb-3"
                                >
                                    <div className="flex items-center space-x-3">
                                        {item.item.thumbnail ? (
                                            <img
                                                src={`${ziggy.url}/storage/thumbnails/${item.item.thumbnail}`}
                                                alt={item.item.name}
                                                className="w-16 h-16 object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                                                No Image
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium">
                                                {item.item.name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                x{item.qty} • Rp{" "}
                                                {item.price.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-medium">
                                        Rp{" "}
                                        {(
                                            item.price * item.qty
                                        ).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* ✅ Tambahkan Total Pembayaran */}
                        <div className="flex justify-between items-center mt-4 pt-3 border-t text-lg font-semibold">
                            <span>Total Pembayaran</span>
                            <span>
                                Rp{" "}
                                {parseInt(transaction.total).toLocaleString(
                                    "id-ID"
                                )}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
