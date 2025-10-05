import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FaMapMarkerAlt, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const AddressManager = ({
    isAddressListOpen,
    setIsAddressListOpen,
    addresses,
    setAddresses,
    selectedAddressId,
    setSelectedAddressId,
    user,
}) => {
    const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [addressForm, setAddressForm] = useState({
        label: "",
        recipient_name: user?.name || "",
        phone: user?.phone || "",
        address_line: "",
        province: "",
        city: "",
        district: "",
        postal_code: "",
        note: "",
        is_default: false,
    });

    // Load addresses only on initial mount
    useEffect(() => {
        const loadAddresses = async () => {
            try {
                const response = await axios.get("/addresses/ajax/get");
                setAddresses(response.data.data);
                const defaultAddress = response.data.data.find(
                    (addr) => addr.is_default
                );
                if (defaultAddress && !selectedAddressId) {
                    setSelectedAddressId(defaultAddress.id);
                }
            } catch (error) {
                console.error("Error loading addresses:", error);
                toast.error("Gagal memuat alamat");
            }
        };
        if (isAddressListOpen) {
            loadAddresses();
        }
    }, [
        isAddressListOpen,
        setAddresses,
        setSelectedAddressId,
        selectedAddressId,
    ]);

    const handleAddressFormChange = (field, value) => {
        setAddressForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const deleteAddress = async (addressId) => {
        try {
            await axios.delete(`/addresses/ajax/${addressId}`);
            setAddresses((prev) =>
                prev.filter((addr) => addr.id !== addressId)
            );
            if (selectedAddressId === addressId) {
                setSelectedAddressId(null);
            }
            toast.success("Alamat berhasil dihapus");
        } catch (error) {
            console.error("Error deleting address:", error);
            toast.error("Gagal menghapus alamat");
        }
    };

    const saveAddress = async (e) => {
        if (e) e.preventDefault();

        const validationErrors = [];
        if (!addressForm.recipient_name.trim())
            validationErrors.push("Nama penerima harus diisi");
        if (!addressForm.address_line.trim())
            validationErrors.push("Alamat lengkap harus diisi");
        if (!addressForm.phone.trim())
            validationErrors.push("Nomor telepon harus diisi");
        if (!addressForm.province)
            validationErrors.push("Provinsi harus dipilih");
        if (!addressForm.city) validationErrors.push("Kota harus dipilih");

        if (validationErrors.length > 0) {
            validationErrors.forEach((error) => toast.error(error));
            return;
        }

        try {
            let response;
            if (editingAddress) {
                response = await axios.put(
                    `/addresses/ajax/${editingAddress.id}`,
                    addressForm
                );
                setAddresses((prev) =>
                    prev.map((addr) =>
                        addr.id === editingAddress.id
                            ? response.data.data
                            : addr
                    )
                );
            } else {
                response = await axios.post(
                    "/addresses/ajax/store",
                    addressForm
                );
                setAddresses((prev) => [...prev, response.data.data]);
                if (!selectedAddressId) {
                    setSelectedAddressId(response.data.data.id);
                }
            }

            // Tutup form tambah alamat dan buka kembali daftar alamat
            setIsAddAddressOpen(false);
            setEditingAddress(null);
            setIsAddressListOpen(true); // Buka kembali daftar alamat
            toast.success(
                editingAddress
                    ? "Alamat berhasil diperbarui"
                    : "Alamat berhasil ditambahkan"
            );
        } catch (error) {
            console.error("Error saving address:", error);
            toast.error(
                `Gagal menyimpan alamat: ${
                    error.response?.data?.message || error.message
                }`
            );
        }
    };

    const openAddressModal = (address = null) => {
        setEditingAddress(address);
        if (address) {
            setAddressForm({
                label: address.label || "",
                recipient_name: address.recipient_name || "",
                phone: address.phone || "",
                address_line: address.address_line || "",
                province: address.province || "",
                city: address.city || "",
                district: address.district || "",
                postal_code: address.postal_code || "",
                note: address.note || "",
                is_default: address.is_default || false,
            });
        } else {
            setAddressForm({
                label: "",
                recipient_name: user?.name || "",
                phone: user?.phone || "",
                address_line: "",
                province: "",
                city: "",
                district: "",
                postal_code: "",
                note: "",
                is_default: false,
            });
        }
        setIsAddressListOpen(false);
        setIsAddAddressOpen(true);
    };

    return (
        <>
            {/* Address List Dialog */}
            <Dialog
                open={isAddressListOpen}
                onOpenChange={setIsAddressListOpen}
            >
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Alamat</DialogTitle>
                        <DialogDescription>Pilih Alamat Anda</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <FaMapMarkerAlt className="w-5 h-5 text-green-600" />
                                Alamat Tujuan
                            </h2>
                            <Button
                                variant="outline"
                                className="flex items-center gap-2"
                                onClick={() => openAddressModal()}
                            >
                                <FaPlus className="w-4 h-4" />
                                Tambah Alamat
                            </Button>
                        </div>

                        {addresses.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <FaMapMarkerAlt className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p>Belum ada alamat tersimpan</p>
                                <p className="text-sm">
                                    Klik "Tambah Alamat" untuk menambahkan
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {addresses.map((address) => (
                                    <div
                                        key={address.id}
                                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                                            selectedAddressId === address.id
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-200 hover:border-gray-300"
                                        }`}
                                        onClick={() =>
                                            setSelectedAddressId(address.id)
                                        }
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="radio"
                                                    name="selectedAddress"
                                                    checked={
                                                        selectedAddressId ===
                                                        address.id
                                                    }
                                                    onChange={() =>
                                                        setSelectedAddressId(
                                                            address.id
                                                        )
                                                    }
                                                    className="mt-1"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {address.label && (
                                                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                                                {address.label}
                                                            </span>
                                                        )}
                                                        {address.is_default && (
                                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="font-medium text-gray-900">
                                                        {address.recipient_name}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {address.phone}
                                                    </p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {address.address_line},{" "}
                                                        {address.district},{" "}
                                                        {address.city},{" "}
                                                        {address.province},{" "}
                                                        {address.postal_code}
                                                    </p>
                                                    {address.note && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Catatan:{" "}
                                                            {address.note}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openAddressModal(
                                                            address
                                                        );
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-blue-600"
                                                >
                                                    <FaEdit className="w-4 h-4" />
                                                </button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <button
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                            className="p-2 text-gray-400 hover:text-red-600"
                                                        >
                                                            <FaTrash className="w-4 h-4" />
                                                        </button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>
                                                                Hapus Alamat?
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Alamat ini akan
                                                                dihapus permanen
                                                                dan tidak bisa
                                                                dikembalikan.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>
                                                                Batal
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                className="bg-red-600 hover:bg-red-700"
                                                                onClick={() =>
                                                                    deleteAddress(
                                                                        address.id
                                                                    )
                                                                }
                                                            >
                                                                Hapus
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="submit"
                            onClick={() => setIsAddressListOpen(false)}
                        >
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Address Dialog */}
            <Dialog
                open={isAddAddressOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsAddAddressOpen(false);
                        setEditingAddress(null);
                        // Kembali ke daftar alamat jika user membatalkan tanpa menyimpan
                        setIsAddressListOpen(true);
                    }
                }}
            >
                <DialogContent className="sm:max-w-3xl max-h-[95vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle>
                            {editingAddress ? "Edit Alamat" : "Tambah Alamat"}
                        </DialogTitle>
                        <DialogDescription>Alamat anda</DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={saveAddress}
                        className="flex flex-col flex-1"
                    >
                        <div className="flex-1 max-h-[70vh] overflow-y-auto">
                            <div className="grid gap-4 p-1">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="block text-sm font-medium text-gray-700 mb-1">
                                            Label Alamat
                                        </Label>
                                        <Input
                                            type="text"
                                            value={addressForm.label}
                                            onChange={(e) =>
                                                handleAddressFormChange(
                                                    "label",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Contoh: Rumah, Kantor"
                                            maxLength={255}
                                        />
                                    </div>
                                    <div>
                                        <Label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nama Pembeli *
                                        </Label>
                                        <Input
                                            type="text"
                                            value={addressForm.recipient_name}
                                            onChange={(e) =>
                                                handleAddressFormChange(
                                                    "recipient_name",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Nama penerima"
                                            maxLength={255}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="block text-sm font-medium text-gray-700 mb-1">
                                            Provinsi *
                                        </Label>
                                        <Input
                                            type="text"
                                            value={addressForm.province}
                                            onChange={(e) =>
                                                handleAddressFormChange(
                                                    "province",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Contoh: Jawa Barat"
                                            maxLength={255}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label className="block text-sm font-medium text-gray-700 mb-1">
                                            Kota / Kabupaten *
                                        </Label>
                                        <Input
                                            type="text"
                                            value={addressForm.city}
                                            onChange={(e) =>
                                                handleAddressFormChange(
                                                    "city",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Contoh: Bandung"
                                            maxLength={255}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                                        Kecamatan *
                                    </Label>
                                    <Input
                                        type="text"
                                        value={addressForm.district}
                                        onChange={(e) =>
                                            handleAddressFormChange(
                                                "district",
                                                e.target.value
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Contoh: Cileunyi"
                                        maxLength={255}
                                        required
                                    />
                                </div>

                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                                        Alamat Lengkap *
                                    </Label>
                                    <Textarea
                                        value={addressForm.address_line}
                                        onChange={(e) =>
                                            handleAddressFormChange(
                                                "address_line",
                                                e.target.value
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        placeholder="Jl. Contoh No. 123, RT/RW, Kelurahan"
                                        rows={3}
                                        maxLength={500}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="block text-sm font-medium text-gray-700 mb-1">
                                            Kode Pos
                                        </Label>
                                        <Input
                                            type="text"
                                            value={addressForm.postal_code}
                                            onChange={(e) =>
                                                handleAddressFormChange(
                                                    "postal_code",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="12345"
                                            maxLength={10}
                                        />
                                    </div>
                                    <div>
                                        <Label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nomor Telepon *
                                        </Label>
                                        <Input
                                            type="tel"
                                            value={addressForm.phone}
                                            onChange={(e) =>
                                                handleAddressFormChange(
                                                    "phone",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="08123456789"
                                            maxLength={20}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                                        Catatan Tambahan
                                    </Label>
                                    <Textarea
                                        value={addressForm.note}
                                        onChange={(e) =>
                                            handleAddressFormChange(
                                                "note",
                                                e.target.value
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        placeholder="Patokan, instruksi khusus, dll."
                                        rows={2}
                                        maxLength={500}
                                    />
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="is_default"
                                        checked={addressForm.is_default}
                                        onChange={(e) =>
                                            handleAddressFormChange(
                                                "is_default",
                                                e.target.checked
                                            )
                                        }
                                        className="mr-2"
                                    />
                                    <Label
                                        htmlFor="is_default"
                                        className="text-sm text-gray-700"
                                    >
                                        Jadikan alamat default
                                    </Label>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="flex-shrink-0 mt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsAddAddressOpen(false);
                                    setIsAddressListOpen(true); // Kembali ke daftar alamat
                                }}
                            >
                                Batal
                            </Button>
                            <Button type="submit">
                                {editingAddress ? "Update" : "Tambahkan"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default AddressManager;
