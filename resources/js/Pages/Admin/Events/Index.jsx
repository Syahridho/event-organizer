import { Head } from "@inertiajs/react";
import { DataTable } from "@/Components/table-events-admin.jsx";
import AppLayout from "@/Layouts/App/AppSidebarLayout";
import { usePage } from "@inertiajs/react";

const breadcrumbs = [
    {
        title: "Dashboard Admin",
        href: "/admin/dashboard",
    },
    {
        title: "Events",
        href: "/admin/dashboard/events",
    },
];

export default function EventAdmin() {
    const { auth, events } = usePage().props;
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="py-12">
                <DataTable data={events ?? []} />
            </div>
        </AppLayout>
    );
}
