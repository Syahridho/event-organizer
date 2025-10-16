import { Head } from "@inertiajs/react";
import { usePage } from "@inertiajs/react";
import Chat from "@/Pages/Chat/Index";
import Show from "@/Pages/Chat/Show";
import AppLayout from "@/Layouts/App/AppSidebarLayout";
import App from "@/Layouts/App";
import AppChat from "@/Layouts/App";

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
    const { chat_with } = usePage().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            {/* <Head title="Dashboard Mitra" /> */}

            <div className="flex flex-1 flex-col gap-4 p-4">
                <AppChat />
            </div>
        </AppLayout>
    );
}
