import { Head } from "@inertiajs/react";
import { DataTable } from "@/components/table-rent-admin.jsx";
import AppLayout from "@/Layouts/App/AppSidebarLayout";
import { usePage } from "@inertiajs/react";

const breadcrumbs = [
    {
        title: "Dashboard Admin",
        href: "/admin/dashboard",
    },
    {
        title: "Sewa Barang",
        href: "/admin/dashboard/rents",
    },
];

export default function BuildingAdmin() {
    const { auth, rents } = usePage().props;
    console.log(rents);
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="py-12">
                <DataTable data={rents ?? []} />
            </div>
        </AppLayout>
    );
}
