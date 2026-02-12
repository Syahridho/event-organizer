import { Head } from "@inertiajs/react";
import { DataTable } from "@/components/table-services-admin.jsx";
import AppLayout from "@/Layouts/App/AppSidebarLayout";
import { usePage } from "@inertiajs/react";

const breadcrumbs = [
    {
        title: "Dashboard Admin",
        href: "/admin/dashboard",
    },
    {
        title: "Jasa",
        href: "/admin/dashboard/services",
    },
];

export default function ServiceAdmin() {
    const { auth, services } = usePage().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="py-12">
                <DataTable data={services ?? []} />
            </div>
        </AppLayout>
    );
}
