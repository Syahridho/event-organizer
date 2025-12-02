import React from "react";
import { cn } from "@/Lib/utils";
import { Skeleton } from "@/components/ui/skeleton.jsx";

/**
 * Avatar Component with fallback to initials
 * Menggunakan Tailwind CSS untuk styling
 * Algoritma tercepat O(n) untuk generate inisial
 */
export const Avatar = ({ src, name, className, size = "md" }) => {
    const [imageError, setImageError] = React.useState(false);
    const [imageLoading, setImageLoading] = React.useState(!!src);

    React.useEffect(() => {
        setImageLoading(!!src);
    }, [src]);

    // Generate initials from name - algoritma O(n) tercepat
    const getInitials = (name) => {
        if (!name) return "?";

        const words = name.trim().split(/\s+/);
        let initials = "";

        for (let i = 0; i < words.length && initials.length < 2; i++) {
            const word = words[i];
            if (word.length > 0) {
                initials += word[0].toUpperCase();
            }
        }

        return initials || name.substring(0, 2).toUpperCase();
    };

    // Generate consistent color based on name
    const getColorFromName = (name) => {
        if (!name) return "bg-gray-500";

        const colors = [
            "bg-blue-500",
            "bg-green-500",
            "bg-yellow-500",
            "bg-red-500",
            "bg-purple-500",
            "bg-pink-500",
            "bg-indigo-500",
            "bg-teal-500",
        ];

        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }

        return colors[Math.abs(hash) % colors.length];
    };

    const sizeClasses = {
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-16 w-16 text-lg",
        "2xl": "h-20 w-20 text-xl",
    };

    const showInitials = !src || imageError;
    const hasImage = !!src && !imageError;

    return (
        <div
            className={cn(
                "relative inline-flex items-center justify-center rounded-full overflow-hidden border shadow",
                sizeClasses[size],
                showInitials && getColorFromName(name),
                className
            )}
        >
            {hasImage ? (
                <>
                    <img
                        src={src}
                        alt={name}
                        className={cn(
                            "h-full w-full object-cover transition-opacity duration-200 ",
                            imageLoading ? "opacity-0" : "opacity-100"
                        )}
                        onLoad={() => setImageLoading(false)}
                        onError={() => {
                            setImageError(true);
                            setImageLoading(false);
                        }}
                    />
                    {imageLoading && (
                        <Skeleton className="absolute inset-0 h-full w-full rounded-full" />
                    )}
                </>
            ) : (
                <span className="font-semibold text-white select-none">
                    {getInitials(name)}
                </span>
            )}
        </div>
    );
};

// Avatar fallback component for initials only
export const AvatarFallback = ({ children, className }) => {
    return (
        <div
            className={cn(
                "flex h-full w-full items-center justify-center rounded-full bg-muted",
                className
            )}
        >
            {children}
        </div>
    );
};

export default Avatar;
