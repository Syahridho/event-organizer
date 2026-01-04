import React from "react";
import { Link, usePage } from "@inertiajs/react";
import ProfilePictureOnChat from "@/components/ProfilePictureOnChat.jsx";
import clsx from "clsx";
import { useOnlineStatusContext } from "@/components/OnlineStatusProvider.jsx";
import {
    getUserStatusIndo,
    formatRelativeTime,
    formatChatTime,
} from "@/Utils/Formatters.js";

export default function ChatSidebar({
    showBackButton = false,
    backUrl = null,
    currentUser = null,
}) {
    const { chat_with: chatWithUser, auth, users } = usePage().props;
    const { data: userList } = users;
    const { isUserOnline } = useOnlineStatusContext();

    return (
        <div className="w-full lg:w-80 border-r border-gray-200 bg-white flex flex-col">
            <div className="p-4 border-b border-gray-200">
                {showBackButton && (
                    <Link
                        href={
                            backUrl ||
                            (auth.user.role === "admin"
                                ? route("admin.chat")
                                : auth.user.role === "mitra"
                                ? route("mitra.chat")
                                : route("chat.index"))
                        }
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 mb-3 inline-block"
                    >
                        Kembali
                    </Link>
                )}
                <h2 className="text-lg font-semibold">
                    {currentUser ? currentUser.name : "Pesan"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    {currentUser ? `Chat Dengan ${currentUser.name}` : null}
                </p>
            </div>

            {/* Always show the chat list, even in detail view */}
            <div className="flex-1 overflow-y-auto">
                {userList?.map((user) => {
                    let chat = null;
                    const receiveMessage =
                        user?.receive_messages?.length > 0 &&
                        user?.receive_messages[0];
                    const sendMessage =
                        user?.send_messages?.length > 0 &&
                        user?.send_messages[0];

                    if (receiveMessage && sendMessage)
                        chat =
                            receiveMessage?.id > sendMessage?.id
                                ? receiveMessage
                                : sendMessage;
                    else if (receiveMessage) chat = receiveMessage;
                    else if (sendMessage) chat = sendMessage;

                    const chatUrl =
                        auth.user.role === "mitra"
                            ? route("mitra.chat.show", user.uuid)
                            : auth.user.role === "admin"
                            ? route("admin.chat.show", user.uuid)
                            : route("chat.show", user.uuid);

                    // Fastest UI Integration: Local Status Determination
                    const isCurrentUserOnline = isUserOnline(user.id);

                    // Single Formatter Call: Integrate global status with local data
                    const statusText = getUserStatusIndo(
                        user.last_seen_at,
                        isCurrentUserOnline
                    );

                    return (
                        <Link
                            key={user.uuid}
                            href={chatUrl}
                            preserveScroll
                            className={clsx(
                                user.id === chatWithUser?.id
                                    ? "bg-blue-50 border-l-4 border-blue-500"
                                    : "hover:bg-gray-50",
                                "flex w-full items-center px-4 py-3 border-b border-gray-200 transition-colors duration-150"
                            )}
                        >
                            <div className="flex-shrink-0 mr-3">
                                <ProfilePictureOnChat user={user} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="text-sm font-medium text-gray-900 truncate">
                                        {user.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {chat?.sent_at
                                            ? formatChatTime(chat.sent_at)
                                            : ""}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <div>
                                            {chat?.sender_id === auth.user.id &&
                                                !chat?.message_deleted_at && (
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="24"
                                                        height="24"
                                                        fill="currentColor"
                                                        viewBox="0 0 24 24"
                                                        id="double-check"
                                                        className={clsx(
                                                            chat?.seen_at
                                                                ? "text-blue-500"
                                                                : "text-gray-400",
                                                            "w-4 h-4 mr-1"
                                                        )}
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M16.5303 6.46967C16.8232 6.76256 16.8232 7.23744 16.5303 7.53033L6.53033 17.5303C6.38968 17.671 6.19891 17.75 6 17.75 5.80109 17.75 5.61032 17.671 5.46967 17.5303L1.46967 13.5303C1.17678 13.2374 1.17678 12.7626 1.46967 12.4697 1.76256 12.1768 2.23744 12.1768 2.53033 12.4697L6 15.9393 15.4697 6.46967C15.7626 6.17678 16.2374 6.17678 16.5303 6.46967zM22.5303 6.46966C22.8232 6.76254 22.8232 7.23742 22.5303 7.53032L12.5308 17.5303C12.2379 17.8232 11.7631 17.8232 11.4702 17.5304L9.96975 16.0304C9.67681 15.7376 9.67674 15.2627 9.96959 14.9697 10.2624 14.6768 10.7373 14.6767 11.0303 14.9696L12.0004 15.9394 21.4697 6.46968C21.7625 6.17678 22.2374 6.17677 22.5303 6.46966z"
                                                            clipRule="evenodd"
                                                        ></path>
                                                    </svg>
                                                )}
                                        </div>
                                        {chat?.message_deleted_at ? (
                                            <span className="italic text-gray-500">
                                                {chat?.message}
                                            </span>
                                        ) : (
                                            <div
                                                className="overflow-hidden text-gray-600"
                                                style={{
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 1,
                                                    WebkitBoxOrient: "vertical",
                                                }}
                                            >
                                                {chat?.message}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {user.messages_count > 0 && (
                                            <div className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-500 rounded-full">
                                                {user.messages_count}
                                            </div>
                                        )}
                                        {/* Online status indicator */}
                                        <div className="flex items-center">
                                            {isCurrentUserOnline ? (
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            ) : (
                                                <span className="text-xs text-gray-400 hidden sm:block">
                                                    {user.last_seen_at
                                                        ? formatRelativeTime(
                                                              user.last_seen_at
                                                          )
                                                        : ""}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Dynamic Status Display below username */}
                                <div
                                    className={`text-xs sm:hidden mt-1 ${
                                        isCurrentUserOnline
                                            ? "text-green-500"
                                            : "text-gray-400"
                                    }`}
                                >
                                    {statusText}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
