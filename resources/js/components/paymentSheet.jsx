import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import { Loader2 } from "lucide-react";
import { FaCartPlus } from "react-icons/fa";
import { formatRupiah } from "@/Utils/formatRupiah.js";
import { TicketItem } from "@/components/ticketItem";
import { PaymentSummary } from "@/components/paymentSummary";

export const PaymentSheet = ({
    tickets,
    ticketCounts,
    handleChangeTicket,
    totalHarga,
    hasSelectedTickets,
    handlePay,
    handleAddToCart,
    isPaying,
    snapLoaded,
    isCart,
    taxAmount = 0, // received from parent (ShowEvent.jsx)
    taxLabel = "", // descriptive label from parent
}) => {
    const showTax =
        Boolean(hasSelectedTickets) &&
        Number(totalHarga) > 0 &&
        Number(taxAmount) > 0;
    const grandTotal = Number(totalHarga) + Number(taxAmount);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" className="w-full" size="lg">
                    Beli Tiket Berbayar
                </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col h-full w-full sm:max-w-md">
                <SheetHeader className="space-y-2 mb-4">
                    <SheetTitle>Tiket Acara</SheetTitle>
                    <SheetDescription>
                        Pilih tiket yang ingin Anda beli
                    </SheetDescription>
                </SheetHeader>

                <form
                    onSubmit={handlePay}
                    className="flex flex-col flex-1 overflow-hidden"
                >
                    <div className="flex-1 overflow-y-auto">
                        <div className="space-y-4">
                            {tickets.map((ticket) => (
                                <TicketItem
                                    key={ticket.id}
                                    ticket={ticket}
                                    count={ticketCounts[ticket.id] || 0}
                                    onCountChange={handleChangeTicket}
                                    disabled={isPaying}
                                />
                            ))}
                        </div>

                        <Separator className="my-6" />

                        <div className="mb-4">
                            <h4 className="font-medium mb-2">
                                Rincian Pembelian
                            </h4>
                            <PaymentSummary
                                tickets={tickets}
                                ticketCounts={ticketCounts}
                            />
                            {showTax && (
                                <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                                    <span>{taxLabel || "Pajak"}</span>
                                    <span>Rp. {formatRupiah(taxAmount)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="font-bold text-lg">
                            Rp. {formatRupiah(grandTotal)}
                        </p>
                        {showTax && (
                            <p className="text-xs text-muted-foreground">
                                Termasuk pajak
                            </p>
                        )}
                    </div>

                    <SheetFooter className="border-t pt-4 mt-4 grid grid-cols-10 gap-4 w-full">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleAddToCart}
                            disabled={isCart || !hasSelectedTickets}
                            className="col-span-1"
                        >
                            <FaCartPlus className="h-4 w-4" />
                        </Button>

                        <Button
                            type="submit"
                            className="col-span-9"
                            disabled={
                                !snapLoaded || isPaying || totalHarga === 0
                            }
                        >
                            {isPaying ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                "Bayar Sekarang"
                            )}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
};
