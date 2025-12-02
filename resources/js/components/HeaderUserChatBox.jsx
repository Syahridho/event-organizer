import React, { useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import { useOnlineStatusContext } from "@/Components/OnlineStatusProvider.jsx";
import { getUserStatusIndo } from "@/Utils/Formatters.js";

export default function HeaderUserChatBox({ user, isOnline, isTyping }) {
    const { auth } = usePage().props;
    const { isUserOnline } = useOnlineStatusContext();

    // Check if user is online using the context
    const userIsOnline = isUserOnline(user?.id);

    // Get formatted status in Indonesian using the new robust formatter
    const statusText = getUserStatusIndo(user?.last_seen_at, userIsOnline);

    // Determine the correct route based on user role
    const getChatIndexRoute = () => {
        if (auth.user.role === "admin") {
            return "admin.chat";
        } else if (auth.user.role === "mitra") {
            return "mitra.chat";
        }
        return "chat.index";
    };

    return (
        <>
            <div className="flex items-center">
                <Link
                    href={route(getChatIndexRoute())}
                    className="flex lg:hidden items-center -ml-2 mr-2"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5 text-gray-400"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75"
                        />
                    </svg>
                </Link>
                <div className="relative inline-block">
                    <span className="inline-flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 bg-gray-700 rounded-full">
                        <span className="font-medium leading-none text-white">
                            {user?.name?.charAt(0).toUpperCase()}
                        </span>
                    </span>
                </div>
                <div className="flex flex-col flex-1 min-w-0 ml-4">
                    <div className="text-xs lg:text-sm font-medium text-slate-800 truncate">
                        {user?.name}
                    </div>
                    <div className="text-slate-400 text-[10px] lg:text-xs truncate mt-0.5 tracking-tight">
                        {isTyping
                            ? `${user?.name} sedang mengetik...`
                            : statusText}
                    </div>
                </div>
            </div>
        </>
    );
}
