import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
    name: "cart",
    initialState: {
        items: [],
        total: 0,
        loading: false,
    },
    reducers: {
        setCartItems: (state, action) => {
            state.items = action.payload;
            state.total = action.payload.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
            );
        },
        addToCart: (state, action) => {
            const {
                cart_id,
                id,
                name,
                price,
                quantity,
                rent_days,
                is_unavailable,
                thumbnail,
                event_name,
            } = action.payload;

            const existingItem = state.items.find(
                (item) => item.cart_id === cart_id
            );

            if (existingItem) {
                existingItem.quantity = quantity;
                existingItem.thumbnail = thumbnail || existingItem.thumbnail;
                existingItem.event_name = event_name || existingItem.event_name;
            } else {
                state.items.push({
                    cart_id,
                    id,
                    name,
                    price,
                    quantity,
                    is_unavailable,
                    rent_days,
                    thumbnail: thumbnail || "/randoms/1.jpg",
                    event_name: event_name || "",
                });
            }

            // Recalculate total
            state.total = state.items.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
            );
        },
        updateCartQuantity: (state, action) => {
            const { cart_id, quantity } = action.payload;
            const item = state.items.find((item) => item.cart_id === cart_id);

            if (item) {
                item.quantity = quantity;
                // Recalculate total
                state.total = state.items.reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0
                );
            }
        },
        removeFromCart: (state, action) => {
            const { cart_id } = action.payload;
            state.items = state.items.filter(
                (item) => item.cart_id !== cart_id
            );

            // Recalculate total
            state.total = state.items.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
            );
        },
        clearCart: (state) => {
            state.items = [];
            state.total = 0;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
    },
});

export const {
    setCartItems,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    setLoading,
} = cartSlice.actions;

export default cartSlice.reducer;

// Selectors untuk performa yang lebih baik
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.total;
export const selectCartItemCount = (state) => state.cart.items.length;
export const selectCartLoading = (state) => state.cart.loading;
