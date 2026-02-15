import React, { memo } from "react";
import { Button } from "@/components/ui/button.jsx";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Checkbox } from "@/components/ui/checkbox.jsx";

const AddressModal = memo(
    ({ isOpen, onOpenChange, isEditing, form, setForm, onSave, onCancel }) => {
        const handleChange = (field, value) => {
            setForm((prev) => ({ ...prev, [field]: value }));
        };

        return (
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing ? "Edit Alamat" : "Tambah Alamat"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Label + Nama Penerima */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="label">Label Alamat</Label>
                                <Input
                                    id="label"
                                    value={form.label}
                                    onChange={(e) =>
                                        handleChange("label", e.target.value)
                                    }
                                    placeholder="Rumah, Kantor, dll."
                                    maxLength={255}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="recipient_name">
                                    Nama Penerima{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="recipient_name"
                                    value={form.recipient_name}
                                    onChange={(e) =>
                                        handleChange(
                                            "recipient_name",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Nama penerima"
                                    maxLength={255}
                                    required
                                />
                            </div>
                        </div>

                        {/* Provinsi + Kota */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="province">
                                    Provinsi{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="province"
                                    value={form.province}
                                    onChange={(e) => {
                                        setForm((prev) => ({
                                            ...prev,
                                            province: e.target.value,
                                            city: "",
                                            district: "",
                                        }));
                                    }}
                                    placeholder="Contoh: Jawa Barat"
                                    maxLength={255}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="city">
                                    Kota / Kabupaten{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="city"
                                    value={form.city}
                                    onChange={(e) =>
                                        handleChange("city", e.target.value)
                                    }
                                    placeholder="Contoh: Bandung"
                                    maxLength={255}
                                    required
                                />
                            </div>
                        </div>

                        {/* Kecamatan */}
                        <div className="space-y-2">
                            <Label htmlFor="district">Kecamatan</Label>
                            <Input
                                id="district"
                                value={form.district}
                                onChange={(e) =>
                                    handleChange("district", e.target.value)
                                }
                                placeholder="Contoh: Cileunyi"
                                maxLength={255}
                            />
                        </div>

                        {/* Alamat Lengkap */}
                        <div className="space-y-2">
                            <Label htmlFor="address_line">
                                Alamat Lengkap{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="address_line"
                                value={form.address_line}
                                onChange={(e) =>
                                    handleChange("address_line", e.target.value)
                                }
                                placeholder="Jl. Contoh No. 123, RT/RW, Kelurahan"
                                rows={3}
                                maxLength={500}
                                required
                            />
                        </div>

                        {/* Kode Pos + Nomor HP */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="postal_code">Kode Pos</Label>
                                <Input
                                    id="postal_code"
                                    value={form.postal_code}
                                    onChange={(e) =>
                                        handleChange(
                                            "postal_code",
                                            e.target.value
                                        )
                                    }
                                    placeholder="12345"
                                    maxLength={10}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">
                                    Nomor Telepon{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) =>
                                        handleChange("phone", e.target.value)
                                    }
                                    placeholder="08123456789"
                                    maxLength={20}
                                    required
                                />
                            </div>
                        </div>

                        {/* Catatan */}
                        <div className="space-y-2">
                            <Label htmlFor="note">Catatan Tambahan</Label>
                            <Textarea
                                id="note"
                                value={form.note}
                                onChange={(e) =>
                                    handleChange("note", e.target.value)
                                }
                                placeholder="Patokan, instruksi khusus, dll."
                                rows={2}
                                maxLength={500}
                            />
                        </div>

                        {/* Default Checkbox */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_default"
                                checked={form.is_default}
                                onCheckedChange={(checked) =>
                                    handleChange("is_default", checked)
                                }
                            />
                            <Label
                                htmlFor="is_default"
                                className="text-sm font-normal cursor-pointer"
                            >
                                Jadikan alamat default
                            </Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                        >
                            Batal
                        </Button>
                        <Button type="button" onClick={onSave}>
                            Simpan Alamat
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }
);

AddressModal.displayName = "AddressModal";

export default AddressModal;
