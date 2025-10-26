// OPTIMIZED: Return raw date strings without Date parsing to avoid timezone issues
export const getBookedDates = (transactions) => {
    if (!transactions || !Array.isArray(transactions)) return [];

    return transactions
        .filter((item) => item.rent_days && item.rent_days.trim() !== "")
        .map((item) => {
            // Return rent_days as-is (already in YYYY-MM-DD format from database)
            const dateStr = item.rent_days.split('T')[0]; // Handle potential datetime format
            return dateStr;
        })
        .filter((date) => date && date !== "Invalid Date");
};

export const getBookedDatesWithUser = (transactions, currentUserId) => {
    if (!transactions || !Array.isArray(transactions)) return [];

    const bookedDates = transactions
        .filter((item) => item.rent_days && item.rent_days.trim() !== "")
        .map((item) => {
            // Gunakan rent_days langsung sebagai string tanpa parsing ke Date
            // Handle potential datetime format (YYYY-MM-DDTHH:MM:SS) by taking only date part
            const dateStr = item.rent_days.split('T')[0]; // "2025-09-15"
            const transactionUserId = item.transaction?.user_id;
            const isCurrentUser =
                String(transactionUserId) === String(currentUserId);

            return {
                date: dateStr,
                userId: transactionUserId,
                isCurrentUser,
            };
        })
        .filter((item) => item.date && item.date !== "Invalid Date");

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
