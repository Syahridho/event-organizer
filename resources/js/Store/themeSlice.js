import { createSlice } from "@reduxjs/toolkit";

const getSystemTheme = () => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
};

const getInitialTheme = () => {
    if (typeof window === "undefined") return "light";

    const saved = localStorage.getItem("theme");
    if (saved === "system") return getSystemTheme();
    if (saved === "light" || saved === "dark") return saved;
    return "light";
};

const themeSlice = createSlice({
    name: "theme",
    initialState: {
        mode:
            typeof window !== "undefined"
                ? localStorage.getItem("theme") || "light"
                : "light",
        current: getInitialTheme(),
    },
    reducers: {
        setTheme(state, action) {
            state.mode = action.payload;
            localStorage.setItem("theme", action.payload);

            if (action.payload === "system") {
                const system = getSystemTheme();
                state.current = system;
            } else {
                state.current = action.payload;
            }

            // Terapkan ke HTML
            document.documentElement.classList.toggle(
                "dark",
                state.current === "dark"
            );
        },
        detectSystemTheme(state) {
            const system = getSystemTheme();
            if (state.mode === "system") {
                state.current = system;
                document.documentElement.classList.toggle(
                    "dark",
                    system === "dark"
                );
            }
        },
    },
});

export const { setTheme, detectSystemTheme } = themeSlice.actions;
export default themeSlice.reducer;
