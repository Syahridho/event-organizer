import React from "react";
import { Head, Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button.jsx";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card.jsx";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { FileText, Download, Users } from "lucide-react";
import { usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/App/AppSidebarLayout";

const breadcrumbs = [
    {
        title: "Dashboard Admin",
        href: "/admin/dashboard",
    },
    {
        title: "Events",
        href: "/admin/dashboard/events",
    },
    {
        title: "Peserta",
        href: "#",
    },
];

export default function Attendance({ event, attendees }) {
    const { ziggy } = usePage().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Attendance - ${event.name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Nama Event: {event.name}
                                    </CardTitle>
                                    <CardDescription>
                                        Total Peserta: {attendees.length}
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button asChild variant="outline">
                                        <a
                                            href={route(
                                                "dashboard.events.attendance.pdf",
                                                event.id
                                            )}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <FileText className="mr-2 h-4 w-4" />
                                            Export PDF
                                        </a>
                                    </Button>
                                    <Button asChild variant="outline">
                                        <a
                                            href={route(
                                                "dashboard.events.attendance.excel",
                                                event.id
                                            )}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Download className="mr-2 h-4 w-4" />
                                            Export Excel
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {attendees.length > 0 ? (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>#</TableHead>
                                                <TableHead>Nama</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>
                                                    Jumlah Tiket
                                                </TableHead>
                                                <TableHead>
                                                    Tiket Detail
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {attendees.map(
                                                (attendee, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            {index + 1}
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {attendee.user_name}
                                                        </TableCell>
                                                        <TableCell>
                                                            {
                                                                attendee.user_email
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary">
                                                                {
                                                                    attendee.tickets_purchased
                                                                }
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {
                                                                attendee.ticket_details
                                                            }
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
                                        Tidak ada peserta
                                    </h3>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
