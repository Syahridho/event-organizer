/**
 * Icon Wrapper Component
 * Lazy loads react-icons to reduce initial bundle size
 *
 * Usage:
 * import Icon from '@/components/IconWrapper.jsx';
 * <Icon name="IoCart" library="io5" className="w-5 h-5" />
 */

import React from "react";

// Import icons by library - these will be code-split
const iconLibraries = {
    io5: () => import("react-icons/io5"),
    io: () => import("react-icons/io"),
    fa: () => import("react-icons/fa"),
    fa6: () => import("react-icons/fa6"),
    gi: () => import("react-icons/gi"),
    gr: () => import("react-icons/gr"),
    md: () => import("react-icons/md"),
    hi: () => import("react-icons/hi"),
    tb: () => import("react-icons/tb"),
    pi: () => import("react-icons/pi"),
    ti: () => import("react-icons/ti"),
};

const IconWrapper = ({ name, library = "io5", className = "", ...props }) => {
    const [IconComponent, setIconComponent] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const loadIcon = async () => {
            try {
                const iconLibrary = await iconLibraries[library]();
                const Icon = iconLibrary[name];

                if (Icon) {
                    setIconComponent(() => Icon);
                } else {
                    console.warn(
                        `Icon "${name}" not found in library "${library}"`
                    );
                }
            } catch (error) {
                console.error(
                    `Failed to load icon library "${library}":`,
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        loadIcon();
    }, [name, library]);

    if (loading) {
        // Skeleton loader while icon loads
        return (
            <div
                className={`${className} animate-pulse bg-gray-200 rounded`}
                {...props}
            />
        );
    }

    if (!IconComponent) {
        return null;
    }

    return <IconComponent className={className} {...props} />;
};

export default IconWrapper;
