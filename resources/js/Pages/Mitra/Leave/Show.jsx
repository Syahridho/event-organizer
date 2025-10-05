"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import HolidayCalendar from "../../../components/holiday-calendar";
import { Calendar, ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "../../../Layouts/App/AppSidebarLayout";
import { Head, router, usePage } from "@inertiajs/react";

export default function Show({
    item,
    itemType,
    existingLeaves = [],
    bookedDates,
    title,
}) {
    const { auth } = usePage().props;
    const [selectedDates, setSelectedDates] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [disabledDays, setDisabledDays] = useState([]);
    const [deletingDates, setDeletingDates] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(false);

    const breadcrumbs = [
        { title: "Dashboard", href: "/dashboard" },
        { title: "Cuti Mitra", href: "/dashboard/leaves" },
        { title: `Kelola Cuti - ${item.name}`, href: "#" },
    ];

    useEffect(() => {
        const weeklyLeaves = existingLeaves
            .filter((leave) => leave.day_of_week && !leave.date)
            .map((leave) => leave.day_of_week);
        setDisabledDays(weeklyLeaves);
    }, [existingLeaves]);

    const checkTransactionsOnDate = async (dateStr) => {
        try {
            // Gunakan router.post untuk consistency dengan Inertia
            const response = await fetch(`/transactions/check-date`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN":
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute("content") || "",
                },
                body: JSON.stringify({
                    date: dateStr,
                    user_id: auth?.user?.id,
                    item_id: item.id,
                    item_type: itemType,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                return result.has_transactions || false;
            }
            return false;
        } catch (error) {
            toast.error("Gagal memeriksa transaksi");
            console.error("Error checking transactions:", error);
            return false;
        }
    };

    const handleDayToggle = async (dayName) => {
        try {
            setIsDataLoading(true);
            const existingWeeklyLeave = existingLeaves.find(
                (l) => l.day_of_week === dayName && !l.date
            );

            // Cek apakah ada transaksi di hari tersebut
            const checkResponse = await fetch("/transactions/check-weekly", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN":
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute("content") || "",
                },
                body: JSON.stringify({
                    item_id: item.id,
                    item_type: itemType,
                    day_of_week: dayName,
                }),
            });

            const checkResult = await checkResponse.json();
            if (checkResult?.has_transactions) {
                toast.error(
                    `Tidak bisa menambahkan cuti mingguan di hari ${dayName}, karena ada transaksi aktif.`
                );
                return;
            }

            // Jika aman, toggle cuti mingguan
            const response = await fetch("/leaves/toggle-weekly", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN":
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute("content") || "",
                },
                body: JSON.stringify({
                    item_id: item.id,
                    user_id: auth?.user?.id,
                    item_type: itemType,
                    day_of_week: dayName,
                }),
            });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const result = await response.json();

            if (existingWeeklyLeave) {
                setDisabledDays((prev) =>
                    prev.filter((day) => day !== dayName)
                );
                toast.success(`Hari cuti ${dayName} telah dihapus`);
            } else {
                setDisabledDays((prev) => [...prev, dayName]);
                toast.success(`Hari cuti ${dayName} telah ditambahkan`);
            }

            // Gunakan router.reload dengan preserveScroll
            router.reload({
                only: ["existingLeaves"],
                preserveScroll: true,
            });
        } catch (error) {
            console.error("Error mengubah hari cuti mingguan:", error);
            toast.error(
                "Gagal mengubah hari cuti mingguan. Silakan coba lagi."
            );
        } finally {
            setIsDataLoading(false);
        }
    };

    const existingDatesSet = new Set(
        existingLeaves.filter((leave) => leave.date).map((leave) => leave.date)
    );

    const handleDateToggle = async (dateStr) => {
        const isExisting = existingDatesSet.has(dateStr);

        if (!isExisting) {
            const hasTransactions = await checkTransactionsOnDate(dateStr);
            if (hasTransactions) {
                toast.error(
                    `Tidak dapat menambah cuti pada ${new Date(
                        dateStr + "T00:00:00"
                    ).toLocaleDateString(
                        "id-ID"
                    )} karena ada transaksi aktif pada hari tersebut`
                );
                return;
            }
        }

        if (isExisting) {
            setDeletingDates((prev) => {
                if (prev.includes(dateStr)) {
                    return prev.filter((d) => d !== dateStr);
                } else {
                    return [...prev, dateStr];
                }
            });
        } else {
            setSelectedDates((prev) => {
                if (prev.includes(dateStr)) {
                    return prev.filter((d) => d !== dateStr);
                } else {
                    return [...prev, dateStr];
                }
            });
        }
    };

    const handleBulkSelect = async (monthDates) => {
        setIsDataLoading(true);
        try {
            const currentSelected = [...selectedDates];
            const availableDates = monthDates
                .filter((date) => !existingDatesSet.has(date))
                .filter((date) => new Date(date + "T00:00:00") >= new Date());

            const datesWithTransactions = [];
            for (const date of availableDates) {
                const hasTransactions = await checkTransactionsOnDate(date);
                if (hasTransactions) {
                    datesWithTransactions.push(date);
                }
            }

            if (datesWithTransactions.length > 0) {
                const formattedDates = datesWithTransactions
                    .map((date) =>
                        new Date(date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                        })
                    )
                    .join(", ");
                toast.error(
                    `Beberapa tanggal tidak dapat dipilih karena ada transaksi: ${formattedDates}`
                );
            }

            const selectableDates = availableDates.filter(
                (date) => !datesWithTransactions.includes(date)
            );
            const allInMonth = selectableDates.every((date) =>
                currentSelected.includes(date)
            );

            if (allInMonth) {
                setSelectedDates((prev) =>
                    prev.filter((date) => !selectableDates.includes(date))
                );
            } else {
                const newDates = selectableDates.filter(
                    (date) => !currentSelected.includes(date)
                );
                setSelectedDates((prev) => [...prev, ...newDates]);
            }
        } finally {
            setIsDataLoading(false);
        }
    };

    const handleSave = async () => {
        if (selectedDates.length === 0 && deletingDates.length === 0) {
            toast.error("Tidak ada perubahan yang akan disimpan!");
            return;
        }

        setIsLoading(true);

        try {
            if (selectedDates.length > 0) {
                const addResponse = await fetch("/leaves/bulk", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN":
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute("content") || "",
                    },
                    body: JSON.stringify({
                        item_id: item.id,
                        user_id: auth?.user?.id,
                        item_type: itemType,
                        dates: selectedDates,
                    }),
                });

                const addResult = await addResponse.json();

                if (!addResponse.ok) {
                    throw new Error(addResult.message || "Failed to add dates");
                }
            }

            if (deletingDates.length > 0) {
                const deleteResponse = await fetch("/leaves/bulk", {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN":
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute("content") || "",
                    },
                    body: JSON.stringify({
                        item_id: item.id,
                        user_id: auth?.user?.id,
                        item_type: itemType,
                        dates: deletingDates,
                    }),
                });

                const deleteResult = await deleteResponse.json();

                if (!deleteResponse.ok) {
                    throw new Error(
                        deleteResult.message || "Failed to delete dates"
                    );
                }
            }

            toast.success(
                `Berhasil menyimpan perubahan! ${selectedDates.length} tanggal ditambahkan, ${deletingDates.length} tanggal dihapus.`
            );

            // Reset state sebelum reload
            setSelectedDates([]);
            setDeletingDates([]);

            // Reload dengan preserveScroll
            router.reload({
                only: ["existingLeaves"],
                preserveScroll: true,
            });
        } catch (error) {
            console.error("Error menyimpan perubahan:", error);
            toast.error("Gagal menyimpan perubahan. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setSelectedDates([]);
        setDeletingDates([]);
        router.visit("/dashboard/leaves");
    };

    const getModifiedSelectedDates = () => {
        return selectedDates.filter((date) => !deletingDates.includes(date));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />
            <div className="flex flex-1 flex-col mx-6 py-6 space-y-6">
                <div className="flex items-center justify-between p-4 sm:p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => router.visit("/dashboard/leaves")}
                            className="flex items-center gap-2 w-fit"
                            aria-label="Kembali ke halaman daftar hari cuti"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Kembali
                        </Button>
                        <div className="text-center md:text-left">
                            <h1 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2 justify-center md:justify-start">
                                <Calendar
                                    className="w-5 h-5 text-blue-500"
                                    aria-hidden="true"
                                />
                                <span>Pengaturan Hari Cuti</span>
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                Kelola hari cuti untuk{" "}
                                <span className="font-semibold">{title}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <Card className="p-6">
                    <HolidayCalendar
                        selectedDates={getModifiedSelectedDates()}
                        onDateToggle={handleDateToggle}
                        onBulkSelect={handleBulkSelect}
                        disabledDays={disabledDays}
                        onDayToggle={handleDayToggle}
                        existingLeaves={existingLeaves}
                        bookedDates={bookedDates}
                        isLoading={isDataLoading}
                    />
                </Card>

                {selectedDates.length > 0 && (
                    <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                        <p className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                            <div className="p-1 bg-green-100 rounded-full">
                                <Plus className="w-3 h-3 text-green-600" />
                            </div>
                            Tanggal yang akan ditambahkan (
                            {selectedDates.length} hari)
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {selectedDates.slice(0, 12).map((date) => (
                                <span
                                    key={date}
                                    className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full border border-green-200 font-medium"
                                >
                                    {new Date(
                                        date + "T00:00:00"
                                    ).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                    })}
                                </span>
                            ))}
                            {selectedDates.length > 12 && (
                                <span className="px-3 py-1 bg-green-200 text-green-800 text-sm rounded-full border border-green-300 font-semibold">
                                    +{selectedDates.length - 12} lainnya
                                </span>
                            )}
                        </div>
                    </Card>
                )}

                {deletingDates.length > 0 && (
                    <Card className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200">
                        <p className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
                            <div className="p-1 bg-red-100 rounded-full">
                                <Trash2 className="w-3 h-3 text-red-600" />
                            </div>
                            Tanggal yang akan dihapus ({deletingDates.length}{" "}
                            hari)
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {deletingDates.slice(0, 12).map((date) => (
                                <span
                                    key={date}
                                    className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full border border-red-200 font-medium"
                                >
                                    {new Date(
                                        date + "T00:00:00"
                                    ).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                    })}
                                </span>
                            ))}
                            {deletingDates.length > 12 && (
                                <span className="px-3 py-1 bg-red-200 text-red-800 text-sm rounded-full border border-red-300 font-semibold">
                                    +{deletingDates.length - 12} lainnya
                                </span>
                            )}
                        </div>
                    </Card>
                )}

                <Card className="p-4">
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isLoading || isDataLoading}
                            className="border-gray-300 hover:bg-gray-50 text-gray-700 bg-transparent"
                            type="button"
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={
                                isLoading ||
                                isDataLoading ||
                                (selectedDates.length === 0 &&
                                    deletingDates.length === 0)
                            }
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors duration-200"
                            type="button"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Menyimpan...
                                </div>
                            ) : (
                                `Simpan Perubahan (${selectedDates.length} tambah, ${deletingDates.length} hapus)`
                            )}
                        </Button>
                    </div>
                </Card>

                <Card className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Panduan Penggunaan
                    </h4>
                    <div className="text-sm text-blue-700 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <p>
                                    • <strong>Tanggal putih:</strong> Klik untuk
                                    menambah hari cuti baru
                                </p>
                                <p>
                                    • <strong>Tanggal orange:</strong> Klik
                                    untuk menghapus hari cuti yang sudah ada
                                </p>
                                <p>
                                    • <strong>Tanggal abu-abu:</strong> Tanggal
                                    yang sudah lewat (tidak dapat dipilih)
                                </p>
                            </div>
                            <div>
                                <p>
                                    • <strong>Checkbox hari:</strong> Untuk
                                    mengatur hari cuti mingguan
                                </p>
                                <p>
                                    • <strong>Tombol bulan:</strong>{" "}
                                    Pilih/batalkan semua tanggal dalam bulan
                                </p>
                                <p>
                                    • <strong>Tanggal hijau:</strong> Tanggal
                                    yang sudah dipilih untuk cuti
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                            <p className="text-blue-800 font-medium">
                                💡 <strong>Tips:</strong> Gunakan checkbox di
                                bawah nama hari untuk membuat hari cuti mingguan
                                yang berulang setiap minggu. Untuk hari cuti
                                khusus, klik langsung pada tanggal di kalender.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
