import axios from "axios";
import { setCartItems } from "@/Store/cartSlice";
import { getModelType } from "./getModelType";

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

                const days = rentDays[itemId] || null;

                const response = await axios.post("/cart", {
                    item_id: item.id,
                    item_type: itemType,
                    type: itemCategory,
                    item_qty: qty,
                    rent_days: days,
                });

                // Update Redux dengan data terbaru dari backend
                if (response.data.cartData) {
                    dispatch(setCartItems(response.data.cartData));
                }
            }
        }
        return { success: true };
    } catch (error) {
        console.error(`Error adding item to backend cart:`, error);

        if (error.response) {
            const status = error.response.status;

            switch (status) {
                case 401:
                    return {
                        success: false,
                        message: "Silahkan Login terlebih dahulu",
                        needLogin: true,
                    };
                case 409:
                    return {
                        success: false,
                        message:
                            error.response.data?.message ||
                            "Tanggal ini sudah ada di keranjang atau pembelian pending",
                    };
                case 422:
                    return {
                        success: false,
                        message:
                            error.response.data?.message ||
                            "Data yang dikirim tidak valid",
                    };
                default:
                    return {
                        success: false,
                        message: `HTTP ${status} error`,
                    };
            }
        } else if (error.code === "NETWORK_ERROR" || !navigator.onLine) {
            return { success: false, message: "Network error" };
        } else {
            return { success: false, message: "Unknown error" };
        }
    }
};
