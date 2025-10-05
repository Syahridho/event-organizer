import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./themeSlice";
import cartReducer from "./cartSlice";

export const store = configureStore({
    reducer: {
        theme: themeReducer,
        cart: cartReducer,
    },
});
