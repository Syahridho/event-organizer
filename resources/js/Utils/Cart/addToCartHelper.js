import axios from "axios";
import { addToCart } from "@/Store/cartSlice";
import { getModelType } from "./getModelType";

/**
 * Menambahkan banyak item ke cart, sinkron Redux dan Backend
 *
 * @param {Object} options
 * @param {Object} options.items - Format { [itemId]: qty }
 * @param {Array}  options.itemList - Daftar semua item (misal: tickets)
 * @param {Object} options.rentDays - Format { [itemId]: days } untuk durasi sewa
 * @param {Function} options.dispatch - Dispatch dari Redux
 * @param {String} options.itemCategory - 'ticket' | 'booth' | 'merchandise' | ...
 */
export const addItemsToCart = async ({
    items,
    itemList,
    rentDays,
    dispatch,
    itemCategory,
}) => {
    try {
        const itemType = getModelType(itemCategory);
        if (!itemType)
            throw new Error(
                `Model type untuk '${itemCategory}' tidak dikenali`
            );

        for (const [itemId, qty] of Object.entries(items)) {
            if (qty > 0) {
                const item = itemList.find((t) => t.id === parseInt(itemId));
                if (!item) continue;

                const days = rentDays[itemId] || null; // Default 1 hari jika tidak ada rentDays
                console.log(days);

                dispatch(
                    addToCart({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: qty,
                        rent_days: days, // Tambahkan rent_days ke Redux
                        image: item.image ?? null,
                    })
                );

                await axios.post("/cart", {
                    item_id: item.id,
                    item_type: itemType,
                    type: itemCategory,
                    item_qty: qty,
                    rent_days: days, // Tambahkan rent_days ke backend
                });
            }
        }

        return { success: true };
    } catch (error) {
        console.error(`Error adding item to backend cart:`, error);

        // Handle specific API errors
        if (error.response) {
            const status = error.response.status;

            switch (status) {
                case 401:
                    return {
                        success: false,
                        message: "Silahkan Login terlebih dahulu",
                        needLogin: true,
                    };

                case 403:
                    return { success: false, message: "Forbidden" };

                case 422: {
                    const validationMessage =
                        error.response.data?.message ||
                        "Data yang dikirim tidak valid";

                    return { success: false, message: validationMessage };
                }
                case 404:
                    return { success: false, message: "Item not found" };

                case 429:
                    return { success: false, message: "Too many requests" };

                case 500:
                    return { success: false, message: "Server error" };

                default:
                    return { success: false, message: `HTTP ${status} error` };
            }
        } else if (error.code === "NETWORK_ERROR" || !navigator.onLine) {
            return { success: false, message: "Network error" };
        } else {
            return { success: false, message: "Unknown error" };
        }
    }
};
