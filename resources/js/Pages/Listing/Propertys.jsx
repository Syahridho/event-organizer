import { Head, usePage } from "@inertiajs/react";
import MainLayout from "@/Layouts/Main.jsx";
import ItemCard from "@/Components/ItemCard.jsx";
import { Separator } from "@/components/ui/separator.jsx";

export default function PropertysListing() {
    const { propertys, ziggy } = usePage().props;
    const baseUrl = ziggy.url;

    return (
        <>
            <Head title="Daftar Properti" />
            <div className="min-h-screen mx-auto xl:max-w-[1200px] p-4 md:p-6">
                <div className="py-6">
                    <h1 className="font-bold text-3xl md:text-4xl mb-3">
                        Daftar Properti Event
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base mb-8">
                        Temukan properti yang cocok untuk kebutuhan event Anda
                    </p>
                    
                    <Separator className="my-6" />

                    {propertys && propertys.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {propertys.map((property) => (
                                <ItemCard
                                    key={property.id}
                                    item={property}
                                    type="propertys"
                                    baseUrl={baseUrl}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground text-lg">
                                Belum ada properti tersedia
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

PropertysListing.layout = (page) => <MainLayout>{page}</MainLayout>;
