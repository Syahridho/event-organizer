import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Eye, Download } from "lucide-react";

export function PDFViewer({ mitraId, fileType, fileName }) {
    const [open, setOpen] = useState(false);

    // URL untuk view (inline)
    const viewUrl = route("admin.partners.view-pdf", {
        mitra: mitraId,
        type: fileType,
    });

    // URL untuk download
    const downloadUrl = route("admin.partners.download-pdf", {
        mitra: mitraId,
        type: fileType,
    });

    return (
        <>
            <button onClick={() => setOpen(true)}>Lihat {fileName}</button>

            {open && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-semibold">{fileName}</h3>
                            <div className="flex gap-2">
                                <a
                                    href={downloadUrl}
                                    className="px-4 py-2 bg-blue-500 text-white rounded"
                                >
                                    Download
                                </a>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="px-4 py-2 bg-gray-200 rounded"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 p-4">
                            <iframe
                                src={viewUrl}
                                className="w-full h-full border rounded"
                                title={fileName}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
