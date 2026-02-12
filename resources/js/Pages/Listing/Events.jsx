import { Head, usePage } from "@inertiajs/react";
import MainLayout from "@/Layouts/Main.jsx";
import ItemCard from "@/components/ItemCard.jsx";
import { Separator } from "@/components/ui/separator.jsx";

export default function EventsListing() {
    const { events, ziggy } = usePage().props;
    const baseUrl = ziggy.url;

    return (
        <>
            <Head title="Daftar Event" />
            <div className="min-h-screen mx-auto xl:max-w-[1200px] p-4 md:p-6">
                <div className="py-6">
                    <h1 className="font-bold text-3xl md:text-4xl mb-3">
                        Daftar Event
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base mb-8">
                        Temukan berbagai event menarik yang sesuai dengan minat
                        Anda
                    </p>

                    <Separator className="my-6" />

                    {events && events.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {events.map((event) => (
                                <ItemCard
                                    key={event.id}
                                    item={event}
                                    type="events"
                                    baseUrl={baseUrl}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground text-lg">
                                Belum ada event tersedia
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

EventsListing.layout = (page) => <MainLayout>{page}</MainLayout>;
