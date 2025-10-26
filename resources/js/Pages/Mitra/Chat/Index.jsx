import React from "react";
import { Head } from "@inertiajs/react";
import AppLayout from "@/Layouts/App/AppSidebarLayout";
import ChatLayout from "@/components/ChatLayout.jsx";
import useRealtimeChatUpdates from "@/hooks/useRealtimeChatUpdates.js";

const breadcrumbs = [
    {
        title: "Dashboard Mitra",
        href: "/dashboard",
    },
    {
        title: "Chat",
        href: "/dashboard/chat",
    },
];

export default function MitraChat() {
    // Use the custom hook for real-time updates
    useRealtimeChatUpdates();

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <Head title="Pesan Mitra" />

            <ChatLayout />
        </div>
    );
}

MitraChat.layout = (page) => (
    <AppLayout breadcrumbs={breadcrumbs} children={page} />
);
