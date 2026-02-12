import React, { useState, useEffect } from "react";

// Add cache-busting query parameter to ensure latest version is loaded
const cacheBuster = Date.now();
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Label } from "@/components/ui/label.jsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select.jsx";
import { Loader2, Wallet, CreditCard } from "lucide-react";
import { useForm } from "@inertiajs/react";
import { toast } from "sonner";

const PropertyConfirmDialog = ({
    isOpen,
    onOpenChange,
    property,
    selectedDate,
    selectedAddress,
    note,
    tax_info,
    formatPrice,
    handlePayment,
    snapLoaded,
    setIsLoading,
    isLoading,
    setIsPaymentOpen,
    deliveryOption,
    user,
    saldo_user,
}) => {
    const [paymentMethod, setPaymentMethod] = useState("midtrans");
    const [walletBalance, setWalletBalance] = useState(0);
    const [isCheckingBalance, setIsCheckingBalance] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        items: property
            ? [
                  {
                      id: property.id,
                      name: property.name,
                      price: property.final_price || property.price,
                      quantity: 1,
                      type: "rent_property",
                      rent_days: selectedDate
                          ? selectedDate.toLocaleDateString("en-CA", {
                                timeZone: "Asia/Jakarta",
                            })
                          : null,
                      note: note || "", // Add note field to initial form data
                  },
              ]
            : [],
        amount: property ? property.final_price || property.price : 0,
        payment_method: "midtrans", // Default to midtrans, will be updated when wallet is selected
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        redirect_url: window.location.href,
        token: null,
    });

    const fetchWalletBalance = async () => {
        if (!user) return;

        setIsCheckingBalance(true);
        try {
            const response = await fetch(route("wallet.balance"), {
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Gagal mengambil saldo wallet");
            }

            const result = await response.json();
            setWalletBalance(result.balance || 0);
        } catch (error) {
            console.error("Error fetching wallet balance:", error);
            toast.error("Gagal mengambil saldo wallet");
        } finally {
            setIsCheckingBalance(false);
        }
    };

    useEffect(() => {
        if (isOpen && paymentMethod === "wallet") {
            fetchWalletBalance();
        }
    }, [isOpen, paymentMethod]);

    const handleWalletPayment = () => {
        if (!property || !selectedDate) {
            toast.error("Data properti atau tanggal tidak lengkap");
            return;
        }

        const totalPrice = property.final_price || property.price;

        if (walletBalance < totalPrice) {
            toast.error("Saldo wallet tidak mencukupi");
            return;
        }

        setIsLoading((prev) => ({ ...prev, payment: true }));

        setData("items", [
            {
                id: property.id,
                name: property.name,
                price: totalPrice,
                quantity: 1,
                type: "rent_property",
                rent_days: selectedDate.toLocaleDateString("en-CA", {
                    timeZone: "Asia/Jakarta",
                }),
                note: note || "", // Add note field to make it optional
            },
        ]);
        setData("amount", totalPrice);
        setData("payment_method", "wallet"); // Explicitly set payment method to wallet

        if (deliveryOption === "delivery" && selectedAddress) {
            setData("shipping_address", selectedAddress);
        }

        post(route("wallet.pay"), {
            onSuccess: (page) => {
                setIsLoading((prev) => ({ ...prev, payment: false }));
                toast.success("Pembayaran dengan wallet berhasil!");
                onOpenChange(false);
                window.location.href = "/purchase";
            },
            onError: (errors) => {
                setIsLoading((prev) => ({ ...prev, payment: false }));
                console.error("Wallet payment error:", errors);
                if (errors.message) {
                    toast.error(errors.message);
                } else {
                    toast.error(
                        "Terjadi kesalahan saat memproses pembayaran wallet"
                    );
                }
            },
            onFinish: () => {
                setIsLoading((prev) => ({ ...prev, payment: false }));
            },
        });
    };

    const handleConfirmPayment = () => {
        if (paymentMethod === "wallet") {
            handleWalletPayment();
        } else {
            handlePayment();
        }
    };

    const handleOpenChange = (open) => {
        if (!open) {
            setIsPaymentOpen(true);
        }
        onOpenChange(open);
    };

    const totalPrice = property ? property.final_price || property.price : 0;
    const isWalletSufficient = walletBalance >= totalPrice;

    return (
        <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Konfirmasi Penyewaan Properti
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Periksa kembali detail penyewaan properti Anda sebelum
                        melanjutkan pembayaran.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex-1 overflow-y-auto py-4">
                    <div className="bg-slate-50 border rounded-md p-5 text-sm space-y-3">
                        <div className="text-center font-semibold mb-4 tracking-wide">
                            RINCIAN PENYEWAAN
                        </div>

                        <div className="flex justify-between py-2 border-b">
                            <span className="text-slate-600">Properti</span>
                            <span className="font-medium">
                                {property?.name}
                            </span>
                        </div>

                        <div className="flex justify-between py-2 border-b">
                            <span className="text-slate-600">Harga Dasar</span>
                            <span className="font-medium">
                                {formatPrice(property?.price)} / hari
                            </span>
                        </div>

                        {property?.tax_amount > 0 && (
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-slate-600">
                                    Pajak (
                                    {tax_info?.type === "percent"
                                        ? `${tax_info?.value}%`
                                        : "Fixed"}
                                    )
                                </span>
                                <span className="font-medium">
                                    {formatPrice(property?.tax_amount)}
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
                                        const tanggal = d.toLocaleDateString(
                                            "id-ID",
                                            {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            }
                                        );
                                        return `${tanggal} (${hari})`;
                                    })()
                                ) : (
                                    <p className="text-sm text-red-600 font-medium">
                                        ⚠ Tanggal belum dipilih
                                    </p>
                                )}
                            </span>
                        </div>

                        <div className="flex justify-between py-2 border-b">
                            <span className="text-slate-600">Metode</span>
                            <span className="font-medium">
                                {deliveryOption === "delivery"
                                    ? "Diantar ke Alamat"
                                    : "Ambil di Lokasi"}
                            </span>
                        </div>

                        <div className="py-3 border-b">
                            {deliveryOption === "delivery" ? (
                                selectedAddress ? (
                                    <div className="space-y-2">
                                        <span className="block text-slate-600">
                                            Alamat Penyewa (
                                            {selectedAddress.label})
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
                                        ⚠ Alamat belum dipilih
                                    </p>
                                )
                            ) : (
                                <div className="space-y-2">
                                    <span className="block text-slate-600">
                                        Lokasi Properti
                                    </span>
                                    <p className="text-sm font-medium text-slate-800">
                                        {property?.location}
                                    </p>
                                </div>
                            )}
                        </div>

                        {note && (
                            <div className="py-3 border-b">
                                <span className="block text-slate-600 mb-2">
                                    Catatan
                                </span>
                                <p className="text-sm text-slate-800">{note}</p>
                            </div>
                        )}

                        <div className="flex justify-between py-3 mt-2 border-t font-semibold text-base">
                            <span>Total</span>
                            <span>{formatPrice(totalPrice)}</span>
                        </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="mt-6 space-y-4">
                        <div>
                            <Label className="text-sm font-medium">
                                Metode Pembayaran
                            </Label>
                            <Select
                                value={paymentMethod}
                                onValueChange={setPaymentMethod}
                            >
                                <SelectTrigger className="mt-2">
                                    <SelectValue placeholder="Pilih metode pembayaran" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="midtrans">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" />
                                            <span>Midtrans</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="wallet">
                                        <div className="flex items-center gap-2">
                                            <Wallet className="h-4 w-4" />
                                            <span>Wallet</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {paymentMethod === "wallet" && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-blue-900">
                                            Saldo Wallet Anda
                                        </p>
                                        <p className="text-lg font-bold text-blue-900">
                                            {isCheckingBalance ? (
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    <span>Memeriksa...</span>
                                                </div>
                                            ) : (
                                                formatPrice(walletBalance)
                                            )}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-blue-700">
                                            Total Pembayaran
                                        </p>
                                        <p className="text-lg font-bold text-blue-900">
                                            {formatPrice(totalPrice)}
                                        </p>
                                    </div>
                                </div>
                                {!isWalletSufficient && walletBalance > 0 && (
                                    <p className="text-sm text-red-600 mt-2">
                                        Saldo wallet tidak mencukupi. Kurang{" "}
                                        {formatPrice(
                                            totalPrice - walletBalance
                                        )}
                                    </p>
                                )}
                                {walletBalance === 0 && !isCheckingBalance && (
                                    <p className="text-sm text-red-600 mt-2">
                                        Saldo wallet kosong. Silakan top up
                                        terlebih dahulu.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <AlertDialogFooter className="flex-shrink-0 pt-4 border-t">
                    <AlertDialogCancel
                        onClick={() => {
                            onOpenChange(false);
                            setIsPaymentOpen(true);
                        }}
                    >
                        Batal
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirmPayment}
                        disabled={
                            (paymentMethod === "wallet" &&
                                (!isWalletSufficient || isCheckingBalance)) ||
                            (paymentMethod === "midtrans" && !snapLoaded) ||
                            isLoading.payment ||
                            processing
                        }
                    >
                        {isLoading.payment || processing ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Memproses...
                            </div>
                        ) : (
                            `Bayar dengan ${
                                paymentMethod === "wallet"
                                    ? "Wallet"
                                    : "Midtrans"
                            }`
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default PropertyConfirmDialog;
