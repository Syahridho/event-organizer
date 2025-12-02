import { Button } from "@/components/ui/button.jsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";
import { useSelector, useDispatch } from "react-redux";

import { Monitor, Moon, Sun } from "lucide-react";
import { setTheme } from "@/Store/themeSlice";

export default function AppearanceToggleDropdown({ className = "", ...props }) {
    const appearance = useSelector((state) => state.theme.mode);
    const dispatch = useDispatch();

    const handleSetTheme = (mode) => {
        dispatch(setTheme(mode));
    };

    const getCurrentIcon = () => {
        switch (appearance) {
            case "dark":
                return <Moon className="h-5 w-5" />;
            case "light":
                return <Sun className="h-5 w-5" />;
            default:
                return <Monitor className="h-5 w-5" />;
        }
    };

    return (
        <div className={className} {...props}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-md"
                    >
                        {getCurrentIcon()}
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleSetTheme("light")}>
                        <span className="flex items-center gap-2">
                            <Sun className="h-5 w-5" />
                            Light
                        </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSetTheme("dark")}>
                        <span className="flex items-center gap-2">
                            <Moon className="h-5 w-5" />
                            Dark
                        </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSetTheme("system")}>
                        <span className="flex items-center gap-2">
                            <Monitor className="h-5 w-5" />
                            System
                        </span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
