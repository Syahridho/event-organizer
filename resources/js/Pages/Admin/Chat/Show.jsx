import React, { Fragment, useEffect, useRef, useState } from "react";
import { Head, router } from "@inertiajs/react";
import { debounce } from "lodash";
import AppLayout from "@/Layouts/App/AppSidebarLayout";
import ChatLayout from "@/Components/ChatLayout.jsx";
import useRealtimeChatUpdates from "@/hooks/useRealtimeChatUpdates.js";
import { useOnlineStatusContext } from "@/Components/OnlineStatusProvider.jsx";

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
        const debouncedMessageReload = debounce(() => {
            router.reload({
                preserveScroll: true,
                only: ["messages"], // Only reload messages
            });
        }, 350);

        window.Echo.private("message." + auth.user.uuid).listen(
            "NewMessageEvent",
            (e) => {
                // Check if the message is for the current chat
                if (
                    e.message.sender_id === chatWithUser.id ||
                    e.message.receiver_id === chatWithUser.id
                ) {
                    debouncedMessageReload();
                }
            }
        );

        return () => {
            window.Echo.private("message." + auth.user.uuid).stopListening(
                "NewMessageEvent"
            );
        };
    }, [auth.user.uuid, chatWithUser.id]);

    useEffect(() => {
        scrollRef.current?.scrollTo(0, scrollRef.current?.scrollHeight);
    }, [messages, reply]);

    window.Echo.private("message." + auth.user.uuid).listenForWhisper(
        "typing",
        () => {
            setIsTyping(true);

            setTimeout(() => {
                setIsTyping(false);
            }, 2000);
        }
    );

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
