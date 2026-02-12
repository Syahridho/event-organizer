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
        // Check if Echo is initialized
        if (!window.Echo) {
            console.warn("Echo is not initialized yet");
            return;
        }

        const channel = window.Echo.private("message." + auth.user.uuid);

        channel.listen("NewMessageEvent", (e) => {
            // Check if the message is for the current chat
            if (
                e.message.sender_id === chatWithUser.id ||
                e.message.receiver_id === chatWithUser.id
            ) {
                // Update messages state locally instead of reloading
                setLocalMessages((prevMessages) => {
                    // Check if message already exists to avoid duplicates
                    const messageExists = prevMessages.some(
                        (msg) => msg.id === e.message.id
                    );
                    if (!messageExists) {
                        return [...prevMessages, e.message];
                    }
                    return prevMessages;
                });
            }
        });

        return () => {
            if (window.Echo) {
                channel.stopListening("NewMessageEvent");
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
        // Check if Echo is initialized
        if (!window.Echo) {
            console.warn("Echo is not initialized yet");
            return;
        }

        const channel = window.Echo.private("message." + auth.user.uuid);

        channel.listenForWhisper("typing", () => {
            setIsTyping(true);

            setTimeout(() => {
                setIsTyping(false);
            }, 2000);
        });

        return () => {
            if (window.Echo) {
                channel.stopListeningForWhisper("typing");
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
