import React, { useState } from "react";

const CustomCalendar = ({
    selected,
    onSelect,
    disabled,
    bookedDatesWithUser = [],
    disabledLeaves = [],
    currentUserId,
}) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const monthNames = [
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

    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const isSameDay = (date1, date2) => {
        return (
            date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
        );
    };

    const prevMonth = () => {
        setCurrentMonth(
            new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
        );
    };

    const nextMonth = () => {
        setCurrentMonth(
            new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
        );
    };

    const getDateBookingStatus = (date, bookedDatesWithUser) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;

        const booking = bookedDatesWithUser.find(
            (item) => item.date === dateStr
        );

        if (!booking) {
            return { isBooked: false, isCurrentUser: false };
        }

        return {
            isBooked: true,
            isCurrentUser: booking.isCurrentUser,
        };
    };

    // ✅ FIX: Cek apakah tanggal kena cuti
    const isLeave = (date, disabledLeaves) => {
        const dayNameMap = [
            "Minggu",
            "Senin",
            "Selasa",
            "Rabu",
            "Kamis",
            "Jumat",
            "Sabtu",
        ];

        // ✅ GUNAKAN FORMAT LOKAL, BUKAN UTC
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;

        const weekday = dayNameMap[date.getDay()];

        return disabledLeaves.some((leave) => {
            if (leave.type === "once" && leave.date === dateStr) return true;
            if (leave.type === "weekly" && leave.day_of_week === weekday)
                return true;
            return false;
        });
    };

    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days loop
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            day
        );

        const bookingStatus = getDateBookingStatus(date, bookedDatesWithUser);
        const leaveStatus = isLeave(date, disabledLeaves);

        const isDisabled =
            disabled(date) || bookingStatus.isBooked || leaveStatus;

        const isSelected = selected && isSameDay(date, selected);

        let dayClasses = "p-2 text-sm relative transition-colors rounded-md ";

        if (isDisabled) {
            dayClasses += "cursor-not-allowed ";
        } else {
            dayClasses +=
                "cursor-pointer hover:bg-primary/80 hover:text-white ";
        }

        if (isSelected) {
            dayClasses += "bg-primary text-white hover:bg-primary";
        } else if (bookingStatus.isBooked) {
            if (bookingStatus.isCurrentUser) {
                dayClasses +=
                    "bg-green-100 text-green-700 border-2 border-green-300 cursor-not-allowed ";
            } else {
                dayClasses +=
                    "bg-red-100 text-red-500 line-through cursor-not-allowed ";
            }
        } else if (leaveStatus) {
            dayClasses += "bg-yellow-100 text-yellow-700 cursor-not-allowed ";
        } else if (!isDisabled) {
            dayClasses += "text-gray-900 ";
        } else {
            dayClasses += "text-gray-300 ";
        }

        let tooltipText = "";
        if (bookingStatus.isBooked) {
            tooltipText = bookingStatus.isCurrentUser
                ? "Anda sudah booking tanggal ini"
                : "Sudah dibooking oleh user lain";
        } else if (leaveStatus) {
            tooltipText = "Tanggal cuti mitra";
        }

        days.push(
            <button
                key={day}
                onClick={() => !isDisabled && onSelect(date)}
                disabled={isDisabled}
                className={dayClasses}
                title={tooltipText}
            >
                {day}
                {bookingStatus.isBooked && (
                    <div
                        className={`absolute top-1 left-1 w-2 h-2 rounded-full ${
                            bookingStatus.isCurrentUser
                                ? "bg-green-500"
                                : "bg-red-500"
                        }`}
                    ></div>
                )}
                {leaveStatus && (
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-500"></div>
                )}
            </button>
        );
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={prevMonth}
                    className="p-1 hover:bg-gray-100 rounded"
                >
                    ←
                </button>
                <h3 className="font-medium">
                    {monthNames[currentMonth.getMonth()]}{" "}
                    {currentMonth.getFullYear()}
                </h3>
                <button
                    onClick={nextMonth}
                    className="p-1 hover:bg-gray-100 rounded"
                >
                    →
                </button>
            </div>

            <div className="grid grid-cols-7 mb-2">
                {dayNames.map((day) => (
                    <div
                        key={day}
                        className="p-2 text-xs text-gray-500 text-center font-medium"
                    >
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">{days}</div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-100 border-2 border-green-300 rounded"></div>
                    <span>Booking Anda</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                    <span>Sudah dibooking orang lain</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                    <span>Cuti Mitra</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-primary rounded"></div>
                    <span>Dipilih</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-200 rounded"></div>
                    <span>Tidak tersedia</span>
                </div>
            </div>
        </div>
    );
};

export default CustomCalendar;
