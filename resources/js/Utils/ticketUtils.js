// Utility functions untuk mengelola tiket

/**
 * Inisialisasi state untuk ticket counts
 * @param {Array} tickets - Array tiket
 * @returns {Object} Object dengan ticket ID sebagai key dan count 0 sebagai value
 */
export const initializeTicketCounts = (tickets) => {
    const initialCounts = {};
    tickets.forEach((ticket) => {
        initialCounts[ticket.id] = 0;
    });
    return initialCounts;
};

/**
 * Update count tiket dengan validasi
 * @param {Object} currentCounts - State count tiket saat ini
 * @param {Array} tickets - Array tiket untuk validasi quota
 * @param {number} ticketId - ID tiket yang akan diupdate
 * @param {number} delta - Perubahan count (+1 atau -1)
 * @returns {Object} State count yang sudah diupdate atau state lama jika invalid
 */
export const updateTicketCount = (currentCounts, tickets, ticketId, delta) => {
    const currentCount = currentCounts[ticketId] || 0;
    const newCount = currentCount + delta;

    // Find ticket quota
    const ticket = tickets.find((t) => t.id === ticketId);
    const maxQuota = ticket?.quota || 0;

    if (newCount < 0 || newCount > maxQuota) {
        return currentCounts; // No change if invalid
    }

    return {
        ...currentCounts,
        [ticketId]: newCount,
    };
};

/**
 * Hitung total harga dari tiket yang dipilih
 * @param {Array} tickets - Array tiket
 * @param {Object} ticketCounts - Object count tiket
 * @returns {number} Total harga
 */
export const calculateTotalPrice = (tickets, ticketCounts) => {
    return tickets.reduce(
        (sum, ticket) => sum + ticket.price * (ticketCounts[ticket.id] || 0),
        0
    );
};

/**
 * Cek apakah ada tiket yang dipilih
 * @param {Object} ticketCounts - Object count tiket
 * @returns {boolean} True jika ada tiket yang dipilih
 */
export const hasSelectedTickets = (ticketCounts) => {
    return Object.values(ticketCounts).some((count) => count > 0);
};

/**
 * Filter tiket berbayar (bukan gratis)
 * @param {Array} tickets - Array tiket
 * @returns {Array} Array tiket berbayar
 */
export const getPaidTickets = (tickets) => {
    return tickets.filter((ticket) => ticket.name !== "Free");
};

/**
 * Convert ticket counts ke format yang dibutuhkan untuk payment
 * @param {Object} ticketCounts - Object count tiket
 * @param {Array} tickets - Array tiket untuk mendapatkan detail
 * @returns {Array} Array items untuk payment
 */
export const convertToPaymentItems = (ticketCounts, tickets) => {
    return Object.entries(ticketCounts)
        .filter(([count]) => count > 0)
        .map(([ticketId, quantity]) => {
            const ticket = tickets.find((t) => t.id === parseInt(ticketId));
            return {
                id: parseInt(ticketId),
                type: "ticket",
                quantity,
                name: ticket?.name,
                price: ticket?.price,
            };
        });
};

/**
 * Generate summary items untuk ditampilkan di payment summary
 * @param {Array} tickets - Array tiket
 * @param {Object} ticketCounts - Object count tiket
 * @returns {Array} Array summary items
 */
export const generateSummaryItems = (tickets, ticketCounts) => {
    return tickets
        .filter((ticket) => (ticketCounts[ticket.id] || 0) > 0)
        .map((ticket) => {
            const count = ticketCounts[ticket.id];
            return {
                id: ticket.id,
                name: ticket.name,
                count,
                total: ticket.price * count,
                price: ticket.price,
            };
        });
};

/**
 * Validasi ticket counts sebelum melakukan pembayaran
 * @param {Object} ticketCounts - Object count tiket
 * @param {Array} tickets - Array tiket
 * @returns {Object} Object hasil validasi dengan success boolean dan message string
 */
export const validateTicketSelection = (ticketCounts, tickets) => {
    const hasSelected = hasSelectedTickets(ticketCounts);

    if (!hasSelected) {
        return {
            success: false,
            message: "Silakan pilih minimal satu tiket",
        };
    }

    // Cek quota untuk setiap tiket yang dipilih
    for (const [ticketId, count] of Object.entries(ticketCounts)) {
        if (count > 0) {
            const ticket = tickets.find((t) => t.id === parseInt(ticketId));
            if (!ticket) {
                return {
                    success: false,
                    message: `Tiket dengan ID ${ticketId} tidak ditemukan`,
                };
            }

            if (count > ticket.quota) {
                return {
                    success: false,
                    message: `Jumlah tiket ${ticket.name} melebihi quota yang tersedia (${ticket.quota})`,
                };
            }
        }
    }

    const totalPrice = calculateTotalPrice(tickets, ticketCounts);
    if (totalPrice < 1000) {
        return {
            success: false,
            message: "Minimum pembayaran adalah Rp. 1.000",
        };
    }

    return {
        success: true,
        message: "Validasi berhasil",
    };
};
