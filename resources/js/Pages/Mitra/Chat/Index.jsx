import React from "react";
import { Head } from "@inertiajs/react";
import AppLayout from "@/Layouts/App/AppSidebarLayout";
import ChatLayout from "@/Components/ChatLayout.jsx";
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

export default function MitraChat() {
    // Use the custom hook for real-time updates
    useRealtimeChatUpdates();

    return (
        <>
            <Head title="Pesan Mitra" />

            <ChatLayout />
        </>
    );
}

MitraChat.layout = (page) => (
    <AppLayout breadcrumbs={breadcrumbs} children={page} />
);
