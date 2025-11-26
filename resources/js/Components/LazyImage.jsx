import { useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const LazyImage = ({ src, alt, className, onLoad, onError, ...props }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    const handleLoad = useCallback(() => {
        setLoaded(true);
        onLoad?.();
    }, [onLoad]);

    const handleError = useCallback(() => {
        setError(true);
        setLoaded(true);
        onError?.();
    }, [onError]);

    return (
        <div className="relative overflow-hidden rounded-lg w-full h-full">
            {!loaded && <Skeleton className={`absolute inset-0 w-full h-full ${className}`} />}
            <img
                src={src}
                alt={alt}
                className={`${className} transition-all duration-500 ${
                    loaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
                }`}
                onLoad={handleLoad}
                onError={handleError}
                loading="lazy"
                {...props}
            />
        </div>
    );
};

export default LazyImage;
