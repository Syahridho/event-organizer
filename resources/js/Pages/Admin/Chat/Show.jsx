import React, { Fragment, useEffect, useRef, useState } from "react";
import { Head, router } from "@inertiajs/react";
import { debounce } from "lodash";
import AppLayout from "@/Layouts/App/AppSidebarLayout";
import ChatLayout from "@/components/ChatLayout.jsx";
import useRealtimeChatUpdates from "@/hooks/useRealtimeChatUpdates.js";
// import { useOnlineStatusContext } from "@/components/OnlineStatusProvider.jsx";

const breadcrumbs = [
    {
        title: "Dashboard Admin",
        href: "/admin/dashboard",
    },
    {
        title: "Pesan",
        href: "/admin/dashboard/chat",
    },
];

export default function AdminChatShow({
    auth,
    chat_with: chatWithUser,
    messages,
}) {
    const scrollRef = useRef(null);
    const [reply, setReply] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    // const { isUserOnline } = useOnlineStatusContext();

    // Use the custom hook for real-time updates
    // This will handle both chat list and message updates
    useRealtimeChatUpdates();

    // Additional effect for message-specific updates
    useEffect(() => {
        console.log(
            "[DEBUG] Admin Chat Show message listener effect triggered"
        );
        console.log("[DEBUG] Echo available:", !!window.Echo);
        console.log("[DEBUG] User UUID:", auth.user.uuid);
        console.log("[DEBUG] Chat with user ID:", chatWithUser.id);

        // Function to set up message listeners
        const setupMessageListeners = () => {
            if (!window.Echo) {
                console.warn(
                    "[DEBUG] Echo is not initialized yet in Admin Chat Show"
                );
                return false;
            }

            const debouncedMessageReload = debounce(() => {
                console.log("[DEBUG] Admin debounced message reload triggered");
                router.reload({
                    preserveScroll: true,
                    only: ["messages"], // Only reload messages
                });
            }, 350);

            const channelName = "message." + auth.user.uuid;
            console.log(
                "[DEBUG] Admin Chat Show subscribing to channel:",
                channelName
            );
            const channel = window.Echo.private(channelName);

            channel
                .listen("NewMessageEvent", (e) => {
                    console.log(
                        "[DEBUG] Admin Chat Show NewMessageEvent received:",
                        e
                    );
                    // Check if the message is for the current chat
                    if (
                        e.message.sender_id === chatWithUser.id ||
                        e.message.receiver_id === chatWithUser.id
                    ) {
                        console.log(
                            "[DEBUG] Message is for current admin chat, reloading"
                        );
                        debouncedMessageReload();
                    } else {
                        console.log(
                            "[DEBUG] Message is not for current admin chat, ignoring"
                        );
                    }
                })
                .error((error) => {
                    console.error(
                        "[DEBUG] Admin Chat Show channel subscription error:",
                        error
                    );
                });

            // Store cleanup function
            window._adminChatShowCleanup = () => {
                console.log(
                    "[DEBUG] Cleaning up Admin Chat Show message listener"
                );
                if (window.Echo) {
                    channel.stopListening("NewMessageEvent");
                }
            };

            return true;
        };

        // Try to set up listeners immediately
        if (setupMessageListeners()) {
            return () => {
                if (window._adminChatShowCleanup) {
                    window._adminChatShowCleanup();
                    delete window._adminChatShowCleanup;
                }
            };
        }

        // If Echo is not ready, wait for it to be initialized
        const checkEchoInterval = setInterval(() => {
            if (window.Echo) {
                console.log(
                    "[DEBUG] Echo detected in Admin Chat Show, setting up listeners"
                );
                if (setupMessageListeners()) {
                    clearInterval(checkEchoInterval);
                }
            }
        }, 100);

        // Timeout after 5 seconds
        const timeout = setTimeout(() => {
            clearInterval(checkEchoInterval);
            console.error(
                "[DEBUG] Echo initialization timeout in Admin Chat Show after 5 seconds"
            );
        }, 5000);

        return () => {
            clearInterval(checkEchoInterval);
            clearTimeout(timeout);
            if (window._adminChatShowCleanup) {
                window._adminChatShowCleanup();
                delete window._adminChatShowCleanup;
            }
        };
    }, [auth.user.uuid, chatWithUser.id]);

    useEffect(() => {
        scrollRef.current?.scrollTo(0, scrollRef.current?.scrollHeight);
    }, [messages, reply]);

    // Setup typing listener
    useEffect(() => {
        console.log("[DEBUG] Admin Chat Show typing listener effect triggered");

        // Function to set up typing listeners
        const setupTypingListeners = () => {
            if (!window.Echo) {
                console.warn(
                    "[DEBUG] Echo is not initialized yet for admin typing"
                );
                return false;
            }

            const channel = window.Echo.private("message." + auth.user.uuid);
            console.log("[DEBUG] Admin Chat Show setting up typing listener");

            channel.listenForWhisper("typing", () => {
                console.log("[DEBUG] Admin typing whisper received");
                setIsTyping(true);

                setTimeout(() => {
                    setIsTyping(false);
                }, 2000);
            });

            // Store cleanup function
            window._adminTypingCleanup = () => {
                console.log(
                    "[DEBUG] Cleaning up Admin Chat Show typing listener"
                );
                if (window.Echo) {
                    channel.stopListeningForWhisper("typing");
                }
            };

            return true;
        };

        // Try to set up listeners immediately
        if (setupTypingListeners()) {
            return () => {
                if (window._adminTypingCleanup) {
                    window._adminTypingCleanup();
                    delete window._adminTypingCleanup;
                }
            };
        }

        // If Echo is not ready, wait for it to be initialized
        const checkEchoInterval = setInterval(() => {
            if (window.Echo) {
                console.log(
                    "[DEBUG] Echo detected for admin typing, setting up listeners"
                );
                if (setupTypingListeners()) {
                    clearInterval(checkEchoInterval);
                }
            }
        }, 100);

        // Timeout after 5 seconds
        const timeout = setTimeout(() => {
            clearInterval(checkEchoInterval);
            console.error(
                "[DEBUG] Echo initialization timeout for admin typing after 5 seconds"
            );
        }, 5000);

        return () => {
            clearInterval(checkEchoInterval);
            clearTimeout(timeout);
            if (window._adminTypingCleanup) {
                window._adminTypingCleanup();
                delete window._adminTypingCleanup;
            }
        };
    }, [auth.user.uuid]);

    return (
        <>
            <Head title="Admin Chat" />

            <ChatLayout
                showBackButton={true}
                backUrl={route("admin.chat")}
                currentUser={chatWithUser}
                messages={messages}
                onlineUsers={[]}
                isTyping={isTyping}
                reply={reply}
                setReply={setReply}
                setIsTyping={setIsTyping}
                scrollRef={scrollRef}
            />
        </>
    );
}

AdminChatShow.layout = (page) => (
    <AppLayout breadcrumbs={breadcrumbs} children={page} />
);
