import React from "react";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";

const TestimonialSkeleton = () => {
    return (
        <Card className="cursor-pointer transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-6 text-center space-y-4">
                <Skeleton className="w-16 h-16 rounded-full mx-auto" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24 mx-auto" />
                    <Skeleton className="h-3 w-20 mx-auto" />
                </div>
                <div className="flex justify-center space-x-1">
                    {Array.from({ length: 5 }, (_, i) => (
                        <Skeleton key={i} className="w-4 h-4" />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default TestimonialSkeleton;
