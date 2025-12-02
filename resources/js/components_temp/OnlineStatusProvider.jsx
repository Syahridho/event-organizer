import React, { createContext, useContext, useEffect, useState } from "react";

const OnlineStatusContext = createContext();

export const useOnlineStatusContext = () => {
    return useContext(OnlineStatusContext);
};

const OnlineStatusProvider = ({ children }) => {
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // useEffect(() => {
    //     // Only initialize if Echo is available
    //     if (!window.Echo || isInitialized) {
    //         return;
    //     }

    //     try {
    //         Join presence channel to track online users across all routes
    //         const presence = window.Echo.join("online-users");

    //         presence
    //             .here((users) => {
    //                 setOnlineUsers(users);
    //                 setIsInitialized(true);
    //             })
    //             .joining((user) => {
    //                 setOnlineUsers((prev) => {
    //                     // Avoid duplicates
    //                     if (prev.some((u) => u.id === user.id)) {
    //                         return prev;
    //                     }
    //                     return [...prev, user];
    //                 });
    //             })
    //             .leaving((user) => {
    //                 setOnlineUsers((prev) =>
    //                     prev.filter((u) => u.id !== user.id)
    //                 );
    //             })
    //             .error((error) => {
    //                 setIsInitialized(false);
    //             });

    //         return () => {
    //             try {
    //                 // Leave the presence channel properly
    //                 if (window.Echo) {
    //                     window.Echo.leave("online-users");
    //                 }
    //             } catch (error) {
    //                 console.error("Error leaving presence channel:", error);
    //             }
    //             setIsInitialized(false);
    //         };
    //     } catch (error) {
    //         setIsInitialized(false);
    //     }
    // }, [isInitialized]);

    // Check if a specific user is online (optimized for array of IDs)

    const isUserOnline = (userId) => {
        return onlineUsers.includes(userId);
    };

    const value = {
        onlineUsers, // Array of user IDs who are online
        isUserOnline, // Optimized function to check if user is online
        //isInitialized, // Track initialization state
    };

    return (
        <OnlineStatusContext.Provider value={value}>
            {children}
        </OnlineStatusContext.Provider>
    );
};

export default OnlineStatusProvider;
