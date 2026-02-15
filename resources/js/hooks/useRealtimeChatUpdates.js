import { useEffect, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { debounce } from "lodash";

/**
 * Hook for real-time chat updates using Soketi/WebSockets and Inertia
 * This is the fastest algorithmic fix for real-time data synchronization
 */
export default function useRealtimeChatUpdates() {
    const { auth } = usePage().props;
    const [echoReady, setEchoReady] = useState(false);

    useEffect(() => {
        console.log("[DEBUG] useRealtimeChatUpdates effect triggered");
        console.log("[DEBUG] Echo available:", !!window.Echo);
        console.log("[DEBUG] User UUID:", auth.user.uuid);

        // Function to check if Echo is ready and set up listeners
        const setupEchoListeners = () => {
            if (!window.Echo) {
                console.warn("[DEBUG] Echo is not initialized yet");
                return false;
            }

            console.log("[DEBUG] Echo is ready, setting up listeners");
            setEchoReady(true);

            // Create a debounced reload function to prevent excessive server requests
            // This is the key Inertia method for partial page updates without full refresh
            const debouncedReload = debounce(() => {
                console.log("[DEBUG] Debounced reload triggered");
                router.reload({
                    preserveScroll: true,
                    only: ["users"], // Only reload the users data to update the chat list
                });
            }, 350);

            // Listen for new message events specifically for partners
            // This is the precise Soketi/Laravel Echo event handling strategy
            const channelName = "message." + auth.user.uuid;
            console.log("[DEBUG] Subscribing to channel:", channelName);
            const channel = window.Echo.private(channelName);

            channel
                .listen("NewMessageEvent", (e) => {
                    // Trigger the Inertia reload when a new message event is received
                    console.log("[DEBUG] NewMessageEvent received:", e);
                    debouncedReload();
                })
                .listen("ReadMessageEvent", (e) => {
                    console.log("[DEBUG] ReadMessageEvent received:", e);
                    debouncedReload();
                })
                .error((error) => {
                    console.error("[DEBUG] Channel subscription error:", error);
                });

            // Store cleanup function
            window._echoCleanup = () => {
                console.log(
                    "[DEBUG] Cleaning up useRealtimeChatUpdates listeners"
                );
                if (window.Echo) {
                    channel
                        .stopListening("NewMessageEvent")
                        .stopListening("ReadMessageEvent");
                }
            };

            return true;
        };

        // Try to set up listeners immediately
        if (setupEchoListeners()) {
            return () => {
                if (window._echoCleanup) {
                    window._echoCleanup();
                    delete window._echoCleanup;
                }
            };
        }

        // If Echo is not ready, wait for it to be initialized
        const checkEchoInterval = setInterval(() => {
            if (window.Echo) {
                console.log("[DEBUG] Echo detected, setting up listeners");
                if (setupEchoListeners()) {
                    clearInterval(checkEchoInterval);
                }
            }
        }, 100);

        // Timeout after 5 seconds
        const timeout = setTimeout(() => {
            clearInterval(checkEchoInterval);
            console.error(
                "[DEBUG] Echo initialization timeout after 5 seconds"
            );
        }, 5000);

        return () => {
            clearInterval(checkEchoInterval);
            clearTimeout(timeout);
            if (window._echoCleanup) {
                window._echoCleanup();
                delete window._echoCleanup;
            }
        };
    }, [auth.user.uuid]);

    return echoReady;
}

/**
 * Minimal code snippet demonstrating the real-time update execution
 *
 * This is the exact implementation that should be used in React components:
 *
 * ```javascript
 * import { useEffect } from "react";
 * import { router, usePage } from "@inertiajs/react";
 * import { debounce } from "lodash";
 *
 * useEffect(() => {
 *     const debouncedReload = debounce(() => {
 *         router.reload({
 *             preserveScroll: true,
 *             only: ["users"], // Only reload the users data
 *         });
 *     }, 350);
 *
 *     window.Echo.private("message." + auth.user.uuid)
 *         .listen("NewMessageEvent", (e) => {
 *             console.log("New message received, updating chat list");
 *             debouncedReload(); // This is the key Inertia method
 *         });
 *
 *     return () => {
 *         window.Echo.private("message." + auth.user.uuid)
 *             .stopListening("NewMessageEvent");
 *     };
 * }, [auth.user.uuid]);
 * ```
 */
