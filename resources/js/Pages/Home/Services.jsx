import React, { useEffect, useRef, useState, useCallback } from "react";

// Inertia imports
import { Head, Link, usePage } from "@inertiajs/react";

// UI Components
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card.jsx";

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
    Loader2, // Menggunakan Loader2 dari lucide-react untuk spinner
} from "lucide-react";

// Utils & Layouts
import { formatTanggalIndo, getJamMenit } from "@/Utils/formatDateTime.js";
import MainLayout from "@/Layouts/Main.jsx";

// Skeleton Loading Component
const ItemSkeleton = () => (
    <div className="p-4 border rounded animate-pulse hover:shadow-lg transition-all duration-300 overflow-hidden group">
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

export default function HomeService() {
    const { props } = usePage();
    // Diasumsikan props memiliki struktur { items: { data: [...], next_page_url: '...' }, ziggy: { url: '...' } }
    const { ziggy } = props;

    // Menggunakan fallback jika ziggy.url tidak tersedia
    const baseUrl = ziggy?.url ?? "http://localhost";

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

            if (!res.ok) {
                const errorText = await res.text();
                console.error(
                    `Fetch failed with status ${res.status}. Response text:`,
                    errorText
                );
                // Penting: Set ended ke true agar tidak mencoba fetch berulang kali
                setEnded(true);
                throw new Error(
                    `Network response was not ok, status: ${res.status}`
                );
            }

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const errorText = await res.text();
                console.error(
                    "Expected JSON but received:",
                    errorText.substring(0, 200) + "..."
                );
                // Penting: Set ended ke true agar tidak mencoba fetch berulang kali
                setEnded(true);
                throw new Error("Received non-JSON response from server.");
            }

            const json = await res.json();

            setItems((prev) => [...prev, ...json.data]);
            setNextPageUrl(json.next_page_url);
            if (!json.next_page_url) setEnded(true);
        } catch (err) {
            console.error("Fetch next page failed:", err);
            setEnded(true);
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
        if (!sentinelRef.current || initialLoad || ended) return;

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
    }, [fetchNext, nextPageUrl, loading, initialLoad, ended]);

    // Mengembalikan fungsi formatPrice ke dalam utilitas jika ada
    // Jika tidak, biarkan di sini:
    const formatPrice = (price) => {
        return new Intl.NumberFormat("id-ID").format(price);
    };

    const getImageUrl = (thumbnail) => {
        if (!thumbnail)
            return `${baseUrl}/storage/default-event-images/dubby.webp`;
        return thumbnail.startsWith("http")
            ? thumbnail
            : `${baseUrl}/storage/thumbnails/${thumbnail}`;
    };

    const truncateDescription = (desc) => {
        if (!desc) return "";
        // Diasumsikan formatTanggalIndo dan getJamMenit diimpor dari @/Utils/formatDateTime
        const text = desc.replace(/<\/?[^>]+(>|$)/g, "");
        return text.length > 120 ? text.slice(0, 120) + "..." : text;
    };

    return (
        <>
            <Head title="Ticket" />
            <div className="min-h-screen mx-auto xl:max-w-[950px] p-4 pt-12">
                <div>
                    <h1 className="text-2xl font-semibold mb-6 text-gray-800">
                        Daftar Jasa
                    </h1>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {initialLoad
                            ? // Show skeleton loading for initial load
                              Array.from({ length: 9 }, (_, i) => (
                                  <ItemSkeleton key={`skeleton-${i}`} />
                              ))
                            : items.map((item) => (
                                  <Link
                                      key={item.id}
                                      href={`/services/${item.id}`}
                                  >
                                      <div className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
                                          <LazyImage
                                              src={getImageUrl(item.thumbnail)}
                                              alt={item.name}
                                              className="aspect-video w-full overflow-hidden"
                                          />
                                          <div className="p-4 space-y-2">
                                              <h3 className="font-bold text-base leading-tight group-hover:text-blue-600 transition-colors">
                                                  {item.name}
                                              </h3>

                                              <div className="space-y-1">
                                                  {item.price !== undefined && (
                                                      <div className="flex items-center gap-2 text-green-600">
                                                          <span className="font-extrabold text-sm">
                                                              Rp{" "}
                                                              {formatPrice(
                                                                  item.price
                                                              )}
                                                          </span>
                                                      </div>
                                                  )}

                                                  {item.location && (
                                                      <div className="flex items-center gap-2 text-gray-500">
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
                            Array.from({ length: 3 }, (_, i) => (
                                <ItemSkeleton key={`loading-${i}`} />
                            ))}
                    </div>

                    {/* Sentinel untuk infinite scroll */}
                    <div
                        ref={sentinelRef}
                        className="h-20 mt-8 flex items-center justify-center"
                    >
                        {!initialLoad &&
                            (loading ? (
                                <div className="flex items-center space-x-2 text-blue-600">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    <span className="text-sm">
                                        Memuat lebih banyak...
                                    </span>
                                </div>
                            ) : ended ? (
                                <div className="text-sm text-gray-400">
                                    Semua item telah dimuat
                                </div>
                            ) : (
                                nextPageUrl && (
                                    <div className="text-sm text-gray-500">
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

HomeService.layout = (page) => <MainLayout>{page}</MainLayout>;
