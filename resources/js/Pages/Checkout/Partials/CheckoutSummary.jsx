import React, { memo } from "react";
import { Button } from "@/components/ui/button.jsx";
import { formatRupiah } from "@/Utils/formatRupiah.js";
import { FaCreditCard } from "react-icons/fa";

const CheckoutSummary = memo(({
    itemCount,
    subtotal,
    taxInfo,
    taxAmount,
    totalWithTax,
    onPayment,
    isProcessing,
    snapLoaded,
    isAddressRequired,
    hasSelectedAddress,
}) => {
    return (
        <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border p-6 sticky top-4 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">
                    Ringkasan Pesanan
                </h2>

                <div className="space-y-3">
                    <div className="flex justify-between text-gray-600 text-sm">
                        <span>
                            Subtotal ({itemCount} item)
                        </span>
                        <span className="font-medium">
                            Rp {formatRupiah(subtotal)}
                        </span>
                    </div>
                    <div className="flex justify-between text-gray-600 text-sm">
                        <span>{taxInfo?.label || "Pajak"}</span>
                        <span className="font-medium">
                            Rp {formatRupiah(taxAmount)}
                        </span>
                    </div>
                    <hr className="my-3" />
                    <div className="flex flex-col justify-between font-bold text-lg">
                        <span>Total Pembayaran</span>
                        <span className="text-blue-600">
                            Rp {formatRupiah(totalWithTax)}
                        </span>
                    </div>
                </div>

                <Button
                    className="w-full mt-6"
                    size="lg"
                    onClick={onPayment}
                    disabled={
                        isProcessing ||
                        !snapLoaded ||
                        (isAddressRequired && !hasSelectedAddress)
                    }
                >
                    {isProcessing ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Memproses...
                        </div>
                    ) : !snapLoaded ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Loading...
                        </div>
                    ) : (
                        <>
                            <FaCreditCard className="w-4 h-4 mr-2" />
                            Bayar Sekarang
                        </>
                    )}
                </Button>

                {isAddressRequired && !hasSelectedAddress && (
                    <p className="text-xs text-red-500 text-center mt-2">
                        Silakan pilih alamat pengiriman
                    </p>
                )}

                {!snapLoaded && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                        Memuat sistem pembayaran...
                    </p>
                )}

                <div className="mt-4 text-xs text-gray-500 text-center space-y-1">
                    <p className="font-medium">
                        Pembayaran aman terpercaya
                    </p>
                    <p>Transfer Bank • E-Wallet • Kartu Kredit</p>
                </div>
            </div>
        </div>
    );
});

CheckoutSummary.displayName = "CheckoutSummary";

export default CheckoutSummary;
