import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { useEffect } from "react";

const REPORT_OPTIONS = [
    {
        value: "fraud",
        label: "Penipuan atau Scam",
        description: "Event palsu, penipuan sewa, atau mencurigakan",
    },
    {
        value: "inaccurate",
        label: "Informasi Tidak Akurat",
        description: "Foto, harga, atau deskripsi tidak sesuai",
    },
    {
        value: "duplicate",
        label: "Iklan Ganda",
        description: "Item ini diposting berulang kali",
    },
    {
        value: "inappropriate",
        label: "Konten Tidak Pantas",
        description: "Mengandung unsur ilegal, kasar, atau menyinggung",
    },
    {
        value: "wrong_category",
        label: "Salah Kategori",
        description: "Jasa/Properti masuk di kategori yang salah",
    },
    {
        value: "other",
        label: "Lainnya",
        description: "Alasan lain yang tidak tercantum",
    },
];

export default function ReportModal({ open, onOpenChange, type, id }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        reportable_id: id,
        reportable_type: type,
        reason: "",
        description: "",
    });

    useEffect(() => {
        if (open) {
            reset();
        }
    }, [open]);

    const handleSubmit = (e) => {
        e?.preventDefault();
        if (!data.reason) {
            toast.error("Harap pilih alasan pelaporan");
            return;
        }

        post("/report", {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Laporan berhasil dikirim.");
                onOpenChange(false);
                reset();
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).join(", ");
                toast.error(`Gagal mengirim laporan: ${errorMessage}`);
            },
        });
    };

    const handleSelectReason = (reason) => {
        setData("reason", reason);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader className="text-center">
                    <DialogTitle className="text-xl">Laporkan</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Kenapa Anda melaporkan ini?
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-4">
                    {REPORT_OPTIONS.map((option) => (
                        <div
                            key={option.value}
                            onClick={() => handleSelectReason(option.value)}
                            className={`px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                                data.reason === option.value
                                    ? "bg-slate-100 text-slate-900"
                                    : "hover:bg-slate-50 text-slate-800"
                            }`}
                        >
                            <h3 className="font-semibold text-sm">
                                {option.label}
                            </h3>
                            <p className="text-xs text-slate-600 mt-1">
                                {option.description}
                            </p>
                        </div>
                    ))}
                </div>

                {errors.reason && (
                    <p className="text-red-500 text-sm px-4">{errors.reason}</p>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={processing}
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!data.reason || processing}
                    >
                        {processing ? "Mengirim..." : "Kirim Laporan"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
