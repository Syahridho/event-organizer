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
        title: "Pesan",
        href: "/admin/dashboard/chat",
    },
];

export default function AdminChat() {
    // Use the custom hook for real-time updates
    useRealtimeChatUpdates();

    return (
        <>
            <Head title="Admin Chat" />

            <ChatLayout />
        </>
    );
}

AdminChat.layout = (page) => (
    <AppLayout breadcrumbs={breadcrumbs} children={page} />
);
