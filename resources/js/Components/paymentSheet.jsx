import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { FaCartPlus } from "react-icons/fa";
import { formatRupiah } from "@/Utils/formatRupiah";
import { TicketItem } from "@/components/ticketItem"; // Import dari file lain
import { PaymentSummary } from "@/components/paymentSummary"; // Import dari file lain

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
}) => {
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
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="font-bold text-lg">
                            Rp. {formatRupiah(totalHarga)}
                        </p>
                    </div>

                    <SheetFooter className="border-t pt-4 mt-4 flex">
                        <Button
                            type="button"
                            className="flex-none"
                            onClick={handleAddToCart}
                            disabled={isCart || !hasSelectedTickets}
                        >
                            <FaCartPlus />
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                !snapLoaded || isPaying || totalHarga === 0
                            }
                            className="flex-1"
                        >
                            {isPaying ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
