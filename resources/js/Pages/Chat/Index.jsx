import React from "react";
import { Head } from "@inertiajs/react";
import AppChat from "@/Layouts/App.jsx";

export default function Chat() {
    return (
        <>
            <Head title="Pesan" />

            <div className="hidden lg:flex lg:flex-col lg:w-2/3 lg:h-full">
                <div className="flex items-center justify-center h-full">
                    <div className="font-semibold tracking-tight">
                        Cari dan pilih percakapan untuk memulai pesan
                    </div>
                </div>
            </div>
        </>
    );
}

Chat.layout = (page) => <AppChat children={page} />;
