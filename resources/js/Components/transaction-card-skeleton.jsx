// components/transaction-card-skeleton.jsx

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Skeleton loading card for transactions
export function TransactionCardSkeleton() {
    return (
        <Card className="shadow-sm">
            <CardContent className="flex items-center justify-between p-4 sm:p-5">
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div>
                        <Skeleton className="h-4 w-40 mb-1" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>

                <div className="text-right">
                    <Skeleton className="h-6 w-24 mb-1 ml-auto" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </CardContent>
        </Card>
    );
}
