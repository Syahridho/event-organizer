import { usePage, router, Head } from "@inertiajs/react";
import axios from "axios";
import { formatRupiah } from "@/Utils/formatRupiah";
import { useCallback, useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    FaArrowLeft,
    FaCreditCard,
    FaShoppingBag,
    FaMapMarkerAlt,
    FaTimes,
    FaPlus,
    FaEdit,
    FaTrash,
} from "react-icons/fa";
import { useMidtrans } from "@/hooks/usePaymentMidtrans";

export default function CheckoutPage() {
    const { checkoutData, ziggy, user } = usePage().props;
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
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

    const handleAddressFormChange = (field, value) => {
        setAddressForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleProvinceChange = (provinceId) => {
        setAddressForm((prev) => ({
            ...prev,
            province: provinceId,
            city: "",
            district: "",
        }));
        fetchCities(provinceId); // panggil API ambil kota
    };

    const handleCityChange = (cityId) => {
        setAddressForm((prev) => ({
            ...prev,
            city: cityId,
            district: "",
        }));
    };

    // Midtrans hook
    const { snapLoaded, paymentError, setPaymentError } = useMidtrans();

    const selectedAddress = useMemo(() => {
        return addresses.find((addr) => addr.id === selectedAddressId);
    }, [addresses, selectedAddressId]);

    // Memuat alamat pengguna
    const loadAddresses = async () => {
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
            alert("Gagal memuat alamat");
        }
    };

    // Membuka modal alamat
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

    // Menutup modal alamat
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

    // Simpan alamat
    const saveAddress = async () => {
        try {
            if (!addressForm.recipient_name.trim()) {
                alert("Nama penerima harus diisi");
                return;
            }
            if (!addressForm.address_line.trim()) {
                alert("Alamat lengkap harus diisi");
                return;
            }
            if (!addressForm.phone.trim()) {
                alert("Nomor telepon harus diisi");
                return;
            }
            if (!addressForm.province) {
                alert("Provinsi harus dipilih");
                return;
            }
            if (!addressForm.city) {
                alert("Kota harus dipilih");
                return;
            }

            let response;
            if (editingAddress) {
                response = await axios.put(
                    `/addresses/ajax/${editingAddress.id}`,
                    addressForm
                );
            } else {
                response = await axios.post(
                    "/addresses/ajax/store",
                    addressForm
                );
            }

            await loadAddresses();
            closeAddressModal();

            if (!editingAddress && !selectedAddressId) {
                setSelectedAddressId(response.data.data.id);
            }
        } catch (error) {
            console.error("Error saving address:", error);
            alert(
                "Gagal menyimpan alamat: " +
                    (error.response?.data?.message || error.message)
            );
        }
    };

    // Hapus alamat
    const deleteAddress = async (addressId) => {
        if (!confirm("Apakah Anda yakin ingin menghapus alamat ini?")) {
            return;
        }

        try {
            await axios.delete(`/addresses/ajax/${addressId}`);
            await loadAddresses();

            if (selectedAddressId === addressId) {
                setSelectedAddressId(null);
            }
        } catch (error) {
            console.error("Error deleting address:", error);
            alert("Gagal menghapus alamat");
        }
    };

    // Handle kembali ke keranjang
    const handleBackToCart = useCallback(() => {
        router.visit("/cart");
    }, []);

    const handlePayment = useCallback(
        async (e) => {
            if (e) e.preventDefault();

            if (checkoutData.total < 1000) {
                setPaymentError("Minimum pembayaran adalah Rp. 1.000");
                return;
            }

            if (!snapLoaded || !window.snap) {
                setPaymentError(
                    "Sistem pembayaran belum siap. Silakan refresh halaman."
                );
                return;
            }

            setPaymentError(null);
            setIsProcessingPayment(true);

            try {
                // Fungsi untuk mapping type frontend ke backend enum
                const mapItemType = (frontendType) => {
                    const typeMapping = {
                        ticket: "ticket",
                        service: "service",
                        building: "building",
                        property: "rent_property",
                    };
                    return typeMapping[frontendType] || "ticket";
                };

                // Prepare payment data
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

                // Tambahkan alamat jika ada yang dipilih
                console.log(selectedAddress);
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
                console.log("Payment Data:", paymentData);

                // Create payment transaction
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

                const { token: snapToken, order_id } = response.data;

                if (!snapToken) {
                    throw new Error("Token pembayaran tidak diterima");
                }

                // Open Midtrans payment popup
                window.snap.pay(snapToken, {
                    skipOrderSummary: false,
                    onSuccess: async (result) => {
                        console.log("Payment success:", result);
                        setIsProcessingPayment(false);

                        // Hapus cart setelah sukses
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
                    },
                    onPending: async (result) => {
                        console.log("Payment pending:", result);
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

                        router.visit("/purchase", {
                            method: "get",
                            // data: { order_id: result.order_id || order_id },
                            preserveState: false,
                        });
                    },
                    onError: (error) => {
                        console.error("Payment error:", error);
                        setIsProcessingPayment(false);
                        setPaymentError(
                            "Terjadi kesalahan dalam proses pembayaran. Silakan coba lagi."
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
                    "Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.";

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

                setPaymentError(errorMessage);
            }
        },
        [checkoutData, user, selectedAddress, snapLoaded]
    );

    // Memuat provinsi saat modal dibuka

    // Load user addresses
    useEffect(() => {
        loadAddresses();
    }, []);

    // Redirect jika tidak ada data checkout
    useEffect(() => {
        if (
            !checkoutData ||
            !checkoutData.items ||
            checkoutData.items.length === 0
        ) {
            alert(
                "Data checkout tidak ditemukan. Silakan pilih item dari keranjang."
            );
            router.visit("/cart");
        }
    }, [checkoutData]);

    // Show loading jika data belum ada
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

            {/* Payment Error Display */}
            {paymentError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                    <div className="flex items-center gap-2">
                        <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                        {paymentError}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Shipping Address Section */}
                    <div className="bg-white rounded-lg border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <FaMapMarkerAlt className="w-5 h-5 text-green-600" />
                                Alamat Pengiriman
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

                        {addresses.length === 0 ? (
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
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteAddress(
                                                            address.id
                                                        );
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-red-600"
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

                    {/* Order Items */}
                    <div className="bg-white rounded-lg border p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <FaShoppingBag className="w-5 h-5 text-green-600" />
                            Item Pesanan ({checkoutData.items?.length || 0})
                        </h2>

                        <div className="space-y-4">
                            {checkoutData.items?.map((item) => (
                                <div
                                    key={item.cart_id}
                                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-md"
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
                                            className="w-16 h-16 object-cover rounded-md border"
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900">
                                            {item.name}
                                        </h4>
                                        {item.type && (
                                            <p className="text-sm text-gray-500">
                                                {item.type}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-sm text-gray-600">
                                                {formatRupiah(item.price)} ×{" "}
                                                {item.quantity}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right font-semibold">
                                        Rp.{" "}
                                        {formatRupiah(
                                            item.price * item.quantity
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg border p-6 sticky top-4">
                        <h2 className="text-lg font-semibold mb-4">
                            Ringkasan Pesanan
                        </h2>

                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span>
                                    Subtotal ({checkoutData.items?.length || 0}{" "}
                                    item)
                                </span>
                                <span>
                                    Rp. {formatRupiah(checkoutData.total || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Biaya Admin</span>
                                <span>Rp. {formatRupiah(0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Pajak</span>
                                <span>Rp. {formatRupiah(0)}</span>
                            </div>
                            <hr className="my-3" />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total Pembayaran</span>
                                <span className="text-blue-600">
                                    Rp. {formatRupiah(checkoutData.total || 0)}
                                </span>
                            </div>
                        </div>

                        <Button
                            className="w-full mt-6"
                            size="lg"
                            onClick={handlePayment}
                            disabled={isProcessingPayment || !snapLoaded}
                        >
                            {isProcessingPayment ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Memproses Pembayaran...
                                </div>
                            ) : !snapLoaded ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Memuat Sistem Pembayaran...
                                </div>
                            ) : (
                                <>
                                    <FaCreditCard className="w-4 h-4 mr-2" />
                                    Bayar Sekarang
                                </>
                            )}
                        </Button>

                        {!snapLoaded && (
                            <p className="text-xs text-gray-500 text-center mt-2">
                                Memuat sistem pembayaran Midtrans...
                            </p>
                        )}

                        <div className="mt-4 text-xs text-gray-500 text-center">
                            <p>Pembayaran aman dengan Midtrans</p>
                            <p>
                                Support: Transfer Bank, E-Wallet, Kartu Kredit
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Address Modal */}
            {showAddressModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-lg font-semibold">
                                {editingAddress
                                    ? "Edit Alamat"
                                    : "Tambah Alamat"}
                            </h3>
                            <button
                                onClick={closeAddressModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <FaTimes className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Label + Nama Penerima */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Label Alamat
                                    </label>
                                    <input
                                        type="text"
                                        value={addressForm.label}
                                        onChange={(e) =>
                                            handleAddressFormChange(
                                                "label",
                                                e.target.value
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Rumah, Kantor, dll."
                                        maxLength={255}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nama Penerima *
                                    </label>
                                    <input
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

                            {/* Provinsi + Kota */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Provinsi
                                    </label>
                                    <input
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Kota / Kabupaten
                                    </label>
                                    <input
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

                            {/* Kecamatan */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Kecamatan
                                </label>
                                <input
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Alamat Lengkap *
                                </label>
                                <textarea
                                    value={addressForm.address_line}
                                    onChange={(e) =>
                                        handleAddressFormChange(
                                            "address_line",
                                            e.target.value
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Jl. Contoh No. 123, RT/RW, Kelurahan"
                                    rows={3}
                                    maxLength={500}
                                    required
                                />
                            </div>

                            {/* Kode Pos + Nomor HP */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Kode Pos
                                    </label>
                                    <input
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nomor Telepon *
                                    </label>
                                    <input
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

                            {/* Catatan */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Catatan Tambahan
                                </label>
                                <textarea
                                    value={addressForm.note}
                                    onChange={(e) =>
                                        handleAddressFormChange(
                                            "note",
                                            e.target.value
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Patokan, instruksi khusus, dll."
                                    rows={2}
                                    maxLength={500}
                                />
                            </div>

                            {/* Default */}
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
                                <label
                                    htmlFor="is_default"
                                    className="text-sm text-gray-700"
                                >
                                    Jadikan alamat default
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeAddressModal}
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                onClick={saveAddress}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Simpan Alamat
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
