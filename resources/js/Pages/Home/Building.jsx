// React imports
import React, { useEffect, useRef, useState, useCallback } from "react";

// Inertia imports
import { Head, Link, usePage } from "@inertiajs/react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

// Icons
import {
    CircleUserRound,
    MessageSquareMore,
    ShoppingBag,
    Tickets,
    MicVocal,
    Package,
    Building,
    DollarSign,
    MapPin,
} from "lucide-react";

// Utils & Layouts
import { formatTanggalIndo, getJamMenit } from "@/Utils/formatDateTime";
import MainLayout from "@/Layouts/Main";

// Skeleton Loading Component
const ItemSkeleton = () => (
    <div className="p-4 border rounded animate-pulse">
        <div className="aspect-video bg-gray-200 rounded mb-3"></div>
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="space-y-1">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
        </div>
    </div>
);

const LazyImage = ({ src, alt, className }) => {
    const [loaded, setLoaded] = useState(false);
    const [inView, setInView] = useState(false);
    const imgRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "50px" }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => {
            if (observer && observer.disconnect) {
                observer.disconnect();
            }
        };
    }, []);

    return (
        <div ref={imgRef} className={`${className} relative bg-gray-200`}>
            {inView && (
                <>
                    {!loaded && (
                        <div className="absolute inset-0 w-full h-full bg-gray-200 animate-pulse rounded"></div>
                    )}
                    <img
                        src={src}
                        alt={alt}
                        className={`w-full h-full object-cover rounded transition-opacity duration-500 ${
                            loaded ? "opacity-100" : "opacity-0"
                        }`}
                        onLoad={() => setLoaded(true)}
                    />
                </>
            )}
        </div>
    );
};

export default function HomeBuilding() {
    const { props } = usePage();
    const { ziggy } = props;

    // Buat base URL dari ziggy
    // const baseUrl = `${ziggy.url}${ziggy.port ? `:${ziggy.port}` : ""}`;
    const baseUrl = ziggy.url;

    const initialItems = props.items?.data ?? [];
    const initialNext = props.items?.next_page_url ?? null;

    const [items, setItems] = useState(initialItems);
    const [nextPageUrl, setNextPageUrl] = useState(initialNext);
    const [loading, setLoading] = useState(false);
    const [ended, setEnded] = useState(!initialNext);
    const [initialLoad, setInitialLoad] = useState(true);

    const sentinelRef = useRef(null);
    const isFetchingRef = useRef(false);

    const fetchNext = useCallback(async () => {
        if (!nextPageUrl || isFetchingRef.current) return;

        isFetchingRef.current = true;
        setLoading(true);

        try {
            const res = await fetch(nextPageUrl, {
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    Accept: "application/json",
                },
            });

            if (!res.ok) throw new Error("Network response was not ok");
            const json = await res.json();

            setItems((prev) => [...prev, ...json.data]);
            setNextPageUrl(json.next_page_url);
            if (!json.next_page_url) setEnded(true);
        } catch (err) {
            console.error("Fetch next page failed:", err);
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, [nextPageUrl]);

    useEffect(() => {
        // Simulasi initial loading
        const timer = setTimeout(() => {
            setInitialLoad(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!sentinelRef.current || initialLoad) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && nextPageUrl && !loading) {
                        fetchNext();
                    }
                });
            },
            { root: null, rootMargin: "100px", threshold: 0.1 }
        );

        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [fetchNext, nextPageUrl, loading, initialLoad]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat("id-ID").format(price);
    };

    const getImageUrl = (thumbnail) => {
        if (!thumbnail) return `${baseUrl}/storage/randoms/3.webp`;
        return thumbnail.startsWith("http")
            ? thumbnail
            : `${baseUrl}/storage/thumbnails/${thumbnail}`;
    };

    const truncateDescription = (desc) => {
        if (!desc) return "";
        const text = desc.replace(/<\/?[^>]+(>|$)/g, "");
        return text.length > 120 ? text.slice(0, 120) + "..." : text;
    };

    return (
        <>
            <Head title="Ticket" />
            <div className="min-h-screen mx-auto xl:max-w-[950px] p-4">
                <div>
                    <h1 className="text-2xl font-semibold mb-6">
                        Daftar Gedung
                    </h1>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {initialLoad
                            ? // Show skeleton loading for initial load
                              Array.from({ length: 12 }, (_, i) => (
                                  <ItemSkeleton key={`skeleton-${i}`} />
                              ))
                            : items.map((item) => (
                                  <Link
                                      key={item.id}
                                      href={`/buildings/${item.id}`}
                                  >
                                      <div className="border rounded hover:shadow-lg transition-all duration-300 overflow-hidden group">
                                          <LazyImage
                                              src={getImageUrl(item.thumbnail)}
                                              alt={item.name}
                                              className="aspect-video w-full overflow-hidden"
                                          />
                                          <div className="p-4 space-y-0.5">
                                              <h3 className="font-semibold text-sm leading-tight group-hover:text-blue-600 transition-colors">
                                                  {item.name}
                                              </h3>

                                              <div className="space-y-2">
                                                  {item.price && (
                                                      <div className="flex items-center gap-2 text-green-600">
                                                          <span className="font-semibold text-xs">
                                                              Rp{" "}
                                                              {formatPrice(
                                                                  item.price
                                                              )}
                                                          </span>
                                                      </div>
                                                  )}

                                                  {item.location && (
                                                      <div className="flex items-center gap-2 text-gray-600">
                                                          <MapPin className="h-4 w-4" />
                                                          <span className="text-sm">
                                                              {item.location}
                                                          </span>
                                                      </div>
                                                  )}
                                              </div>
                                          </div>
                                      </div>
                                  </Link>
                              ))}

                        {/* Loading skeletons for pagination */}
                        {loading &&
                            Array.from({ length: 6 }, (_, i) => (
                                <ItemSkeleton key={`loading-${i}`} />
                            ))}
                    </div>

                    {/* Sentinel untuk infinite scroll */}
                    <div
                        ref={sentinelRef}
                        className="h-20 mt-6 flex items-center justify-center"
                    >
                        {!initialLoad &&
                            (loading ? (
                                <div className="flex items-center space-x-2">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    <span className="text-sm">
                                        Memuat lebih banyak...
                                    </span>
                                </div>
                            ) : ended ? (
                                <div className="text-sm text-muted-foreground">
                                    Semua item telah dimuat
                                </div>
                            ) : (
                                nextPageUrl && (
                                    <div className="text-sm text-muted-foreground">
                                        Scroll untuk memuat lebih banyak
                                    </div>
                                )
                            ))}
                    </div>
                </div>
            </div>
        </>
    );
}

HomeBuilding.layout = (page) => <MainLayout>{page}</MainLayout>;
