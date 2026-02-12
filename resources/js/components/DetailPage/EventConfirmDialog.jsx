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

const EventConfirmDialog = ({
    isOpen,
    onOpenChange,
    event,
    selectedTickets,
    totalHarga,
    formatPrice,
    handlePayment,
    snapLoaded,
    setIsLoading,
    isLoading,
    setIsPaymentOpen,
    user,
    saldo_user,
}) => {
    const [paymentMethod, setPaymentMethod] = useState("midtrans");
    const [walletBalance, setWalletBalance] = useState(0);
    const [isCheckingBalance, setIsCheckingBalance] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        items:
            selectedTickets && Object.keys(selectedTickets).length > 0
                ? Object.entries(selectedTickets)
                      .filter(([_, count]) => count > 0)
                      .map(([ticketId, quantity]) => {
                          const ticket = event.tickets.find(
                              (t) => t.id === parseInt(ticketId)
                          );
                          return {
                              id: ticket.id,
                              name: `${event.name} (${ticket.name})`,
                              price: ticket.price,
                              quantity: quantity,
                              type: "ticket",
                              note: "", // Events don't typically have notes
                          };
                      })
                : [],
        amount: totalHarga || 0,
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
        if (!selectedTickets || Object.keys(selectedTickets).length === 0) {
            toast.error("Silahkan pilih tiket terlebih dahulu");
            return;
        }

        if (user.id === event.user.id) {
            toast.error("Tidak bisa membeli tiket event sendiri");
            return;
        }

        if (walletBalance < totalHarga) {
            toast.error("Saldo wallet tidak mencukupi");
            return;
        }

        setIsLoading((prev) => ({ ...prev, payment: true }));

        // Convert selected tickets to items array format
        const items = Object.entries(selectedTickets)
            .filter(([_, count]) => count > 0)
            .map(([ticketId, quantity]) => {
                const ticket = event.tickets.find(
                    (t) => t.id === parseInt(ticketId)
                );
                return {
                    id: ticket.id,
                    name: `${event.name} (${ticket.name})`,
                    price: ticket.price,
                    quantity: quantity,
                    type: "ticket",
                    note: "", // Events don't typically have notes
                };
            });

        setData("items", items);
        setData("amount", totalHarga);
        setData("payment_method", "wallet"); // Explicitly set payment method to wallet

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

    const isWalletSufficient = walletBalance >= totalHarga;

    return (
        <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Konfirmasi Pembelian Tiket Event
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Periksa kembali detail pembelian tiket event Anda
                        sebelum melanjutkan pembayaran.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex-1 overflow-y-auto py-4">
                    <div className="bg-slate-50 border rounded-md p-5 text-sm space-y-3">
                        <div className="text-center font-semibold mb-4 tracking-wide">
                            RINCIAN PEMBELIAN
                        </div>

                        <div className="space-y-2">
                            {Object.entries(selectedTickets)
                                .filter(([_, count]) => count > 0)
                                .map(([ticketId, quantity]) => {
                                    const ticket = event.tickets.find(
                                        (t) => t.id === parseInt(ticketId)
                                    );
                                    return (
                                        <div
                                            key={ticketId}
                                            className="flex justify-between py-2 border-b"
                                        >
                                            <span className="text-slate-600">
                                                {ticket.name}
                                            </span>
                                            <span className="font-medium">
                                                {quantity} x{" "}
                                                {formatPrice(ticket.price)}
                                            </span>
                                        </div>
                                    );
                                })}
                        </div>

                        <div className="flex justify-between py-2 border-b font-semibold text-base">
                            <span>Total</span>
                            <span>{formatPrice(totalHarga)}</span>
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
                                            {formatPrice(totalHarga)}
                                        </p>
                                    </div>
                                </div>
                                {!isWalletSufficient && walletBalance > 0 && (
                                    <p className="text-sm text-red-600 mt-2">
                                        Saldo wallet tidak mencukupi. Kurang{" "}
                                        {formatPrice(
                                            totalHarga - walletBalance
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

export default EventConfirmDialog;
