import AppLayout from "@/Layouts/App/AppSidebarLayout";
import { Head } from "@inertiajs/react";
// Sesuaikan path import komponen DataTable Anda
import { MitraDataTable } from "@/components/MitraDataTable.jsx";

const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Pengajuan Jadi mitra", href: "/admin/mitra" },
];

export default function AdminMitraDashboard({ mitras }) {
    // Pastikan prop 'mitras' adalah array, yang sudah terkonfirmasi dari contoh data Anda.

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Mitra" />

            {/* Container utama dengan padding dan tata letak flex */}
            <div className="flex flex-1 flex-col gap-6 p-6">
                <h1 className="text-3xl font-bold tracking-tight">
                    Pengajuan Mitra
                </h1>
                <p className="text-muted-foreground">
                    Kelola semua pengajuan kemitraan di sini.
                </p>

                {/* Mempassing data mitras ke komponen DataTable */}
                <MitraDataTable data={mitras} />
            </div>
        </AppLayout>
    );
}
