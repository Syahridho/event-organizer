import { Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button.jsx";
import {
    IoTicket,
    FaBuilding,
    GiMicrophone,
    GrFanOption,
} from "@/components/Icon.jsx";

const mobileMenuItems = [
    {
        label: "Tiket",
        href: "#tickets",
        icon: IoTicket,
        description: "Event & Konser",
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        hoverBg: "hover:bg-blue-500/20",
    },
    {
        label: "Jasa",
        href: "#services",
        icon: GiMicrophone,
        description: "Vendor Profesional",
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
        hoverBg: "hover:bg-purple-500/20",
    },
    {
        label: "Gedung",
        href: "#buildings",
        icon: FaBuilding,
        description: "Venue & Tempat",
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
        hoverBg: "hover:bg-orange-500/20",
    },
    {
        label: "Property",
        href: "#property",
        icon: GrFanOption,
        description: "Perlengkapan Acara",
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        hoverBg: "hover:bg-green-500/20",
    },
];

const MobileMenu = () => {
    return (
        <div className="grid grid-cols-1 gap-3 mt-6">
            {mobileMenuItems.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                    <Button
                        key={idx}
                        variant="ghost"
                        className={`justify-start h-auto p-4 group transition-all duration-200 border border-transparent hover:border-border ${item.hoverBg}`}
                        asChild
                    >
                        <Link
                            href={item.href}
                            className="flex items-center w-full"
                        >
                            <div
                                className={`p-3 rounded-xl mr-4 ${item.bgColor} ${item.color} group-hover:scale-110 transition-transform duration-300`}
                            >
                                <IconComponent className="w-6 h-6" />
                            </div>
                            <div className="text-left flex-1">
                                <div className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                                    {item.label}
                                </div>
                                <div className="text-xs text-muted-foreground font-medium">
                                    {item.description}
                                </div>
                            </div>
                        </Link>
                    </Button>
                );
            })}
        </div>
    );
};

export default MobileMenu;
