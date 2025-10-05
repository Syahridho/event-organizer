import AppLayout from "@/Layouts/App/AppSidebarLayout";
import { Head } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Admin", href: "/admin/dashboard" },
];

export default function AdminDashboard({
    auth,
    stats,
    chartData,
    recentTransactions,
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Statistik */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Event Aktif</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">
                                {stats?.events}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Payment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">
                                {stats?.pendingPayments}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Total Transaksi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">
                                {stats?.totalTransactions}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Pendapatan Bulan Ini</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">
                                Rp {stats?.revenueThisMonth.toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Grafik */}
                <Card>
                    <CardHeader>
                        <CardTitle>Penjualan Mingguan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Bar
                                    dataKey="sales"
                                    fill="#3b82f6"
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Transaksi Terbaru */}
                <Card>
                    <CardHeader>
                        <CardTitle>Transaksi Terbaru</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Event</TableHead>
                                    <TableHead>Jumlah</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentTransactions?.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell>{tx.id}</TableCell>
                                        <TableCell>{tx.user}</TableCell>
                                        <TableCell>{tx.event}</TableCell>
                                        <TableCell>
                                            Rp {tx.amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`px-2 py-1 rounded text-xs ${
                                                    tx.status === "paid"
                                                        ? "bg-green-100 text-green-600"
                                                        : tx.status ===
                                                          "pending"
                                                        ? "bg-yellow-100 text-yellow-600"
                                                        : "bg-red-100 text-red-600"
                                                }`}
                                            >
                                                {tx.status}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
