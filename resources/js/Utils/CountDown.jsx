import React, { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge.jsx";

export default function Countdown({ expired_at, onExpired }) {
    // Tampilkan error jika tidak ada atau format waktu invalid
    if (!expired_at) {
        return <Badge variant="destructive">Tidak ada waktu!</Badge>;
    }

    const targetTime = new Date(expired_at.replace(" ", "T")).getTime();

    if (isNaN(targetTime)) {
        return <Badge variant="destructive">Format waktu tidak valid!</Badge>;
    }

    const [timeLeft, setTimeLeft] = useState(targetTime - Date.now());
    const expiredNotifiedRef = useRef(false);

    useEffect(() => {
        const tick = () => {
            const remaining = targetTime - Date.now();
            setTimeLeft(remaining);

            // Panggil onExpired hanya SEKALI setelah lewat 1 detik dari expired_at
            if (remaining <= 0 && !expiredNotifiedRef.current) {
                expiredNotifiedRef.current = true;
                if (onExpired) onExpired();
            }
        };

        // Jalankan sekali segera agar tidak delay 1 detik di update pertama
        tick();

        // Perbarui setiap detik
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [targetTime, onExpired]);

    // UI tetap menampilkan "Waktu habis!" saat sisa waktu <= 0
    if (timeLeft <= 0) {
        return <Badge className="bg-red-100 text-red-700">Waktu habis!</Badge>;
    }

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    return (
        <Badge className="bg-yellow-100 text-yellow-600 font-mono text-sm">
            {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:
            {String(seconds).padStart(2, "0")}
        </Badge>
    );
}
