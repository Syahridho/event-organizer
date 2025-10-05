import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setTheme } from "@/Store/themeSlice";

export default function Initializer() {
    const dispatch = useDispatch();

    useEffect(() => {
        localStorage.removeItem("appearance"); // Clean up legacy key
        const stored = localStorage.getItem("theme") || "light";
        dispatch(setTheme(stored));
    }, [dispatch]);

    return null;
}
