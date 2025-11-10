import React, { Fragment, useEffect, useRef, useState } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import { Link } from "@inertiajs/react";
import { debounce } from "lodash";
import AppLayout from "@/Layouts/App/AppSidebarLayout";
import ChatLayout from "@/components/ChatLayout.jsx";
import ChatSidebar from "@/components/ChatSidebar.jsx";
import HeaderUserChatBox from "@/components/HeaderUserChatBox.jsx";
import ChatInputMessage from "@/components/ChatInputMessage.jsx";
import DateChatIndicator from "@/components/DateChatIndicator.jsx";
import LeftSideBoxChat from "@/components/LeftSideBoxChat.jsx";
import RightSideBoxChat from "@/components/RightSideBoxChat.jsx";
import useRealtimeChatUpdates from "@/hooks/useRealtimeChatUpdates.js";
import { useOnlineStatusContext } from "@/components/OnlineStatusProvider.jsx";

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
    const { isUserOnline } = useOnlineStatusContext();

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

        Echo.private("message." + auth.user.uuid).listen(
            "NewMessageEvent",
            (e) => {
                // Check if the message is for the current chat
                if (
                    e.message.sender_id === chatWithUser.id ||
                    e.message.receiver_id === chatWithUser.id
                ) {
                    console.log(
                        "New message for current chat, updating messages"
                    );
                    debouncedMessageReload();
                }
            }
        );

        return () => {
            Echo.private("message." + auth.user.uuid).stopListening(
                "NewMessageEvent"
            );
        };
    }, [auth.user.uuid, chatWithUser.id]);

    const replyHandleState = (message) => {
        setReply(message);
    };

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

    const renderMessage = (messages, auth) => {
        return messages?.map((date) => (
            <Fragment key={date.date}>
                <DateChatIndicator date={date.date} />
                {date.messages.map((message, idx) => {
                    const isFirstMessage =
                        idx === 0 ||
                        message.sender_id !== date.messages[idx - 1].sender_id;
                    return (
                        <Fragment key={message.id}>
                            {message.sender_id === auth.user.id ? (
                                <RightSideBoxChat
                                    message={message}
                                    isFirstMessage={isFirstMessage}
                                    replyHandleState={replyHandleState}
                                />
                            ) : (
                                <LeftSideBoxChat
                                    message={message}
                                    isFirstMessage={isFirstMessage}
                                    replyHandleState={replyHandleState}
                                />
                            )}
                        </Fragment>
                    );
                })}
            </Fragment>
        ));
    };
    return (
        <>
            <Head title="Chat" />

            <ChatLayout
                showBackButton={true}
                backUrl={route("mitra.chat")}
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

Show.layout = (page) => <AppLayout breadcrumbs={breadcrumbs} children={page} />;
