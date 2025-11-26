import AppLayout from "@/Layouts/App/AppSidebarLayout";
import { Head, Link } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const breadcrumbs = [
    { title: "Dashboard", href: "/admin/dashboard" },
    { title: "Transaksi", href: "/admin/transactions" },
];

export default function AdminTransactionsIndex({ transactions }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Daftar Transaksi" />

            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl sm:text-2xl font-bold">
                            Daftar Semua Transaksi
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Pantau semua transaksi yang masuk
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="font-semibold">ID</TableHead>
                                        <TableHead className="font-semibold">User</TableHead>
                                        <TableHead className="font-semibold">Event/Item</TableHead>
                                        <TableHead className="font-semibold">Tanggal</TableHead>
                                        <TableHead className="font-semibold text-right">Jumlah</TableHead>
                                        <TableHead className="font-semibold text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions?.data?.length > 0 ? (
                                        transactions.data.map((tx) => (
                                            <TableRow
                                                key={tx.id}
                                                className="hover:bg-slate-50 transition-colors"
                                            >
                                                <TableCell className="font-medium">#{tx.id}</TableCell>
                                                <TableCell>{tx.user}</TableCell>
                                                <TableCell className="max-w-xs truncate">
                                                    {tx.event}
                                                </TableCell>
                                                <TableCell>
                                                    {format(new Date(tx.created_at), "dd MMM yyyy HH:mm", { locale: id })}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    Rp {tx.amount.toLocaleString("id-ID")}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            tx.status === "paid" || tx.status === "settlement"
                                                                ? "bg-green-100 text-green-800"
                                                                : tx.status === "pending"
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {tx.status === "paid" || tx.status === "settlement"
                                                            ? "Lunas"
                                                            : tx.status === "pending"
                                                            ? "Pending"
                                                            : "Dibatalkan"}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="text-center py-8 text-slate-500"
                                            >
                                                Belum ada transaksi
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Controls */}
                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Menampilkan {transactions.from} sampai {transactions.to} dari {transactions.total} hasil
                            </div>
                            <div className="flex gap-2">
                                {transactions?.links?.map((link, i) => (
                                    <Button
                                        key={i}
                                        variant={link.active ? "default" : "outline"}
                                        size="sm"
                                        asChild
                                        disabled={!link.url}
                                    >
                                        {link.url ? (
                                            <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                                        ) : (
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
