import { useState, useEffect } from "react";
import { usePage } from "@inertiajs/react";

/**
 * Custom hook to manage CSRF token
 * Automatically fetches a fresh token on mount and when page becomes visible
 * This prevents stale token issues after logout
 */
export function useCsrfToken() {
    const { props } = usePage();
    const [csrfToken, setCsrfToken] = useState("");

    useEffect(() => {
        const updateToken = async () => {
            // First, try to get token from meta tag
            const token = document.head.querySelector(
                'meta[name="csrf-token"]'
            );
            if (token) {
                setCsrfToken(token.content);
            }

            // Then, fetch a fresh token from the server to ensure it's valid
            // This is especially important after logout
            try {
                const response = await fetch("/csrf-token", {
                    method: "GET",
                    credentials: "same-origin",
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        Accept: "application/json",
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.token) {
                        // Update both the meta tag and state
                        const metaTag = document.head.querySelector(
                            'meta[name="csrf-token"]'
                        );
                        if (metaTag) {
                            metaTag.setAttribute("content", data.token);
                        }
                        setCsrfToken(data.token);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch CSRF token:", error);
                // If fetch fails, we'll use the token from meta tag
            }
        };

        updateToken();

        // Listen for visibility change to refresh token when tab becomes active again
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                updateToken();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
        };
    }, [props]);

    /**
     * Get the latest CSRF token from the DOM and optionally fetch from server
     * Useful for ensuring we have the most recent token before form submission
     */
    const refreshToken = async () => {
        try {
            console.log("Refreshing CSRF token...");
            // Fetch a fresh token from the server
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch("/csrf-token", {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    Accept: "application/json",
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            console.log("CSRF token response status:", response.status);

            if (response.ok) {
                const data = await response.json();
                console.log("CSRF token response data:", data);
                if (data.token) {
                    // Update both the meta tag and state
                    const metaTag = document.head.querySelector(
                        'meta[name="csrf-token"]'
                    );
                    if (metaTag) {
                        metaTag.setAttribute("content", data.token);
                    }
                    setCsrfToken(data.token);
                    console.log("CSRF token updated successfully");
                    return data.token;
                } else {
                    console.error("No token in CSRF response");
                    throw new Error("No token received from server");
                }
            } else {
                console.error(
                    "CSRF token request failed with status:",
                    response.status
                );
                throw new Error(
                    `Server responded with status: ${response.status}`
                );
            }
        } catch (error) {
            console.error("Error refreshing CSRF token:", error);

            // Fallback: try to get token from meta tag if fetch fails
            const metaTag = document.head.querySelector(
                'meta[name="csrf-token"]'
            );
            if (metaTag && metaTag.content) {
                console.log("Using fallback CSRF token from meta tag");
                setCsrfToken(metaTag.content);
                return metaTag.content;
            }

            throw error;
        }
    };

    return { csrfToken, refreshToken };
}
