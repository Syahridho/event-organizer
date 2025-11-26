import { lazy, Suspense } from 'react';

/**
 * LazyComponent wrapper for code splitting
 * Use this to lazy load heavy components
 */
export function lazyLoadComponent(importFunc, fallback = null) {
    const LazyComponent = lazy(importFunc);
    
    return function LazyWrapper(props) {
        return (
            <Suspense fallback={fallback || <ComponentLoader />}>
                <LazyComponent {...props} />
            </Suspense>
        );
    };
}

/**
 * Default loading component
 */
function ComponentLoader() {
    return (
        <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );
}

/**
 * Lazy load Leaflet Map component
 */
export const LazyMap = lazyLoadComponent(
    () => import('../components/Map'),
    <div className="w-full h-64 bg-gray-200 animate-pulse rounded-lg"></div>
);

/**
 * Lazy load Quill Editor component
 */
export const LazyEditor = lazyLoadComponent(
    () => import('../components/Editor'),
    <div className="w-full h-32 bg-gray-200 animate-pulse rounded-lg"></div>
);

/**
 * Lazy load Charts
 */
export const LazyChart = lazyLoadComponent(
    () => import('../components/Chart'),
    <div className="w-full h-64 bg-gray-200 animate-pulse rounded-lg"></div>
);

export default lazyLoadComponent;
