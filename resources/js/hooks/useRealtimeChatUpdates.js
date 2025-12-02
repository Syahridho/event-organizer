import { useEffect } from "react";
import { router, usePage } from "@inertiajs/react";
import { debounce } from "lodash";

/**
 * Hook for real-time chat updates using Soketi/WebSockets and Inertia
 * This is the fastest algorithmic fix for real-time data synchronization
 */
export default function useRealtimeChatUpdates() {
    const { auth } = usePage().props;

    useEffect(() => {
        // Create a debounced reload function to prevent excessive server requests
        // This is the key Inertia method for partial page updates without full refresh
        const debouncedReload = debounce(() => {
            router.reload({
                preserveScroll: true,
                only: ["users"], // Only reload the users data to update the chat list
            });
        }, 350);

        // Listen for new message events specifically for partners
        // This is the precise Soketi/Laravel Echo event handling strategy
        window.Echo.private("message." + auth.user.uuid)
            .listen("NewMessageEvent", (e) => {
                // Trigger the Inertia reload when a new message event is received
                debouncedReload();
            })
            .listen("ReadMessageEvent", (e) => {
                debouncedReload();
            });

        // Cleanup function to remove listeners when component unmounts
        return () => {
            window.Echo.private("message." + auth.user.uuid)
                .stopListening("NewMessageEvent")
                .stopListening("ReadMessageEvent");
        };
    }, [auth.user.uuid]);
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
