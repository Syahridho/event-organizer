export const getBookedDates = (transactions) => {
    if (!transactions || !Array.isArray(transactions)) return [];

    return transactions
        .filter((item) => item.rent_days && item.rent_days.trim() !== "")
        .map((item) => {
            const rentDate = new Date(item.rent_days);
            return rentDate.toISOString().split("T")[0]; // Format: YYYY-MM-DD
        })
        .filter((date) => date !== "Invalid Date");
};

export const getBookedDatesWithUser = (transactions, currentUserId) => {
    if (!transactions || !Array.isArray(transactions)) return [];

    const bookedDates = transactions
        .filter((item) => item.rent_days && item.rent_days.trim() !== "")
        .map((item) => {
            // Gunakan rent_days langsung sebagai string tanpa parsing ke Date
            const dateStr = item.rent_days; // "2025-09-15"
            const transactionUserId = item.transaction?.user_id;
            const isCurrentUser =
                String(transactionUserId) === String(currentUserId);

            return {
                date: dateStr,
                userId: transactionUserId,
                isCurrentUser,
            };
        })
        .filter((item) => item.date !== "Invalid Date");

    // Deduplikasi berdasarkan date dan userId
    const uniqueBookedDates = bookedDates.reduce((acc, current) => {
        const key = `${current.date}_${current.userId}`; // Kombinasi unik date dan userId
        if (!acc[key]) {
            acc[key] = current;
        }
        return acc;
    }, {});

    return Object.values(uniqueBookedDates);
};
