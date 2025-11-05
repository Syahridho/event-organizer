import * as React from "react";
import { Head } from "@inertiajs/react";
import { Wrench, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function Maintenance() {
    return (
        <>
            <Head title="Maintenance Mode" />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                            <Wrench className="h-8 w-8 text-orange-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900">
                            Sedang Dalam Pemeliharaan
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                            Kami sedang melakukan pemeliharaan sistem untuk
                            meningkatkan pengalaman Anda
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span>Perkiraan waktu: 1-2 jam</span>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-800">
                                Sistem akan kembali normal dalam waktu dekat.
                                Terima kasih atas kesabaran Anda.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
