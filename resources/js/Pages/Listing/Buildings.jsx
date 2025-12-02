import { Head, usePage } from "@inertiajs/react";
import MainLayout from "@/Layouts/Main.jsx";
import ItemCard from "@/Components/ItemCard.jsx";
import { Separator } from "@/components/ui/separator.jsx";

export default function BuildingsListing() {
    const { buildings, ziggy } = usePage().props;
    const baseUrl = ziggy.url;

    return (
        <>
            <Head title="Daftar Gedung" />
            <div className="min-h-screen mx-auto xl:max-w-[1200px] p-4 md:p-6">
                <div className="py-6">
                    <h1 className="font-bold text-3xl md:text-4xl mb-3">
                        Daftar Gedung Event
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base mb-8">
                        Temukan gedung yang sempurna untuk acara Anda
                    </p>
                    
                    <Separator className="my-6" />

                    {buildings && buildings.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {buildings.map((building) => (
                                <ItemCard
                                    key={building.id}
                                    item={building}
                                    type="buildings"
                                    baseUrl={baseUrl}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground text-lg">
                                Belum ada gedung tersedia
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

BuildingsListing.layout = (page) => <MainLayout>{page}</MainLayout>;
