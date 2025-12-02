import React, { memo } from "react";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import { ShoppingCart } from "lucide-react";
import { formatRupiah } from "@/Utils/formatRupiah.jsx";

const CartSummary = memo(({
    selectedCount,
    subtotal,
    taxAmount,
    totalWithTax,
    taxInfo,
    onCheckout,
    isCheckingOut,
}) => {
    return (
        <div className="lg:col-span-1">
            <div className="sticky top-24">
                <Card className="shadow-sm border-gray-200">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">
                            Ringkasan Belanja
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Total Harga ({selectedCount} barang)</span>
                                <span>Rp {formatRupiah(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>{taxInfo?.label || "Pajak"}</span>
                                <span>Rp {formatRupiah(taxAmount)}</span>
                            </div>
                        </div>

                        <Separator />

                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-900">
                                Total Belanja
                            </span>
                            <span className="font-bold text-xl text-blue-600">
                                Rp {formatRupiah(totalWithTax)}
                            </span>
                        </div>

                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            size="lg"
                            onClick={onCheckout}
                            disabled={selectedCount === 0 || isCheckingOut}
                        >
                            {isCheckingOut ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Memproses...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <ShoppingCart className="w-4 h-4" />
                                    <span>Beli ({selectedCount})</span>
                                </div>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
});

CartSummary.displayName = "CartSummary";

export default CartSummary;
