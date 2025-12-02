import React from "react";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { Card, CardContent, CardHeader } from "@/components/ui/card.jsx";

export default function CheckoutSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-40" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex gap-4">
                                <Skeleton className="h-20 w-20 rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <div className="flex justify-between mt-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-5 w-24" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-px w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
