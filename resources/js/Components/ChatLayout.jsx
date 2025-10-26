import React, { useState, useEffect } from "react";
import { usePage } from "@inertiajs/react";
import ChatSidebar from "@/components/ChatSidebar.jsx";
import HeaderUserChatBox from "@/components/HeaderUserChatBox.jsx";
import ChatInputMessage from "@/components/ChatInputMessage.jsx";
import DateChatIndicator from "@/components/DateChatIndicator.jsx";
import LeftSideBoxChat from "@/components/LeftSideBoxChat.jsx";
import RightSideBoxChat from "@/components/RightSideBoxChat.jsx";
import { useOnlineStatusContext } from "@/components/OnlineStatusProvider.jsx";

export default function ChatLayout({
    showBackButton = false,
    backUrl = null,
    currentUser = null,
    messages = null,
    onlineUsers = [],
    isTyping = false,
    reply = null,
    setReply = null,
    setIsTyping = null,
    scrollRef = null,
    children,
}) {
    const { auth } = usePage().props;
    const [isMobile, setIsMobile] = useState(false);
    const { isUserOnline } = useOnlineStatusContext();

    // Determine if we're on a detail view (has UUID parameter)
    const isDetailView = currentUser !== null;

    // Detect mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);

        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // WhatsApp-style responsive logic:
    // - On mobile: Show only list on index, only detail on show
    // - On desktop: Show both list and detail
    return (
        <div className="h-[calc(100vh-8rem)] border border-gray-200 rounded-lg shadow-sm">
            <div className="flex h-full">
                {/* Chat Sidebar - Hidden on mobile detail view, visible on desktop */}
                <div
                    className={`
                    ${isDetailView && isMobile ? "hidden" : "flex"}
                    ${isMobile ? "w-full" : "w-80"}
                    border-r border-gray-200 bg-white flex-col
                `}
                >
                    <ChatSidebar
                        showBackButton={showBackButton}
                        backUrl={backUrl}
                        currentUser={currentUser}
                    />
                </div>

                {/* Chat Content - Hidden on mobile list view, visible on desktop and mobile detail view */}
                {isDetailView && (
                    <div
                        className={`
                        ${isMobile ? "w-full" : "flex-1"}
                        flex-col bg-white flex
                    `}
                    >
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <HeaderUserChatBox
                                    user={currentUser}
                                    isOnline={isUserOnline(currentUser.id)}
                                    isTyping={isTyping}
                                />
                            </div>
                        </div>

                        <div
                            className="flex-1 px-6 py-4 overflow-y-auto"
                            ref={scrollRef}
                        >
                            <div className="space-y-4">
                                {messages &&
                                    renderMessages(
                                        messages,
                                        auth,
                                        reply,
                                        setReply
                                    )}
                            </div>
                        </div>

                        <div
                            className={`transform transition-transform ${
                                reply ? "translate-y-0" : "translate-y-full"
                            } duration-150 ease-in-out`}
                        >
                            {reply && (
                                <div className="flex items-center py-2 border-t border-gray-200 px-6">
                                    <div className="flex items-center justify-between w-full px-3 py-2 bg-gray-50 border-l-4 border-blue-500 rounded">
                                        <div className="text-sm">
                                            <div className="mb-1 text-blue-600 font-medium">
                                                {reply.sender_id ===
                                                auth.user.id
                                                    ? "You"
                                                    : currentUser.name}
                                            </div>
                                            <div
                                                className="overflow-hidden text-gray-600"
                                                style={{
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                }}
                                            >
                                                <div className="whitespace-pre-wrap">
                                                    {reply.message}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setReply(null)}
                                            className="w-6 h-6 text-gray-400 hover:text-gray-600 transition duration-300"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="w-4 h-4"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200">
                            <ChatInputMessage
                                reply={reply}
                                setReply={setReply}
                                setIsTyping={setIsTyping}
                            />
                        </div>
                    </div>
                )}

                {/* Empty state for list view on desktop */}
                {!isDetailView && !isMobile && (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <div className="text-gray-400 mb-4">
                                <svg
                                    className="w-16 h-16 mx-auto"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Select a conversation
                            </h3>
                            <p className="text-gray-500">
                                Choose a user from the list to start chatting
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper function to render messages
function renderMessages(messages, auth, reply, setReply) {
    return messages?.map((date) => (
        <React.Fragment key={date.date}>
            <DateChatIndicator date={date.date} />
            {date.messages.map((message, idx) => {
                const isFirstMessage =
                    idx === 0 ||
                    message.sender_id !== date.messages[idx - 1].sender_id;
                return (
                    <React.Fragment key={message.id}>
                        {message.sender_id === auth.user.id ? (
                            <RightSideBoxChat
                                message={message}
                                isFirstMessage={isFirstMessage}
                                replyHandleState={setReply}
                            />
                        ) : (
                            <LeftSideBoxChat
                                message={message}
                                isFirstMessage={isFirstMessage}
                                replyHandleState={setReply}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </React.Fragment>
    ));
}
