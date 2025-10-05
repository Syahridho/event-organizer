"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const HolidayCalendar = ({
    selectedDates = [],
    onDateToggle,
    onBulkSelect,
    bookedDates = [],
    disabledDays = [],
    onDayToggle,
    existingLeaves = [],
    isLoading = false,
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysOfWeek = [
        "Minggu",
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
        "Sabtu",
    ];

    const months = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
    ];

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const formatDateString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const isDateSelected = (date) => {
        const dateStr = formatDateString(date);
        return selectedDates.includes(dateStr);
    };

    const isDateBooked = (date) => {
        const dateStr = formatDateString(date);
        return bookedDates?.includes(dateStr);
    };

    const isDateExisting = (date) => {
        const dateStr = formatDateString(date);
        return existingLeaves.some((leave) => leave.date === dateStr);
    };

    const isPastDate = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    const navigateMonth = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + direction);
        setCurrentDate(newDate);
    };

    const getMonthDates = () => {
        const days = getDaysInMonth(currentDate);
        return days
            .filter((day) => day !== null)
            .map((day) => formatDateString(day));
    };

    const handleBulkSelectMonth = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const monthDates = getMonthDates().filter((dateStr) => {
            const dateObj = new Date(dateStr + "T00:00:00");
            return dateObj >= today;
        });

        onBulkSelect(monthDates);
    };

    const handleDateClick = (dateStr) => {
        console.log("[v0] Date clicked in calendar:", dateStr);
        if (onDateToggle) {
            onDateToggle(dateStr);
        }
    };

    const days = getDaysInMonth(currentDate);

    return (
        <div className="space-y-6">
            {/* Calendar Header */}
            <div className="flex items-center md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
                {/* Tombol Sebelumnya */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth(-1)}
                    className="flex items-center gap-2 justify-center w-full md:w-auto"
                    disabled={isLoading}
                    type="button"
                >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden md:inline">Sebelumnya</span>
                </Button>

                {/* Bulan + Tahun + Bulk Select */}
                <div className="flex flex-col md:flex-row items-center gap-2">
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-center">
                        {months[currentDate.getMonth()]}{" "}
                        {currentDate.getFullYear()}
                    </h3>
                </div>

                {/* Tombol Selanjutnya */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth(1)}
                    className="flex items-center gap-2 justify-center w-full md:w-auto"
                    disabled={isLoading}
                    type="button"
                >
                    <span className="hidden md:inline">Selanjutnya</span>
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>

            <div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkSelectMonth}
                    className="text-sm bg-transparent w-full md:w-auto"
                    disabled={isLoading}
                    type="button"
                >
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Memproses...
                        </div>
                    ) : (
                        "Pilih Semua Bulan"
                    )}
                </Button>
            </div>

            {/* Weekly Holidays Toggle */}
            <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <h4 className="font-medium mb-3 text-sm sm:text-base">
                    Hari Cuti Mingguan
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
                    {daysOfWeek.map((day, index) => (
                        <div key={day} className="flex items-center gap-2">
                            <Checkbox
                                id={`day-${index}`}
                                checked={disabledDays.includes(day)}
                                onCheckedChange={() =>
                                    onDayToggle && onDayToggle(day)
                                }
                                disabled={isLoading}
                            />
                            <label
                                htmlFor={`day-${index}`}
                                className="text-xs sm:text-sm font-medium cursor-pointer"
                            >
                                {day}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white border rounded-lg overflow-hidden">
                {/* Day Headers */}
                <div className="grid grid-cols-7 text-[10px] sm:text-sm bg-gray-50">
                    {daysOfWeek.map((day) => (
                        <div
                            key={day}
                            className="p-1 sm:p-3 text-center font-medium text-gray-700 border-r last:border-r-0"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7">
                    {days.map((day, index) => {
                        if (!day) {
                            return (
                                <div
                                    key={index}
                                    className="h-8 sm:h-12 border-r border-b last:border-r-0"
                                />
                            );
                        }

                        const dateStr = formatDateString(day);
                        const isSelected = isDateSelected(day);
                        const isExisting = isDateExisting(day);
                        const isPast = isPastDate(day);
                        const dayName = daysOfWeek[day.getDay()];
                        const isWeeklyDisabled = disabledDays.includes(dayName);
                        const isBooked = isDateBooked(day);

                        let cellClass =
                            "h-8 sm:h-12 border-r border-b last:border-r-0 flex items-center justify-center text-xs sm:text-sm cursor-pointer transition-colors ";

                        if (isLoading) {
                            cellClass += "opacity-50 cursor-not-allowed ";
                        } else if (isPast) {
                            cellClass +=
                                "bg-gray-100 text-gray-400 cursor-not-allowed ";
                        } else if (isBooked) {
                            cellClass +=
                                "bg-red-200 text-red-800 font-bold cursor-not-allowed ";
                        } else if (isWeeklyDisabled) {
                            cellClass += "bg-red-100 text-red-600 ";
                        } else if (isSelected) {
                            cellClass +=
                                "bg-green-200 text-green-800 font-medium ";
                        } else if (isExisting) {
                            cellClass +=
                                "bg-orange-200 text-orange-800 font-medium ";
                        } else {
                            cellClass += "hover:bg-blue-50 ";
                        }

                        return (
                            <div
                                key={dateStr}
                                className={cellClass}
                                onClick={() => {
                                    if (
                                        !isPast &&
                                        !isWeeklyDisabled &&
                                        !isLoading
                                    ) {
                                        handleDateClick(dateStr);
                                    }
                                }}
                            >
                                {day.getDate()}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default HolidayCalendar;
