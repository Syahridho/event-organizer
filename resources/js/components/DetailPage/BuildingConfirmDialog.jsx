import React, { useState, useEffect } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select.jsx";
import { Loader2, Wallet, CreditCard } from "lucide-react";
import { Label } from "@/components/ui/label.jsx";
import { Button } from "@/components/ui/button.jsx";
import { useForm, router } from "@inertiajs/react";

const BuildingConfirmDialog = ({
    isOpen,
    onOpenChange,
    building,
    selectedDate,
    note,
    tax_info,
    formatPrice,
    handlePayment,
    snapLoaded,
    isLoading,
    setIsPaymentOpen,
    user,
    saldo_user,
}) => {
    const [paymentMethod, setPaymentMethod] = useState("midtrans");
    const [walletBalance, setWalletBalance] = useState(0);
    const [availableBalance, setAvailableBalance] = useState(saldo_user ?? 0);
    const [isCheckingBalance, setIsCheckingBalance] = useState(false);
    const [balanceError, setBalanceError] = useState(null);
    const totalAmount = building.final_price || building.price;

    // Initialize form data with Inertia useForm
    const { data, setData, post, processing, errors } = useForm({
        items: building
            ? [
                  {
                      id: building.id,
                      price: building.price,
                      name: building.name,
                      type: "building",
                      quantity: 1,
                      rent_days: selectedDate,
                      note: note,
                  },
              ]
            : [],
        amount: totalAmount, // Use totalAmount (includes tax) instead of building?.price
        name: user?.name || "Guest User",
        email: user?.email || "guest@example.com",
        shipping_address: null, // Buildings don't need shipping address
    });

    const isBalanceSufficient = availableBalance >= totalAmount;
    const isWalletDisabled = !isBalanceSufficient && paymentMethod === "wallet";

    useEffect(() => {
        if (isOpen && user) {
            fetchWalletBalance();
        }
    }, [isOpen, user]);

    const fetchWalletBalance = async () => {
        setIsCheckingBalance(true);
        setBalanceError(null);
        try {
            // Use fetch to get wallet balance without navigating
            const response = await fetch(route("wallet.balance"), {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    Accept: "application/json",
                },
                credentials: "same-origin",
            });

            const data = await response.json();
            console.log("Wallet balance response:", data);

            if (data.success) {
                setWalletBalance(data.balance);
                setAvailableBalance(data.available_balance);
            } else {
                console.error("API returned success false:", data);
                setBalanceError(
                    "Gagal memuat saldo wallet: " +
                        (data.error || "Unknown error")
                );
            }
        } catch (error) {
            console.error("Failed to fetch wallet balance:", error);
            setBalanceError("Gagal memuat saldo wallet");
        } finally {
            setIsCheckingBalance(false);
        }
    };

    const handleWalletPayment = () => {
        if (!isBalanceSufficient) {
            alert("Saldo tidak mencukupi");
            return;
        }

        // Update form data with current values
        setData("items", [
            {
                id: building.id,
                price: building.price,
                name: building.name,
                type: "building",
                quantity: 1,
                rent_days: selectedDate,
                note: note,
            },
        ]);
        setData("amount", totalAmount); // Use totalAmount (includes tax) instead of building.price
        setData("name", user?.name || "Guest User");
        setData("email", user?.email || "guest@example.com");
        setData("shipping_address", null); // Buildings don't need shipping address

        post(route("wallet.pay"), {
            onSuccess: (page) => {
                console.log("Wallet payment success:", page);
                // The controller will redirect to the purchase page on success
                onOpenChange(false);
            },
            onError: (errors) => {
                console.error("Wallet payment error:", errors);
                alert("Pembayaran gagal: " + (errors.error || "Unknown error"));
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

    // Prevent dialog close on outside click when loading
    const handleOpenChange = (open) => {
        if (isLoading.payment) {
            return; // prevent closing while processing
        }
        onOpenChange(open);
    };
    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                <AlertDialogHeader className="flex-shrink-0">
                    <AlertDialogTitle>Konfirmasi Pembayaran</AlertDialogTitle>
                    <AlertDialogDescription>
                        Pastikan semua data sudah benar sebelum melanjutkan
                        pembayaran.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex-1 overflow-y-auto py-4">
                    <div className="bg-slate-50 border rounded-md p-5 text-sm space-y-3">
                        <div className="text-center font-semibold mb-4 tracking-wide">
                            RINCIAN PENYEWAAN
                        </div>

                        <div className="flex justify-between py-2 border-b">
                            <span className="text-slate-600">Gedung</span>
                            <span className="font-medium">{building.name}</span>
                        </div>

                        <div className="flex justify-between py-2 border-b">
                            <span className="text-slate-600">Kapasitas</span>
                            <span className="font-medium">
                                {building.capacity} orang
                            </span>
                        </div>

                        <div className="flex justify-between py-2 border-b">
                            <span className="text-slate-600">Harga Dasar</span>
                            <span className="font-medium">
                                {formatPrice(building.price)} / hari
                            </span>
                        </div>

                        {building.tax_amount > 0 && (
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-slate-600">
                                    Pajak (
                                    {tax_info?.type === "percent"
                                        ? `${tax_info?.value}%`
                                        : "Fixed"}
                                    )
                                </span>
                                <span className="font-medium">
                                    {formatPrice(building.tax_amount)}
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
                                        Tanggal belum dipilih
                                    </p>
                                )}
                            </span>
                        </div>

                        <div className="py-3 border-b">
                            <span className="block text-slate-600 mb-2">
                                Lokasi Gedung
                            </span>
                            <p className="text-sm font-medium text-slate-800">
                                {building.location}
                            </p>
                        </div>

                        {note && (
                            <div className="py-3 border-b">
                                <span className="block text-slate-600 mb-2">
                                    Catatan
                                </span>
                                <p className="text-sm text-slate-800">{note}</p>
                            </div>
                        )}

                        {/* Payment Method Selection */}
                        <div className="pt-4 border-t">
                            <Label
                                htmlFor="payment-method"
                                className="font-semibold text-slate-800 mb-2 block"
                            >
                                Metode Pembayaran
                            </Label>
                            <Select
                                value={paymentMethod}
                                onValueChange={setPaymentMethod}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih metode pembayaran" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="midtrans">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" />
                                            Bayar Sekarang
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="wallet">
                                        <div className="flex items-center gap-2">
                                            <Wallet className="h-4 w-4" />
                                            Gunakan Saldo Wallet
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Wallet Balance Info */}
                            {paymentMethod === "wallet" && (
                                <div className="mt-3 p-3 bg-slate-50 rounded-md text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">
                                            Saldo Tersedia:
                                        </span>
                                        <span
                                            className={`font-medium ${
                                                isBalanceSufficient
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                            }`}
                                        >
                                            {isCheckingBalance ? (
                                                <Loader2 className="h-3 w-3 animate-spin inline" />
                                            ) : (
                                                formatPrice(availableBalance)
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-slate-600">
                                            Total Pembayaran:
                                        </span>
                                        <span className="font-medium">
                                            {formatPrice(totalAmount)}
                                        </span>
                                    </div>
                                    {!isBalanceSufficient && (
                                        <div className="mt-2 text-red-600 text-xs">
                                            Saldo tidak mencukupi. Silakan top
                                            up atau pilih metode lain.
                                        </div>
                                    )}
                                    {balanceError && (
                                        <div className="mt-2 text-red-600 text-xs">
                                            {balanceError}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between py-3 mt-2 font-semibold text-base">
                            <span>Total</span>
                            <span>
                                {formatPrice(
                                    building.final_price || building.price
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
                        onClick={handleConfirmPayment}
                        disabled={
                            (!snapLoaded && paymentMethod === "midtrans") ||
                            processing ||
                            isWalletDisabled
                        }
                        className={
                            isWalletDisabled
                                ? "bg-red-600 hover:bg-red-700"
                                : ""
                        }
                    >
                        {processing ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Memproses...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                {paymentMethod === "wallet" ? (
                                    <Wallet className="h-4 w-4" />
                                ) : (
                                    <CreditCard className="h-4 w-4" />
                                )}
                                {paymentMethod === "wallet"
                                    ? "Bayar dengan Saldo"
                                    : "Bayar"}
                            </div>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default BuildingConfirmDialog;
