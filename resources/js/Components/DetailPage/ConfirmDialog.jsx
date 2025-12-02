import React from "react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

const ConfirmDialog = ({
    isOpen,
    onOpenChange,
    service,
    selectedDate,
    selectedAddress,
    note,
    tax_info,
    formatPrice,
    handlePayment,
    snapLoaded,
    isLoading,
    setIsPaymentOpen,
}) => {
    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                <AlertDialogHeader className="flex-shrink-0">
                    <AlertDialogTitle>
                        Konfirmasi Pembayaran
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Pastikan semua data sudah benar sebelum melanjutkan
                        pembayaran.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex-1 overflow-y-auto py-4">
                    <div className="bg-slate-50 border rounded-md p-5 text-sm space-y-3">
                        <div className="text-center font-semibold mb-4 tracking-wide">
                            RINCIAN PEMBELIAN
                        </div>

                        <div className="flex justify-between py-2 border-b">
                            <span className="text-slate-600">Layanan</span>
                            <span className="font-medium">
                                {service.name}
                            </span>
                        </div>

                        <div className="flex justify-between py-2 border-b">
                            <span className="text-slate-600">
                                Harga Dasar
                            </span>
                            <span className="font-medium">
                                {formatPrice(service.price)} / hari
                            </span>
                        </div>

                        {service.tax_amount > 0 && (
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-slate-600">
                                    Pajak (
                                    {tax_info?.type === "percent"
                                        ? `${tax_info?.value}%`
                                        : "Fixed"}
                                    )
                                </span>
                                <span className="font-medium">
                                    {formatPrice(service.tax_amount)}
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between py-2 border-b">
                            <span className="text-slate-600">Tanggal</span>
                            <span className="font-medium">
                                {selectedDate ? (
                                    (() => {
                                        const d = new Date(selectedDate);
                                        const hari = d.toLocaleDateString(
                                            "id-ID",
                                            { weekday: "long" }
                                        );
                                        const tanggal =
                                            d.toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            });
                                        return `${tanggal} (${hari})`;
                                    })()
                                ) : (
                                    <p className="text-sm text-red-600 font-medium">
                                        Tanggal belum dipilih
                                    </p>
                                )}
                            </span>
                        </div>

                        <div className="py-3">
                            {selectedAddress ? (
                                <div className="space-y-2">
                                    <span className="block text-slate-600">
                                        Alamat ({selectedAddress.label})
                                    </span>
                                    <div className="text-sm font-medium text-slate-800">
                                        <p>
                                            {selectedAddress.recipient_name}{" "}
                                            - {selectedAddress.phone}
                                        </p>
                                        <p className="leading-relaxed">
                                            {selectedAddress.address_line},{" "}
                                            {selectedAddress.district},{" "}
                                            {selectedAddress.city},{" "}
                                            {selectedAddress.province}{" "}
                                            {selectedAddress.postal_code}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-red-600 font-medium">
                                    Alamat belum dipilih
                                </p>
                            )}
                        </div>

                        {note && (
                            <div className="py-3 border-b">
                                <span className="block text-slate-600 mb-2">
                                    Catatan
                                </span>
                                <p className="text-sm text-slate-800">
                                    {note}
                                </p>
                            </div>
                        )}

                        <div className="flex justify-between py-3 mt-2 border-t font-semibold text-base">
                            <span>Total</span>
                            <span>
                                {formatPrice(
                                    service.final_price || service.price
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                <AlertDialogFooter className="flex-shrink-0 pt-4">
                    <AlertDialogCancel
                        onClick={() => {
                            onOpenChange(false);
                            setIsPaymentOpen(true);
                        }}
                    >
                        Batal
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handlePayment}
                        disabled={!snapLoaded || isLoading.payment}
                    >
                        {isLoading.payment ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Memproses...
                            </div>
                        ) : (
                            "Bayar"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default ConfirmDialog;
