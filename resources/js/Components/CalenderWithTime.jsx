"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Label } from "@/components/ui/label.jsx";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover.jsx";
import { Calendar } from "./ui/calendar";
import { combineDateAndTimeToSQL } from "@/Utils/formatDateTime.jsx";

export default function CalendarWithTime({
    className,
    dateTime,
    setDateTime,
    disableDateLeft,
    disableDateRight,
}) {
    const [open, setOpen] = React.useState(false);

    const [date, setDate] = React.useState(
        dateTime ? new Date(dateTime) : null
    );

    const [selectedTime, setSelectedTime] = React.useState("00:00");

    const timeSlots = Array.from({ length: 96 }, (_, i) => {
        const totalMinutes = i * 15;
        const hour = Math.floor(totalMinutes / 60);
        const minute = totalMinutes % 60;
        return `${hour.toString().padStart(2, "0")}:${minute
            .toString()
            .padStart(2, "0")}`;
    });

    React.useEffect(() => {
        if (date && selectedTime) {
            const result = combineDateAndTimeToSQL(date, selectedTime);
            setDateTime(result);
        }
    }, [date, selectedTime]);

    React.useEffect(() => {
        if (dateTime && !date && !selectedTime) {
            const dt = new Date(dateTime);
            const jam = dt.getHours().toString().padStart(2, "0");
            const menit = dt.getMinutes().toString().padStart(2, "0");
            const timeString = `${jam}:${menit}`;

            setDate(dt);
            setSelectedTime(timeString);
        }
    }, [dateTime]);

    return (
        <div className={className}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id="date"
                        className="w-full justify-between font-normal"
                    >
                        {date
                            ? `${date.getDate()} ${date.toLocaleString(
                                  "id-ID",
                                  {
                                      month: "long",
                                  }
                              )} ${date.getFullYear()} - ${selectedTime}`
                            : "Pilih Tanggal dan Jam"}
                        <ChevronDownIcon />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="relative z-[99999] w-auto overflow-hidden p-0"
                    align="start"
                >
                    <Card className="gap-0 p-0 rounded-none z-[99999] relative">
                        <CardContent className="relative p-0 md:pr-48 ">
                            <div className="p-1">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    defaultMonth={date}
                                    showOutsideDays={false}
                                    formatters={{
                                        formatWeekdayName: (date) => {
                                            return date.toLocaleString(
                                                "en-US",
                                                { weekday: "short" }
                                            );
                                        },
                                    }}
                                    disabled={(date) => {
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);

                                        const min = disableDateLeft
                                            ? new Date(disableDateLeft)
                                            : today;
                                        const max = disableDateRight
                                            ? new Date(disableDateRight)
                                            : null;

                                        min.setHours(0, 0, 0, 0);
                                        max?.setHours(23, 59, 59, 999);

                                        return (
                                            date < min || (max && date > max)
                                        );
                                    }}
                                />
                            </div>
                            <div className="no-scrollbar inset-y-0 right-0 flex max-h-72 w-full scroll-pb-6 flex-col gap-4 overflow-y-auto border-t p-6 md:absolute md:max-h-none md:w-48 md:border-t-0 md:border-l">
                                <div className="grid gap-2">
                                    {timeSlots.map((time) => (
                                        <Button
                                            key={time}
                                            variant={
                                                selectedTime === time
                                                    ? "default"
                                                    : "outline"
                                            }
                                            onClick={() =>
                                                setSelectedTime(time)
                                            }
                                            className="w-full shadow-none"
                                        >
                                            {time}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </PopoverContent>
            </Popover>
        </div>
    );
}
