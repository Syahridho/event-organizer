import { useState, useCallback, useMemo } from "react";

export const useTicketSelection = (tickets) => {
    const [ticketCounts, setTicketCounts] = useState(() => {
        const initialCounts = {};
        tickets.forEach((ticket) => {
            initialCounts[ticket.id] = 0;
        });
        return initialCounts;
    });

    const handleChangeTicket = useCallback(
        (ticketId, delta) => {
            setTicketCounts((prev) => {
                const currentCount = prev[ticketId] || 0;
                const newCount = currentCount + delta;
                const ticket = tickets.find((t) => t.id === ticketId);

                // Gunakan remaining, bukan quota untuk validasi max
                const maxAllowed = ticket?.remaining || 0;

                if (newCount < 0 || newCount > maxAllowed) {
                    return prev;
                }

                return {
                    ...prev,
                    [ticketId]: newCount,
                };
            });
        },
        [tickets]
    );

    // Tambahkan fungsi reset
    const resetTicketCounts = useCallback(() => {
        const resetCounts = {};
        tickets.forEach((ticket) => {
            resetCounts[ticket.id] = 0;
        });
        setTicketCounts(resetCounts);
    }, [tickets]);

    const totalHarga = useMemo(
        () =>
            tickets.reduce(
                (sum, ticket) =>
                    sum + ticket.price * (ticketCounts[ticket.id] || 0),
                0
            ),
        [tickets, ticketCounts]
    );

    const hasSelectedTickets = useMemo(
        () => Object.values(ticketCounts).some((count) => count > 0),
        [ticketCounts]
    );

    return {
        ticketCounts,
        handleChangeTicket,
        resetTicketCounts, // Export fungsi reset
        totalHarga,
        hasSelectedTickets,
    };
};
