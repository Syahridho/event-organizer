import { Head } from "@inertiajs/react";
import { DataTable } from "@/Components/table-building-admin.jsx";
import AppLayout from "@/Layouts/App/AppSidebarLayout";
import { usePage } from "@inertiajs/react";

const breadcrumbs = [
    {
        title: "Dashboard Admin",
        href: "/admin/dashboard",
    },
    {
        title: "Gedung",
        href: "/admin/dashboard/buildings",
    },
];

export default function BuildingAdmin() {
    const { auth, buildings } = usePage().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="py-12">
                <DataTable data={buildings ?? []} />
            </div>
        </AppLayout>
    );
}
