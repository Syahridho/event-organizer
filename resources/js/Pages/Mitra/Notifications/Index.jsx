import { Head } from "@inertiajs/react";
import AppLayout from "@/Layouts/App/AppSidebarLayout";
import NotificationsIndex from "@/Pages/Notifications/Index";

const breadcrumbs = [
    {
        title: "Dashboard Mitra",
        href: "/dashboard",
    },
];

export default function NotificationDashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Mitra" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <NotificationsIndex />
            </div>
        </AppLayout>
    );
}
