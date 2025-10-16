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
                (sum, item) =>
                    sum + (item.item?.price || 0) * (item.item_qty || 0),
                0
            );
        },
        addToCart: (state, action) => {
            const existingItem = state.items.find(
                (item) => item.id === action.payload.id
            );

            if (existingItem) {
                existingItem.item_qty = action.payload.item_qty;
                if (action.payload.item) {
                    existingItem.item = action.payload.item;
                }
            } else {
                state.items.push(action.payload);
            }

            state.total = state.items.reduce(
                (sum, item) =>
                    sum + (item.item?.price || 0) * (item.item_qty || 0),
                0
            );
        },
        updateCartQuantity: (state, action) => {
            const { cart_id, quantity } = action.payload;

            // FIX: Gunakan cart_id bukan id
            const item = state.items.find((item) => item.id === cart_id);

            if (item) {
                item.item_qty = quantity;
                state.total = state.items.reduce(
                    (sum, item) =>
                        sum + (item.item?.price || 0) * (item.item_qty || 0),
                    0
                );
            }
        },
        removeFromCart: (state, action) => {
            const { cart_id } = action.payload;
            state.items = state.items.filter((item) => item.id !== cart_id);
            state.total = state.items.reduce(
                (sum, item) =>
                    sum + (item.item?.price || 0) * (item.item_qty || 0),
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

export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.total;
export const selectCart = (state) => state.cart;
export const selectCartItemCount = (state) => state.cart.items.length;
export const selectCartLoading = (state) => state.cart.loading;
