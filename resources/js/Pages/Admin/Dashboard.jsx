import AppLayout from "@/Layouts/App/AppSidebarLayout";
import { Head, router, Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    LineChart,
    Line,
    Area,
    AreaChart,
} from "recharts";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { TrendingUp, Calendar, DollarSign, Activity } from "lucide-react";
import React, { useMemo } from "react";

const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Admin", href: "/admin/dashboard" },
];

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
                <p className="text-sm font-semibold text-slate-700 mb-1">
                    {label}
                </p>
                <p className="text-sm text-slate-600">
                    Penjualan:{" "}
                    <span className="font-bold text-primary">
                        Rp {payload[0].value.toLocaleString("id-ID")}
                    </span>
                </p>
            </div>
        );
    }
    return null;
};

export default function AdminDashboard({
    auth,
    stats,
    chartData,
    taxIncome,
    currentTaxFilter,
}) {
    const handleTaxFilterChange = (value) => {
        router.get(
            route("admin.index"),
            { tax_filter: value },
            {
                preserveState: true,
                preserveScroll: true,
                only: ["taxIncome", "currentTaxFilter"],
            }
        );
    };

    // Sanitize and prepare chart series
    const chartSeries = useMemo(() => {
        const safe = Array.isArray(chartData) ? chartData : [];
        const sanitized = safe
            .map((it) => ({
                day: String(it?.day ?? it?.label ?? ""),
                sales: Number(it?.sales ?? it?.value ?? 0) || 0,
            }))
            .filter((d) => d.day);
        if (sanitized.length > 0) return sanitized;
        // Fallback 7 days dataset so chart remains visible
        const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
        return days.map((d) => ({ day: d, sales: 0 }));
    }, [chartData]);

    // Calculate weekly trend
    const weeklySales = chartSeries.reduce(
        (sum, item) => sum + (Number(item.sales) || 0),
        0
    );
    const avgDailySales =
        chartSeries.length > 0 ? weeklySales / chartSeries.length : 0;
    const hasData = chartSeries.some((d) => (Number(d.sales) || 0) > 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />

            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                {/* Statistik */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-slate-600">
                                    Event Aktif
                                </CardTitle>
                                <Activity className="h-4 w-4 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl sm:text-3xl font-bold text-slate-800">
                                {stats?.events || 0}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Event yang sedang berjalan
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-slate-600">
                                    Pending Payment
                                </CardTitle>
                                <Calendar className="h-4 w-4 text-amber-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl sm:text-3xl font-bold text-slate-800">
                                {stats?.pendingPayments || 0}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Menunggu pembayaran
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-slate-600">
                                    Total Transaksi
                                </CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl sm:text-3xl font-bold text-slate-800">
                                {stats?.totalTransactions || 0}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Semua transaksi
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-slate-600">
                                    Pendapatan Bulan Ini
                                </CardTitle>
                                <DollarSign className="h-4 w-4 text-emerald-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xl sm:text-2xl font-bold text-slate-800">
                                Rp{" "}
                                {(stats?.revenueThisMonth || 0).toLocaleString(
                                    "id-ID"
                                )}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Revenue bulan{" "}
                                {new Date().toLocaleDateString("id-ID", {
                                    month: "long",
                                })}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-slate-600">
                                    Laba Bersih (Tax)
                                </CardTitle>
                                <DollarSign className="h-4 w-4 text-purple-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">
                                Rp {(taxIncome || 0).toLocaleString("id-ID")}
                            </p>
                            <Select
                                value={currentTaxFilter}
                                onValueChange={handleTaxFilterChange}
                            >
                                <SelectTrigger className="h-8 text-xs w-full">
                                    <SelectValue placeholder="Pilih Periode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="day">Hari Ini</SelectItem>
                                    <SelectItem value="week">Minggu Ini</SelectItem>
                                    <SelectItem value="month">Bulan Ini</SelectItem>
                                    <SelectItem value="3_months">
                                        3 Bulan Terakhir
                                    </SelectItem>
                                    <SelectItem value="6_months">
                                        6 Bulan Terakhir
                                    </SelectItem>
                                    <SelectItem value="year">
                                        Tahun Ini
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                </div>

                {/* Grafik Penjualan Mingguan */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-xl sm:text-2xl font-bold">
                                    Penjualan Mingguan
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Trend penjualan 7 hari terakhir
                                </CardDescription>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500">
                                    Total Minggu Ini
                                </p>
                                <p className="text-lg font-bold text-primary">
                                    Rp {weeklySales.toLocaleString("id-ID")}
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Bar Chart */}
                            <div>
                                <div className="w-full h-[350px]">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart
                                            data={chartSeries}
                                            margin={{
                                                top: 10,
                                                right: 10,
                                                left: 0,
                                                bottom: 0,
                                            }}
                                        >
                                            <defs>
                                                <linearGradient
                                                    id="colorGradient"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="0%"
                                                        stopColor="#3b82f6"
                                                        stopOpacity={1}
                                                    />
                                                    <stop
                                                        offset="100%"
                                                        stopColor="#60a5fa"
                                                        stopOpacity={0.8}
                                                    />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#e2e8f0"
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey="day"
                                                tick={{
                                                    fill: "#64748b",
                                                    fontSize: 12,
                                                }}
                                                axisLine={{ stroke: "#cbd5e1" }}
                                            />
                                            <YAxis
                                                tick={{
                                                    fill: "#64748b",
                                                    fontSize: 12,
                                                }}
                                                axisLine={{ stroke: "#cbd5e1" }}
                                                tickFormatter={(value) =>
                                                    `${(
                                                        Number(value) / 1000
                                                    ).toFixed(0)}k`
                                                }
                                            />
                                            <Tooltip
                                                content={<CustomTooltip />}
                                            />
                                            <Bar
                                                dataKey="sales"
                                                fill="url(#colorGradient)"
                                                radius={[8, 8, 0, 0]}
                                                animationDuration={800}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                {!hasData && (
                                    <p className="text-xs text-slate-500 text-center">
                                        Belum ada data penjualan untuk
                                        ditampilkan.
                                    </p>
                                )}
                            </div>

                            {/* Stats Summary */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t">
                                <div className="text-center">
                                    <p className="text-xs text-slate-500">
                                        Rata-rata Harian
                                    </p>
                                    <p className="text-lg font-semibold text-slate-800">
                                        Rp{" "}
                                        {avgDailySales.toLocaleString("id-ID", {
                                            maximumFractionDigits: 0,
                                        })}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-slate-500">
                                        Hari Terbaik
                                    </p>
                                    <p className="text-lg font-semibold text-green-600">
                                        {chartData?.length > 0
                                            ? chartData.reduce((max, item) =>
                                                  item.sales > max.sales
                                                      ? item
                                                      : max
                                              ).day
                                            : "-"}
                                    </p>
                                </div>
                                <div className="text-center col-span-2 sm:col-span-1">
                                    <p className="text-xs text-slate-500">
                                        Total Transaksi
                                    </p>
                                    <p className="text-lg font-semibold text-blue-600">
                                        {chartData?.length || 0} hari
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>


            </div>
        </AppLayout>
    );
}
