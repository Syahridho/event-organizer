import { Link } from "@inertiajs/react";
import { ChevronRight } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import ItemCard from "@/Components/ItemCard.jsx";

const CategorySection = ({ title, items, type, baseUrl, id, subtitle }) => {
    return (
        <section id={id} className="py-16 bg-background relative">
            <div className="container mx-auto max-w-7xl px-4 md:px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                    <div className="space-y-2">
                        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
                            {type === 'events' ? 'Featured' : 'Popular'}
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                            {title}
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-2xl">
                            {subtitle || "Pilihan terbaik untuk kebutuhan event Anda"}
                        </p>
                    </div>
                    
                    <Link href={`/${type}`}>
                        <Button variant="outline" className="group hidden md:flex">
                            Lihat Semua
                            <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>

                <ScrollArea className="w-full -mx-4 px-4 md:mx-0 md:px-0">
                    <div className="flex space-x-6 pb-6 pt-2">
                        {items.length > 0 ? (
                            items.map((item, index) => (
                                <div key={`${type}-${index}`} className="w-72 flex-shrink-0">
                                    <ItemCard
                                        item={item}
                                        type={type}
                                        baseUrl={baseUrl}
                                    />
                                </div>
                            ))
                        ) : (
                            <Card className="w-full py-16 border-dashed">
                                <CardContent className="text-center space-y-4">
                                    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                        <ChevronRight className="w-8 h-8 text-muted-foreground opacity-50" />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-lg font-medium">
                                            Tidak ada {title.toLowerCase()} yang ditemukan
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Silakan coba lagi nanti atau periksa kategori lain
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => window.location.reload()}
                                    >
                                        Muat Ulang
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>

                <div className="mt-6 md:hidden text-center">
                    <Link href={`/${type}`}>
                        <Button variant="ghost" className="w-full group">
                            Lihat Semua {title}
                            <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default CategorySection;
