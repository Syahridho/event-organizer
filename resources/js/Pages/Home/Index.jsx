import React, { useEffect, useRef, useState, useCallback } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import { Tickets, MicVocal, Package, Building } from "lucide-react";
import { Card } from "@/components/ui/card.jsx";
import { Separator } from "@/components/ui/separator.jsx";

import MainLayout from "@/Layouts/Main.jsx";
import ItemCard from "@/components/ItemCard.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";

// Skeleton Loading Component
const ItemSkeleton = () => (
    <Card className="h-full w-full overflow-hidden flex flex-col">
        <div className="aspect-[4/3] overflow-hidden">
            <Skeleton className="w-full h-full" />
        </div>
        <div className="p-4 space-y-3 flex-grow">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="p-4 pt-0 mt-auto border-t">
            <div className="flex items-center justify-between pt-3">
                <div className="space-y-2">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
        </div>
    </Card>
);

export default function Home() {
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

    return (
        <>
            <Head title="Beranda" />
            <div className="min-h-screen mx-auto xl:max-w-[950px] p-4">
                <div className="py-6">
                    <h1 className="font-semibold text-3xl mb-4">Kategori</h1>
                    <p className="text-muted-foreground mb-8">
                        Jelajahi acara populer di sekitar Anda, telusuri
                        berdasarkan kategori, atau lihat beberapa kalender
                        komunitas yang menarik.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <Link href="/tickets">
                            <Card className="flex flex-col items-center justify-center p-6 text-center bg-secondary/40 border hover:shadow-md hover:scale-105 transition-all cursor-pointer">
                                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 mb-3">
                                    <Tickets className="h-6 w-6 text-blue-700" />
                                </div>
                                <p className="font-medium">Tiket Event</p>
                            </Card>
                        </Link>

                        <Link href="/services">
                            <Card className="flex flex-col items-center justify-center p-6 text-center bg-secondary/40 border hover:shadow-md hover:scale-105 transition-all cursor-pointer">
                                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 mb-3">
                                    <MicVocal className="h-6 w-6 text-blue-700" />
                                </div>
                                <p className="font-medium">Jasa Event</p>
                            </Card>
                        </Link>

                        <Link href="/buildings">
                            <Card className="flex flex-col items-center justify-center p-6 text-center bg-secondary/40 border hover:shadow-md hover:scale-105 transition-all cursor-pointer">
                                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 mb-3">
                                    <Building className="h-6 w-6 text-blue-700" />
                                </div>
                                <p className="font-medium">Gedung Event</p>
                            </Card>
                        </Link>

                        <Link href="/propertys">
                            <Card className="flex flex-col items-center justify-center p-6 text-center bg-secondary/40 border hover:shadow-md hover:scale-105 transition-all cursor-pointer">
                                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 mb-3">
                                    <Package className="h-6 w-6 text-blue-700" />
                                </div>
                                <p className="font-medium">Properti Event</p>
                            </Card>
                        </Link>
                    </div>
                </div>

                <Separator className="my-4" />

                <div>
                    <h1 className="text-2xl font-semibold mb-6">
                        Daftar Event
                    </h1>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {initialLoad
                            ? // Show skeleton loading for initial load
                              Array.from({ length: 12 }, (_, i) => (
                                  <ItemSkeleton key={`skeleton-${i}`} />
                              ))
                            : items.map((item) => (
                                  <ItemCard
                                      key={item.id}
                                      item={item}
                                      type="services"
                                      baseUrl={baseUrl}
                                  />
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

Home.layout = (page) => <MainLayout>{page}</MainLayout>;
