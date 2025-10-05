import { DataTable } from "@/components/data-table-building-user.jsx";
import AppLayout from "@/Layouts/App/AppSidebarLayout";
import { Head, usePage } from "@inertiajs/react";
import { useEffect } from "react";
import { toast } from "sonner";

const breadcrumbs = [
    {
        title: "Dashboard",
        href: "/dashboard",
    },
    {
        title: "Gedung",
        href: "/dashboard/buildings",
    },
];

export default function BuildingsPage() {
    const { buildings, flash } = usePage().props;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Building" />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <DataTable data={buildings ?? []} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
