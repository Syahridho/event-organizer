import React from "react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { cn } from "@/Lib/utils";

const ImageGallery = ({ images, activeImage, setActiveImage, serviceName, serviceStatus }) => {
    return (
        <>
            <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                <div className="aspect-video relative">
                    <div className="flex-1">
                        <Carousel>
                            <CarouselContent>
                                <CarouselItem>
                                    <Card className="overflow-hidden">
                                        <CardContent className="flex items-center justify-center p-0">
                                            <img
                                                src={images[activeImage].url}
                                                alt={serviceName}
                                                className="object-cover rounded-lg max-h-[600px] w-full"
                                                loading="lazy"
                                            />
                                        </CardContent>
                                    </Card>
                                </CarouselItem>
                            </CarouselContent>
                        </Carousel>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div className="absolute top-4 right-4 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                        {serviceStatus === "active"
                            ? "Tersedia"
                            : "Tidak Tersedia"}
                    </div>
                </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, i) => (
                    <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        className={cn(
                            "border rounded-lg overflow-hidden w-20 h-20 flex items-center justify-center flex-shrink-0",
                            activeImage === i && "ring-2 ring-black"
                        )}
                    >
                        <img
                            src={img.url}
                            alt={`Product thumbnail ${i + 1}`}
                            className="object-cover w-full h-full"
                            loading="lazy"
                        />
                    </button>
                ))}
            </div>
        </>
    );
};

export default ImageGallery;
