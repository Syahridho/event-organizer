import { useMemo } from "react";
import { formatRupiah } from "@/Utils/formatRupiah.js";

export const PaymentSummary = ({ tickets, ticketCounts }) => {
    const summaryItems = useMemo(() => {
        return tickets
            .filter((ticket) => (ticketCounts[ticket.id] || 0) > 0)
            .map((ticket) => {
                const count = ticketCounts[ticket.id];
                return {
                    id: ticket.id,
                    name: ticket.name,
                    count,
                    total: ticket.price * count,
                };
            });
    }, [tickets, ticketCounts]);

    if (summaryItems.length === 0) {
        return (
            <div className="text-center text-muted-foreground text-sm py-4">
                Belum ada tiket yang dipilih
            </div>
        );
    }

    return (
        <div className="grid gap-2 text-muted-foreground text-xs">
            {summaryItems.map((item) => (
                <div
                    key={item.id}
                    className="flex items-center justify-between"
                >
                    <p>
                        {item.name} x {item.count}
                    </p>
                    <p>Rp. {formatRupiah(item.total)}</p>
                </div>
            ))}
        </div>
    );
};
