"use client";
import * as React from "react";
import { Head, router, useForm } from "@inertiajs/react";
import { cn } from "@/Lib/utils";
import { PencilLine, Check, ChevronsUpDown } from "lucide-react";

import AppLayout from "@/Layouts/App/AppSidebarLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { formatRupiah, formatRupiahInput } from "@/Utils/formatRupiah";

const breadcrumbs = [
    { title: "Dashboard", href: "/admin/dashboard" },
    { title: "Pengaturan", href: "/admin/dashboard/setting" },
];

export default function AdminSettingDashboard({ auth, setting }) {
    const [pajakType, setPajakType] = React.useState(
        setting?.tax_type || "percent"
    );
    const [pajakAmount, setPajakAmount] = React.useState(
        String(setting?.tax_value || 0)
    );

    const [isModal, setIsModal] = React.useState({
        tax: false,
    });
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSave = async () => {
        try {
            setIsLoading(true);

            router.post(
                route("admin.settings.tax.update"),
                {
                    tax_type: pajakType,
                    tax_value: pajakAmount,
                },
                {
                    onSuccess: () => {
                        setIsModal((prev) => ({ ...prev, tax: false }));
                    },
                    onError: (errors) => {
                        console.error("Error update pajak:", errors);
                    },
                    onFinish: () => {
                        setIsLoading(false);
                    },
                }
            );
        } catch (error) {
            console.error("Terjadi kesalahan:", error);
            setIsLoading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-4">
                    <div className="aspect-video rounded-xl bg-muted/50 ">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle className="mb-2 flex items-center gap-2">
                                    Pajak
                                    <Dialog
                                        open={isModal.tax}
                                        onOpenChange={(value) =>
                                            setIsModal((prev) => ({
                                                ...prev,
                                                tax: value,
                                            }))
                                        }
                                    >
                                        <DialogTrigger>
                                            <PencilLine
                                                size={18}
                                                className="text-muted-foreground"
                                            />
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Pajak</DialogTitle>
                                                <DialogDescription className="text-red-600">
                                                    ⚠ Pastikan pajak sudah
                                                    sesuai
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4">
                                                <div className="grid gap-3">
                                                    <Label htmlFor="tipe_pajak">
                                                        Tipe Pajak
                                                    </Label>
                                                    <Select
                                                        value={pajakType}
                                                        onValueChange={(
                                                            value
                                                        ) =>
                                                            setPajakType(value)
                                                        }
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Pilih Tipe Pajak" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="percent">
                                                                Persen %
                                                            </SelectItem>
                                                            <SelectItem value="fixed">
                                                                Tetap Rp.
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <Label htmlFor="jumlah">
                                                    Jumlah
                                                </Label>
                                                <div className="relative">
                                                    {pajakType === "fixed" ? (
                                                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                            Rp.
                                                        </span>
                                                    ) : pajakType ===
                                                      "percent" ? (
                                                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                            %
                                                        </span>
                                                    ) : null}

                                                    <Input
                                                        id="jumlah"
                                                        name="jumlah"
                                                        placeholder="Masukkan Jumlah Pajak"
                                                        type={
                                                            pajakType ===
                                                            "fixed"
                                                                ? "text"
                                                                : "number"
                                                        }
                                                        className={`appearance-none pl-10 ${
                                                            pajakType ===
                                                            "percent"
                                                                ? "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                                                                : ""
                                                        }`}
                                                        value={
                                                            pajakType ===
                                                            "fixed"
                                                                ? formatRupiahInput(
                                                                      pajakAmount
                                                                  )
                                                                : pajakAmount
                                                        }
                                                        onChange={(e) => {
                                                            const val =
                                                                e.target.value;
                                                            if (
                                                                pajakType ===
                                                                "fixed"
                                                            ) {
                                                                const numericVal =
                                                                    val.replace(
                                                                        /\D/g,
                                                                        ""
                                                                    );
                                                                setPajakAmount(
                                                                    numericVal
                                                                );
                                                            } else {
                                                                setPajakAmount(
                                                                    val
                                                                );
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button variant="outline">
                                                        Batal
                                                    </Button>
                                                </DialogClose>
                                                <Button
                                                    onClick={handleSave}
                                                    disabed={isLoading}
                                                >
                                                    {isLoading
                                                        ? "Menyimpan..."
                                                        : "Simpan"}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </CardTitle>

                                {/* Tampilkan Pajak */}
                                <CardDescription>
                                    {setting?.tax_type === "percent"
                                        ? `${setting?.tax_value}%`
                                        : `Rp. ${formatRupiah(
                                              setting?.tax_value || 0
                                          )}` || "Rp. 0"}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                    <div className="aspect-video rounded-xl bg-muted/50 "></div>
                    <div className="aspect-video rounded-xl bg-muted/50 "></div>
                    <div className="aspect-video rounded-xl bg-muted/50 "></div>
                </div>
            </div>
        </AppLayout>
    );
}
