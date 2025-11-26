import { useState, useEffect, useRef } from 'react';

/**
 * LazyImage component for lazy loading images
 * Improves performance by loading images only when they're in viewport
 */
export default function LazyImage({ 
    src, 
    alt, 
    className = '', 
    placeholder = '/placeholder.svg',
    threshold = 0.1,
    ...props 
}) {
    const [imageSrc, setImageSrc] = useState(placeholder);
    const [isLoaded, setIsLoaded] = useState(false);
    const imgRef = useRef(null);

    useEffect(() => {
        // Check if IntersectionObserver is supported
        if (!('IntersectionObserver' in window)) {
            // Fallback: load image immediately
            setImageSrc(src);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setImageSrc(src);
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold,
                rootMargin: '50px', // Start loading 50px before entering viewport
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => {
            if (imgRef.current) {
                observer.unobserve(imgRef.current);
            }
        };
    }, [src, threshold]);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    return (
        <img
            ref={imgRef}
            src={imageSrc}
            alt={alt}
            className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
            onLoad={handleLoad}
            loading="lazy"
            decoding="async"
            {...props}
        />
    );
}
