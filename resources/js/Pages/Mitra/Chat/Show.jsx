import React, { Fragment, useEffect, useRef, useState } from "react";
import { Head, router } from "@inertiajs/react";
import { debounce } from "lodash";
import AppLayout from "@/Layouts/App/AppSidebarLayout";
import ChatLayout from "@/components/ChatLayout.jsx";
import DateChatIndicator from "@/components/DateChatIndicator.jsx";
import LeftSideBoxChat from "@/components/LeftSideBoxChat.jsx";
import RightSideBoxChat from "@/components/RightSideBoxChat.jsx";
import useRealtimeChatUpdates from "@/hooks/useRealtimeChatUpdates.js";

const breadcrumbs = [
    {
        title: "Dashboard Mitra",
        href: "/dashboard",
    },
    {
        title: "Pesan",
        href: "/dashboard/chat",
    },
];

export default function Show({ auth, chat_with: chatWithUser, messages }) {
    // const { auth, chat_with: chatWithUser, messages } = usePage().props;

    const scrollRef = useRef(null);
    const [reply, setReply] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [localMessages, setLocalMessages] = useState(messages);
    // const { isUserOnline } = useOnlineStatusContext();

    // Use the custom hook for real-time updates
    // This will handle both chat list and message updates
    useRealtimeChatUpdates();

    // Update local messages when props change
    useEffect(() => {
        setLocalMessages(messages);
    }, [messages]);

    // Additional effect for message-specific updates
    useEffect(() => {
        console.log("[DEBUG] Chat Show message listener effect triggered");
        console.log("[DEBUG] Echo available:", !!window.Echo);
        console.log("[DEBUG] User UUID:", auth.user.uuid);
        console.log("[DEBUG] Chat with user ID:", chatWithUser.id);

        // Function to set up message listeners
        const setupMessageListeners = () => {
            if (!window.Echo) {
                console.warn(
                    "[DEBUG] Echo is not initialized yet in Chat Show"
                );
                return false;
            }

            const channelName = "message." + auth.user.uuid;
            console.log(
                "[DEBUG] Chat Show subscribing to channel:",
                channelName
            );
            const channel = window.Echo.private(channelName);

            channel
                .listen("NewMessageEvent", (e) => {
                    console.log(
                        "[DEBUG] Chat Show NewMessageEvent received:",
                        e
                    );
                    console.log(
                        "[DEBUG] Message sender_id:",
                        e.message.sender_id,
                        "receiver_id:",
                        e.message.receiver_id
                    );
                    console.log(
                        "[DEBUG] Current chat user ID:",
                        chatWithUser.id
                    );

                    // Check if the message is for the current chat
                    if (
                        e.message.sender_id === chatWithUser.id ||
                        e.message.receiver_id === chatWithUser.id
                    ) {
                        console.log(
                            "[DEBUG] Message is for current chat, updating local messages"
                        );
                        // Update messages state locally instead of reloading
                        setLocalMessages((prevMessages) => {
                            // Check if message already exists to avoid duplicates
                            const messageExists = prevMessages.some(
                                (msg) => msg.id === e.message.id
                            );
                            if (!messageExists) {
                                console.log(
                                    "[DEBUG] Adding new message to local state"
                                );
                                return [...prevMessages, e.message];
                            }
                            console.log(
                                "[DEBUG] Message already exists, not adding"
                            );
                            return prevMessages;
                        });
                    } else {
                        console.log(
                            "[DEBUG] Message is not for current chat, ignoring"
                        );
                    }
                })
                .error((error) => {
                    console.error(
                        "[DEBUG] Chat Show channel subscription error:",
                        error
                    );
                });

            // Store cleanup function
            window._chatShowCleanup = () => {
                console.log("[DEBUG] Cleaning up Chat Show message listener");
                if (window.Echo) {
                    channel.stopListening("NewMessageEvent");
                }
            };

            return true;
        };

        // Try to set up listeners immediately
        if (setupMessageListeners()) {
            return () => {
                if (window._chatShowCleanup) {
                    window._chatShowCleanup();
                    delete window._chatShowCleanup;
                }
            };
        }

        // If Echo is not ready, wait for it to be initialized
        const checkEchoInterval = setInterval(() => {
            if (window.Echo) {
                console.log(
                    "[DEBUG] Echo detected in Chat Show, setting up listeners"
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
                "[DEBUG] Echo initialization timeout in Chat Show after 5 seconds"
            );
        }, 5000);

        return () => {
            clearInterval(checkEchoInterval);
            clearTimeout(timeout);
            if (window._chatShowCleanup) {
                window._chatShowCleanup();
                delete window._chatShowCleanup;
            }
        };
    }, [auth.user.uuid, chatWithUser.id]);

    const replyHandleState = (message) => {
        setReply(message);
    };

    useEffect(() => {
        scrollRef.current?.scrollTo(0, scrollRef.current?.scrollHeight);
    }, [localMessages, reply]);

    // Setup typing listener
    useEffect(() => {
        console.log("[DEBUG] Chat Show typing listener effect triggered");

        // Function to set up typing listeners
        const setupTypingListeners = () => {
            if (!window.Echo) {
                console.warn("[DEBUG] Echo is not initialized yet for typing");
                return false;
            }

            const channel = window.Echo.private("message." + auth.user.uuid);
            console.log("[DEBUG] Chat Show setting up typing listener");

            channel.listenForWhisper("typing", () => {
                console.log("[DEBUG] Typing whisper received");
                setIsTyping(true);

                setTimeout(() => {
                    setIsTyping(false);
                }, 2000);
            });

            // Store cleanup function
            window._typingCleanup = () => {
                console.log("[DEBUG] Cleaning up Chat Show typing listener");
                if (window.Echo) {
                    channel.stopListeningForWhisper("typing");
                }
            };

            return true;
        };

        // Try to set up listeners immediately
        if (setupTypingListeners()) {
            return () => {
                if (window._typingCleanup) {
                    window._typingCleanup();
                    delete window._typingCleanup;
                }
            };
        }

        // If Echo is not ready, wait for it to be initialized
        const checkEchoInterval = setInterval(() => {
            if (window.Echo) {
                console.log(
                    "[DEBUG] Echo detected for typing, setting up listeners"
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
                "[DEBUG] Echo initialization timeout for typing after 5 seconds"
            );
        }, 5000);

        return () => {
            clearInterval(checkEchoInterval);
            clearTimeout(timeout);
            if (window._typingCleanup) {
                window._typingCleanup();
                delete window._typingCleanup;
            }
        };
    }, [auth.user.uuid]);

    return (
        <>
            <Head title="Chat" />

            <ChatLayout
                showBackButton={true}
                backUrl={route("mitra.chat")}
                currentUser={chatWithUser}
                messages={localMessages}
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

Show.layout = (page) => <AppLayout breadcrumbs={breadcrumbs} children={page} />;
