import { DataTable } from "@/components/data-table-service-user.jsx";
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
        title: "Jasa",
        href: "/dashboard/service",
    },
];

export default function ServicesPage() {
    const { services, flash } = usePage().props;

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
            <Head title="Dashboard Jasa" />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <DataTable data={services ?? []} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
