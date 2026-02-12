import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
} from "react";

const OnlineStatusContext = createContext();

export const useOnlineStatusContext = () => {
    const context = useContext(OnlineStatusContext);
    if (context === undefined) {
        // Ini akan membantu kita melacak jika hook dipanggil di luar provider
        console.error(
            "useOnlineStatusContext must be used within an OnlineStatusProvider"
        );
    }
    return context;
};

const OnlineStatusProvider = ({ children }) => {
    const [onlineUsers, setOnlineUsers] = useState([]);
    const isSubscribed = useRef(false); // Gunakan ref agar tidak memicu re-render berlebih

    useEffect(() => {
        if (!window.Echo || isSubscribed.current) return;

        const channel = window.Echo.join("online-users");
        isSubscribed.current = true;

        channel
            .here((users) => {
                setOnlineUsers(users);
            })
            .joining((user) => {
                setOnlineUsers((prev) => {
                    if (prev.some((u) => u.id === user.id)) return prev;
                    return [...prev, user];
                });
            })
            .leaving((user) => {
                setOnlineUsers((prev) => prev.filter((u) => u.id !== user.id));
            })
            .error((error) => {
                console.error("Presence Channel Error:", error);
                isSubscribed.current = false;
            });

        return () => {
            window.Echo.leave("online-users");
            isSubscribed.current = false;
        };
    }, []); // Kosongkan dependency agar hanya jalan sekali saat aplikasi buka

    // Perbaikan logika cek online (asumsi user adalah object)
    const isUserOnline = (userId) => {
        return onlineUsers.some((u) => u.id === parseInt(userId));
    };

    const value = { onlineUsers, isUserOnline };

    return (
        <OnlineStatusContext.Provider value={value}>
            {children}
        </OnlineStatusContext.Provider>
    );
};

export default OnlineStatusProvider;
