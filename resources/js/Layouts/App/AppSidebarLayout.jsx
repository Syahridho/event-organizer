import { usePage } from "@inertiajs/react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
    LayoutDashboardIcon,
    ListIcon,
    Trophy,
    Users,
    CalendarCog,
    Building,
    Fan,
    Settings,
} from "lucide-react";
import { FaMoneyBillTransfer } from "react-icons/fa6";
import { IoMdNotificationsOutline } from "react-icons/io";
import { TbUserUp } from "react-icons/tb";
import { Boxes } from "lucide-react";
import { PiMoneyWavyLight } from "react-icons/pi";
import { TiMessages } from "react-icons/ti";

const admin = [
    {
        title: "Dashboard Admin",
        url: "/admin/dashboard",
        icon: LayoutDashboardIcon,
        exact: true,
    },
    {
        title: "Transaksi",
        url: "/admin/transactions",
        icon: PiMoneyWavyLight,
    },
    {
        title: "Pesan",
        icon: TiMessages,
        url: "/admin/dashboard/chat",
    },
    {
        title: "Organizer",
        icon: Trophy,
        items: [
            {
                title: "Events",
                url: "/admin/dashboard/events",
            },
            {
                title: "Jasa",
                url: "/admin/dashboard/services",
            },
            {
                title: "Gedung",
                url: "/admin/dashboard/buildings",
            },
            {
                title: "Sewa Property",
                url: "/admin/dashboard/rents",
            },
        ],
    },
    {
        title: "Pengajuan jadi Mitra",
        url: "/admin/mitra",
        icon: TbUserUp,
    },
    {
        title: "Management User",
        url: "/admin/user",
        icon: Users,
    },
    {
        title: "Penarikan Mitra",
        url: "/admin/withdraw",
        icon: FaMoneyBillTransfer,
    },
    {
        title: "Kustom Testimoni",
        url: "/admin/testimonials",
        icon: Boxes,
    },
    {
        title: "Pengaturan",
        url: "/admin/settings",
        icon: Settings,
    },
];

const mitra = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboardIcon,
        exact: true,
    },
    {
        title: "Transaksi",
        icon: PiMoneyWavyLight,
        url: "/dashboard/transactions",
    },
    {
        title: "Organizer",
        icon: Trophy,
        items: [
            {
                title: "Events",
                url: "/dashboard/events",
            },
            {
                title: "Jasa",
                url: "/dashboard/services",
            },
            {
                title: "Gedung",
                url: "/dashboard/buildings",
            },
            {
                title: "Sewa Property",
                url: "/dashboard/rents",
            },
        ],
    },
    {
        title: "Cuti",
        icon: CalendarCog,
        url: "/dashboard/leaves",
    },
    {
        title: "Notifikasi",
        icon: IoMdNotificationsOutline,
        url: "/dashboard/notifications",
    },
    {
        title: "Pesan",
        icon: TiMessages,
        url: "/dashboard/chat",
    },
    {
        title: "Penarikan Uang",
        url: "/dashboard/withdraw",
        icon: FaMoneyBillTransfer,
    },
];

const member = [
    {
        title: "Dashboard",
        url: "#",
        icon: LayoutDashboardIcon,
    },
    {
        title: "Lifecycle",
        url: "#",
        icon: ListIcon,
    },
];

export default function AppLayout({ children, breadcrumbs = [] }) {
    const { auth } = usePage().props;

    return (
        <SidebarProvider>
            <AppSidebar
                items={
                    auth.user.role == "admin"
                        ? admin
                        : auth.user.role == "member"
                        ? member
                        : mitra
                }
            />
            <SidebarInset>
                <SiteHeader breadcrumbs={breadcrumbs} />
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
}
