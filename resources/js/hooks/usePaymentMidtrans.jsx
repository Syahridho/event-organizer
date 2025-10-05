import { useEffect, useState, useRef } from "react";

const MIDTRANS_SANDBOX_URL = "https://app.sandbox.midtrans.com/snap/snap.js";

export const useMidtrans = () => {
    const [snapLoaded, setSnapLoaded] = useState(false);
    const [paymentError, setPaymentError] = useState(null);
    const snapScriptRef = useRef(null);

    useEffect(() => {
        if (snapScriptRef.current) return;

        const script = document.createElement("script");
        script.src = MIDTRANS_SANDBOX_URL;
        script.setAttribute(
            "data-client-key",
            import.meta.env.VITE_MIDTRANS_CLIENT_KEY
        );
        script.onload = () => {
            console.log("✅ Midtrans script loaded successfully");
            setSnapLoaded(true);
            snapScriptRef.current = script;
        };
        script.onerror = () => {
            console.error("❌ Failed to load Midtrans script");
            setPaymentError(
                "Gagal memuat sistem pembayaran. Silakan refresh halaman."
            );
        };

        document.body.appendChild(script);

        return () => {
            if (snapScriptRef.current) {
                document.body.removeChild(snapScriptRef.current);
            }
        };
    }, []);

    return { snapLoaded, paymentError, setPaymentError };
};
