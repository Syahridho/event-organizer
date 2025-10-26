import React from "react";
import { Head } from "@inertiajs/react";
import AppLayout from "@/Layouts/App/AppSidebarLayout";
import ChatLayout from "@/components/ChatLayout.jsx";
import useRealtimeChatUpdates from "@/hooks/useRealtimeChatUpdates.js";

const breadcrumbs = [
    {
        title: "Dashboard Admin",
        href: "/admin/dashboard",
    },
    {
        title: "Chat",
        href: "/admin/dashboard/chat",
    },
];

export default function AdminChat() {
    // Use the custom hook for real-time updates
    useRealtimeChatUpdates();

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <Head title="Admin Chat" />

            <ChatLayout />
        </div>
    );
}

AdminChat.layout = (page) => (
    <AppLayout breadcrumbs={breadcrumbs} children={page} />
);
