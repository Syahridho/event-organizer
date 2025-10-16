import { usePage, router, Head, Link } from "@inertiajs/react";
import axios from "axios";
import { formatRupiah } from "@/Utils/formatRupiah";
import { useCallback, useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
    FaArrowLeft,
    FaCreditCard,
    FaShoppingBag,
    FaMapMarkerAlt,
    FaPlus,
    FaEdit,
    FaTrash,
    FaExternalLinkAlt,
    FaTicketAlt,
    FaCalendarAlt,
} from "react-icons/fa";
import { useMidtrans } from "@/hooks/usePaymentMidtrans";

export default function CheckoutPage() {
    const { checkoutData, ziggy, user } = usePage().props;
    console.log(checkoutData);

    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
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

    const { snapLoaded, paymentError, setPaymentError } = useMidtrans();

    // Check if address is required based on item types
    const isAddressRequired = useMemo(() => {
        if (!checkoutData?.items) return false;
        return checkoutData.items.some(
            (item) => item.type === "service" || item.type === "property"
        );
    }, [checkoutData]);

    const selectedAddress = useMemo(() => {
        return addresses.find((addr) => addr.id === selectedAddressId);
    }, [addresses, selectedAddressId]);

    // Format date helper with WIB timezone
    const formatDate = (dateString) => {
        if (!dateString) return null;
        try {
            // Parse tanggal dengan timezone Jakarta (WIB)
            const date = new Date(dateString);
            const options = {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                timeZone: "Asia/Jakarta",
            };
            return date.toLocaleDateString("id-ID", options);
        } catch (e) {
            return dateString;
        }
    };

    // Format rent days date (only date, no time) - OPTIMIZED
    const formatRentDays = (dateString) => {
        if (!dateString) return null;
        try {
            // Parse YYYY-MM-DD langsung tanpa timezone conversion
            const [year, month, day] = dateString.split('T')[0].split('-');
            const date = new Date(year, month - 1, day);

            const options = {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            };
            return date.toLocaleDateString("id-ID", options);
        } catch (e) {
            console.error('Error formatting rent_days:', e, dateString);
            return dateString;
        }
    };

    // Get product detail URL helper
    const getProductDetailUrl = (item) => {
        const typeMap = {
            ticket: "events",
            service: "services",
            building: "buildings",
            property: "properties",
        };
        const path = typeMap[item.type] || "events";
        return `/${path}/${item.id}`;
    };

    // Load addresses
    const loadAddresses = useCallback(async () => {
        setIsLoadingAddresses(true);
        try {
            const response = await axios.get("/addresses/ajax/get");
            setAddresses(response.data.data);
            const defaultAddress = response.data.data.find(
                (addr) => addr.is_default
            );
            if (defaultAddress) {
                setSelectedAddressId(defaultAddress.id);
            }
        } catch (error) {
            console.error("Error loading addresses:", error);
            toast.error("Gagal memuat alamat. Silakan refresh halaman.");
        } finally {
            setIsLoadingAddresses(false);
        }
    }, []);

    // Open address modal
    const openAddressModal = useCallback(
        (address = null) => {
            if (address) {
                setEditingAddress(address);
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
                setEditingAddress(null);
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
                    is_default: addresses.length === 0,
                });
            }
            setShowAddressModal(true);
        },
        [addresses.length, user]
    );

    // Close address modal
    const closeAddressModal = useCallback(() => {
        setShowAddressModal(false);
        setEditingAddress(null);
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
    }, [user]);

    // Save address
    const saveAddress = async () => {
        try {
            if (!addressForm.recipient_name.trim()) {
                toast.error("Nama penerima harus diisi");
                return;
            }
            if (!addressForm.address_line.trim()) {
                toast.error("Alamat lengkap harus diisi");
                return;
            }
            if (!addressForm.phone.trim()) {
                toast.error("Nomor telepon harus diisi");
                return;
            }
            if (!addressForm.province) {
                toast.error("Provinsi harus dipilih");
                return;
            }
            if (!addressForm.city) {
                toast.error("Kota harus dipilih");
                return;
            }

            let response;
            if (editingAddress) {
                response = await axios.put(
                    `/addresses/ajax/${editingAddress.id}`,
                    addressForm
                );
                toast.success("Alamat berhasil diperbarui");
            } else {
                response = await axios.post(
                    "/addresses/ajax/store",
                    addressForm
                );
                toast.success("Alamat berhasil ditambahkan");
            }

            await loadAddresses();
            closeAddressModal();

            if (!editingAddress && !selectedAddressId) {
                setSelectedAddressId(response.data.data.id);
            }
        } catch (error) {
            console.error("Error saving address:", error);
            toast.error(
                error.response?.data?.message ||
                    "Gagal menyimpan alamat. Silakan coba lagi."
            );
        }
    };

    // Delete address
    const deleteAddress = async (addressId) => {
        try {
            await axios.delete(`/addresses/ajax/${addressId}`);
            toast.success("Alamat berhasil dihapus");
            await loadAddresses();

            if (selectedAddressId === addressId) {
                setSelectedAddressId(null);
            }
        } catch (error) {
            console.error("Error deleting address:", error);
            toast.error("Gagal menghapus alamat");
        }
    };

    // Handle back to cart
    const handleBackToCart = useCallback(() => {
        router.visit("/cart");
    }, []);

    // Handle payment
    const handlePayment = useCallback(
        async (e) => {
            if (e) e.preventDefault();

            // Validate address requirement
            if (isAddressRequired && !selectedAddressId) {
                toast.error(
                    "Silakan pilih alamat pengiriman untuk item service atau property"
                );
                return;
            }

            if (checkoutData.total < 1000) {
                toast.error("Minimum pembayaran adalah Rp. 1.000");
                return;
            }

            if (!snapLoaded || !window.snap) {
                toast.error(
                    "Sistem pembayaran belum siap. Silakan refresh halaman."
                );
                return;
            }

            setPaymentError(null);
            setIsProcessingPayment(true);

            try {
                const mapItemType = (frontendType) => {
                    const typeMapping = {
                        ticket: "ticket",
                        service: "service",
                        building: "building",
                        property: "rent_property",
                    };
                    return typeMapping[frontendType] || "ticket";
                };

                const paymentData = {
                    items: checkoutData.items.map((item) => ({
                        id: parseInt(item.id),
                        type: mapItemType(item.type),
                        quantity: parseInt(item.quantity),
                        price: parseInt(item.price),
                        rent_days: item.rent_days,
                        name: `${item.name} (${item.type})`,
                    })),
                    amount: parseInt(checkoutData.total),
                    name: user.name,
                    email: user.email,
                };

                if (selectedAddress) {
                    paymentData.shipping_address = {
                        recipient_name: selectedAddress.recipient_name,
                        address_line: selectedAddress.address_line,
                        phone: selectedAddress.phone,
                        note: selectedAddress.note,
                        city: selectedAddress.city,
                        province: selectedAddress.province,
                        postal_code: selectedAddress.postal_code,
                    };
                }

                const response = await axios.post(
                    "/midtrans/token",
                    paymentData,
                    {
                        timeout: 30000,
                        headers: {
                            "Content-Type": "application/json",
                            "X-Requested-With": "XMLHttpRequest",
                            "X-CSRF-TOKEN": document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute("content"),
                        },
                    }
                );

                const { token: snapToken } = response.data;

                if (!snapToken) {
                    throw new Error("Token pembayaran tidak diterima");
                }

                window.snap.pay(snapToken, {
                    skipOrderSummary: false,
                    onSuccess: async (result) => {
                        setIsProcessingPayment(false);

                        await axios.delete("/cart/clear-after-checkout", {
                            data: { cart_ids: checkoutData.cart_ids },
                            headers: {
                                "Content-Type": "application/json",
                                "X-CSRF-TOKEN": document
                                    .querySelector('meta[name="csrf-token"]')
                                    ?.getAttribute("content"),
                            },
                        });

                        toast.success("Pembayaran berhasil!");
                        router.visit("/purchase", {
                            method: "get",
                            preserveState: false,
                        });
                    },
                    onPending: async (result) => {
                        setIsProcessingPayment(false);

                        await axios.delete("/cart/clear-after-checkout", {
                            data: { cart_ids: checkoutData.cart_ids },
                            headers: {
                                "Content-Type": "application/json",
                                "X-CSRF-TOKEN": document
                                    .querySelector('meta[name="csrf-token"]')
                                    ?.getAttribute("content"),
                            },
                        });

                        toast.info("Pembayaran pending, menunggu konfirmasi");
                        router.visit("/purchase", {
                            method: "get",
                            preserveState: false,
                        });
                    },
                    onError: (error) => {
                        console.error("Payment error:", error);
                        setIsProcessingPayment(false);
                        toast.error(
                            "Terjadi kesalahan dalam proses pembayaran"
                        );
                        router.visit("/purchase", {
                            method: "get",
                            preserveState: false,
                        });
                    },
                    onClose: async () => {
                        await axios.delete("/cart/clear-after-checkout", {
                            data: { cart_ids: checkoutData.cart_ids },
                            headers: {
                                "Content-Type": "application/json",
                                "X-CSRF-TOKEN": document
                                    .querySelector('meta[name="csrf-token"]')
                                    ?.getAttribute("content"),
                            },
                        });
                        router.visit("/purchase", {
                            method: "get",
                            preserveState: false,
                        });
                        setIsProcessingPayment(false);
                    },
                });
            } catch (error) {
                console.error("Payment initialization error:", error);
                setIsProcessingPayment(false);

                let errorMessage =
                    "Terjadi kesalahan saat memproses pembayaran";

                if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response?.data?.errors) {
                    const errors = error.response.data.errors;
                    const errorMessages = Object.entries(errors).map(
                        ([field, messages]) =>
                            `${field}: ${messages.join(", ")}`
                    );
                    errorMessage = `Validation errors: ${errorMessages.join(
                        "; "
                    )}`;
                }

                toast.error(errorMessage);
            }
        },
        [
            checkoutData,
            user,
            selectedAddress,
            snapLoaded,
            isAddressRequired,
            selectedAddressId,
        ]
    );

    const TYPE_LABELS = {
        ticket: "Tiket Event",
        service: "Layanan",
        building: "Gedung",
        property: "Properti",
    };

    const getTypeLabel = (type) => TYPE_LABELS[type] || type;

    useEffect(() => {
        loadAddresses();
    }, [loadAddresses]);

    useEffect(() => {
        if (
            !checkoutData ||
            !checkoutData.items ||
            checkoutData.items.length === 0
        ) {
            toast.error(
                "Data checkout tidak ditemukan. Silakan pilih item dari keranjang."
            );
            router.visit("/cart");
        }
    }, [checkoutData]);

    if (!checkoutData) {
        return (
            <div className="max-w-4xl mx-auto py-10 px-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">
                        Memuat data checkout...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <Head title="Proses Pembayaran" />

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBackToCart}
                    className="flex items-center gap-2"
                >
                    <FaArrowLeft className="w-4 h-4" />
                    Kembali ke Keranjang
                </Button>
                <h1 className="text-2xl font-bold">Checkout</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Shipping Address Section - Only show if required */}
                    {isAddressRequired && (
                        <div className="bg-white rounded-lg border p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <FaMapMarkerAlt className="w-5 h-5 text-green-600" />
                                    Alamat Pengiriman
                                    <span className="text-red-500 text-sm">
                                        *
                                    </span>
                                </h2>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openAddressModal()}
                                    className="flex items-center gap-2"
                                >
                                    <FaPlus className="w-4 h-4" />
                                    Tambah Alamat
                                </Button>
                            </div>

                            {isLoadingAddresses ? (
                                <div className="space-y-3">
                                    {[1, 2].map((i) => (
                                        <div
                                            key={i}
                                            className="border rounded-lg p-4"
                                        >
                                            <Skeleton className="h-4 w-24 mb-2" />
                                            <Skeleton className="h-5 w-32 mb-2" />
                                            <Skeleton className="h-4 w-40 mb-1" />
                                            <Skeleton className="h-4 w-full" />
                                        </div>
                                    ))}
                                </div>
                            ) : addresses.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <FaMapMarkerAlt className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                    <p>Belum ada alamat tersimpan</p>
                                    <p className="text-sm">
                                        Klik "Tambah Alamat" untuk menambahkan
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {addresses.map((address) => (
                                        <div
                                            key={address.id}
                                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                                selectedAddressId === address.id
                                                    ? "border-blue-500 bg-blue-50 shadow-sm"
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                            onClick={() =>
                                                setSelectedAddressId(address.id)
                                            }
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3 flex-1">
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
                                                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                                                                    {
                                                                        address.label
                                                                    }
                                                                </span>
                                                            )}
                                                            {address.is_default && (
                                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                                                                    Default
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="font-medium text-gray-900">
                                                            {
                                                                address.recipient_name
                                                            }
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            {address.phone}
                                                        </p>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {
                                                                address.address_line
                                                            }
                                                            , {address.district}
                                                            , {address.city},{" "}
                                                            {address.province},{" "}
                                                            {
                                                                address.postal_code
                                                            }
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
                                                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                                    >
                                                        <FaEdit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (
                                                                confirm(
                                                                    "Apakah Anda yakin ingin menghapus alamat ini?"
                                                                )
                                                            ) {
                                                                deleteAddress(
                                                                    address.id
                                                                );
                                                            }
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                    >
                                                        <FaTrash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Order Items */}
                    <div className="bg-white rounded-lg border p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            Pesanan ({checkoutData.items?.length || 0})
                        </h2>

                        <div className="space-y-4">
                            {checkoutData.items?.map((item) => (
                                <div
                                    key={item.cart_id}
                                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex-shrink-0">
                                        <img
                                            src={
                                                typeof item.thumbnail ===
                                                    "string" &&
                                                item.thumbnail.includes(
                                                    "randoms"
                                                )
                                                    ? `${
                                                          ziggy.url
                                                      }/storage/${item.thumbnail.replace(
                                                          /^\/+/,
                                                          ""
                                                      )}`
                                                    : `${
                                                          ziggy.url
                                                      }/storage/thumbnails/${item.thumbnail?.replace(
                                                          /^\/+/,
                                                          ""
                                                      )}`
                                            }
                                            alt={item.name}
                                            onError={(e) => {
                                                e.currentTarget.src =
                                                    "/images/fallback-thumbnail.jpg";
                                            }}
                                            className="w-24 h-24 object-cover rounded-lg border shadow-sm"
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 space-y-1.5">
                                                <Link
                                                    href={getProductDetailUrl(item)}
                                                    className="font-semibold text-sm text-gray-900 hover:text-blue-600 transition-colors inline-flex items-center gap-1 group line-clamp-2"
                                                >
                                                    {item.name}
                                                    <FaExternalLinkAlt className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                                </Link>

                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {/* Type Badge */}
                                                    <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded font-medium">
                                                        {getTypeLabel(item.type)}
                                                    </span>

                                                    {/* Ticket Name */}
                                                    {item.type === "ticket" && item.ticket_name && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                                                            <FaTicketAlt className="w-2.5 h-2.5" />
                                                            {item.ticket_name}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Event Date - Compact */}
                                                {item.type === "ticket" && item.event_date && (
                                                    <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                                        <FaCalendarAlt className="w-3 h-3 flex-shrink-0" />
                                                        <span className="font-medium">{formatDate(item.event_date)}</span>
                                                    </div>
                                                )}

                                                {/* Rent Days - Compact */}
                                                {["service", "building", "property"].includes(item.type) && item.rent_days && (
                                                    <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                                                        <FaCalendarAlt className="w-3 h-3 flex-shrink-0" />
                                                        <span className="font-medium">{formatRentDays(item.rent_days)}</span>
                                                    </div>
                                                )}

                                                {/* Price Info */}
                                                <div className="text-xs text-gray-600">
                                                    Rp {formatRupiah(item.price)} × {item.quantity}
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="font-bold text-sm text-blue-600">
                                                    Rp {formatRupiah(item.price * item.quantity)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg border p-6 sticky top-4 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">
                            Ringkasan Pesanan
                        </h2>

                        <div className="space-y-3">
                            <div className="flex justify-between text-gray-600">
                                <span>
                                    Subtotal ({checkoutData.items?.length || 0}{" "}
                                    item)
                                </span>
                                <span className="font-medium">
                                    {formatRupiah(checkoutData.total || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Biaya Admin</span>
                                <span className="font-medium">
                                    {formatRupiah(0)}
                                </span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Pajak</span>
                                <span className="font-medium">
                                    {formatRupiah(0)}
                                </span>
                            </div>
                            <hr className="my-3" />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total Pembayaran</span>
                                <span className="text-blue-600">
                                    {formatRupiah(checkoutData.total || 0)}
                                </span>
                            </div>
                        </div>

                        <Button
                            className="w-full mt-6"
                            size="lg"
                            onClick={handlePayment}
                            disabled={
                                isProcessingPayment ||
                                !snapLoaded ||
                                (isAddressRequired && !selectedAddressId)
                            }
                        >
                            {isProcessingPayment ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Memproses...
                                </div>
                            ) : !snapLoaded ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Loading...
                                </div>
                            ) : (
                                <>
                                    <FaCreditCard className="w-4 h-4 mr-2" />
                                    Bayar Sekarang
                                </>
                            )}
                        </Button>

                        {isAddressRequired && !selectedAddressId && (
                            <p className="text-xs text-red-500 text-center mt-2">
                                Silakan pilih alamat pengiriman
                            </p>
                        )}

                        {!snapLoaded && (
                            <p className="text-xs text-gray-500 text-center mt-2">
                                Memuat sistem pembayaran...
                            </p>
                        )}

                        <div className="mt-4 text-xs text-gray-500 text-center space-y-1">
                            <p className="font-medium">
                                Pembayaran aman terpercaya
                            </p>
                            <p>Transfer Bank • E-Wallet • Kartu Kredit</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Address Modal */}
            <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingAddress ? "Edit Alamat" : "Tambah Alamat"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Label + Nama Penerima */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="label">Label Alamat</Label>
                                <Input
                                    id="label"
                                    value={addressForm.label}
                                    onChange={(e) =>
                                        setAddressForm((prev) => ({
                                            ...prev,
                                            label: e.target.value,
                                        }))
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
                                    value={addressForm.recipient_name}
                                    onChange={(e) =>
                                        setAddressForm((prev) => ({
                                            ...prev,
                                            recipient_name: e.target.value,
                                        }))
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
                                    value={addressForm.province}
                                    onChange={(e) =>
                                        setAddressForm((prev) => ({
                                            ...prev,
                                            province: e.target.value,
                                            city: "",
                                            district: "",
                                        }))
                                    }
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
                                    value={addressForm.city}
                                    onChange={(e) =>
                                        setAddressForm((prev) => ({
                                            ...prev,
                                            city: e.target.value,
                                        }))
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
                                value={addressForm.district}
                                onChange={(e) =>
                                    setAddressForm((prev) => ({
                                        ...prev,
                                        district: e.target.value,
                                    }))
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
                                value={addressForm.address_line}
                                onChange={(e) =>
                                    setAddressForm((prev) => ({
                                        ...prev,
                                        address_line: e.target.value,
                                    }))
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
                                    value={addressForm.postal_code}
                                    onChange={(e) =>
                                        setAddressForm((prev) => ({
                                            ...prev,
                                            postal_code: e.target.value,
                                        }))
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
                                    value={addressForm.phone}
                                    onChange={(e) =>
                                        setAddressForm((prev) => ({
                                            ...prev,
                                            phone: e.target.value,
                                        }))
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
                                value={addressForm.note}
                                onChange={(e) =>
                                    setAddressForm((prev) => ({
                                        ...prev,
                                        note: e.target.value,
                                    }))
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
                                checked={addressForm.is_default}
                                onCheckedChange={(checked) =>
                                    setAddressForm((prev) => ({
                                        ...prev,
                                        is_default: checked,
                                    }))
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
                            onClick={closeAddressModal}
                        >
                            Batal
                        </Button>
                        <Button type="button" onClick={saveAddress}>
                            Simpan Alamat
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
