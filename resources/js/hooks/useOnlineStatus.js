import { useState, useEffect } from "react";
import { usePage } from "@inertiajs/react";

export default function useOnlineStatus() {
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { auth } = usePage().props;

    useEffect(() => {
        // Check if Echo is initialized
        if (!window.Echo) {
            console.warn("Echo is not initialized yet");
            return;
        }

        // Join presence channel to track online users
        const presence = window.Echo.join("online-users");

        presence
            .here((users) => {
                setOnlineUsers(users);
            })
            .joining((user) => {
                setOnlineUsers((prev) => [...prev, user]);
            })
            .leaving((user) => {
                setOnlineUsers((prev) => prev.filter((u) => u.id !== user.id));
            });

        return () => {
            if (presence) {
                presence.leave();
            }
        };
    }, []);

    // Check if a specific user is online
    const isUserOnline = (userId) => {
        return onlineUsers.some((user) => user.id === userId);
    };

    return { onlineUsers, isUserOnline };
}
