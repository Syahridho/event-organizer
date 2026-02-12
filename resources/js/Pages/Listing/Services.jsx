import { Head, usePage } from "@inertiajs/react";
import MainLayout from "@/Layouts/Main.jsx";
import ItemCard from "@/components/ItemCard.jsx";
import { Separator } from "@/components/ui/separator.jsx";

export default function ServicesListing() {
    const { services, ziggy } = usePage().props;
    const baseUrl = ziggy.url;

    return (
        <>
            <Head title="Daftar Jasa" />
            <div className="min-h-screen mx-auto xl:max-w-[1200px] p-4 md:p-6">
                <div className="py-6">
                    <h1 className="font-bold text-3xl md:text-4xl mb-3">
                        Daftar Jasa Event
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base mb-8">
                        Temukan berbagai jasa event profesional untuk kebutuhan
                        acara Anda
                    </p>

                    <Separator className="my-6" />

                    {services && services.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {services.map((service) => (
                                <ItemCard
                                    key={service.id}
                                    item={service}
                                    type="services"
                                    baseUrl={baseUrl}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground text-lg">
                                Belum ada jasa tersedia
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

ServicesListing.layout = (page) => <MainLayout>{page}</MainLayout>;
