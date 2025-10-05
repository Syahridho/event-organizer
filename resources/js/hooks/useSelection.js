import { useState, useCallback, useMemo } from "react";

export const useSelected = (items) => {
    const [itemCounts, setItemCounts] = useState(() => {
        const initialCounts = {};
        items.forEach((item) => {
            initialCounts[item.id] = 0;
        });
        return initialCounts;
    });

    const [selectedDates, setSelectedDates] = useState(() => {
        const initialDates = {};
        items.forEach((item) => {
            initialDates[item.id] =
                item.selectedDate || new Date().toISOString().split("T")[0]; // Default hari ini
        });
        return initialDates;
    });

    const handleChangeItem = useCallback((itemId, delta) => {
        setItemCounts((prev) => {
            const currentCount = prev[itemId] || 0;
            const newCount = currentCount + delta;

            // Batasi maksimum 1 pembelian per item
            if (newCount < 0 || newCount > 1) {
                return prev;
            }

            return {
                ...prev,
                [itemId]: newCount,
            };
        });
    }, []);

    const handleChangeSelectedDate = useCallback((itemId, date) => {
        setSelectedDates((prev) => ({
            ...prev,
            [itemId]: date,
        }));
    }, []);

    const totalHarga = useMemo(
        () =>
            items.reduce(
                (sum, item) =>
                    sum + item.price * (itemCounts[item.id] || 0) * 1,
                0
            ),
        [items, itemCounts]
    );

    const hasSelectedItems = useMemo(
        () => Object.values(itemCounts).some((count) => count > 0),
        [itemCounts]
    );

    return {
        itemCounts,
        handleChangeItem,
        selectedDates,
        handleChangeSelectedDate,
        totalHarga,
        hasSelectedItems,
    };
};
