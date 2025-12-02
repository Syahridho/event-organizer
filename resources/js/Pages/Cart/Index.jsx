import { usePage, router, Head, Link } from "@inertiajs/react";
import axios from "axios";
import React, {
    useEffect,
    useMemo,
    useCallback,
    useRef,
    useState,
    Suspense,
    lazy,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {  XCircle, ChevronLeft } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
    updateCartQuantity,
    removeFromCart,
    removeBulkFromCart,
    setCartItems,
    selectCartItems,
} from "@/Store/cartSlice";
import { ErrorBoundary } from "react-error-boundary";
import MainLayout from "@/Layouts/Main";
import { toast } from "sonner";
import { checkItemStatus } from "@/Utils/cartUtils.jsx";
import CartSkeleton from "./Partials/CartSkeleton";

// Lazy load components
const CartItem = lazy(() => import("./Partials/CartItem"));
const CartSummary = lazy(() => import("./Partials/CartSummary"));

const ErrorFallback = ({ error }) => (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="max-w-md mx-4">
            <CardContent className="pt-6">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        Terjadi Kesalahan
                    </h3>
                    <p className="text-sm text-gray-600">{error.message}</p>
                    <Button
                        onClick={() => window.location.reload()}
                        className="w-full"
                    >
                        Coba Lagi
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
);

export default function CartPage({ carts: serverCarts, taxInfo }) {
    const { ziggy } = usePage().props;
    const dispatch = useDispatch();
    const cartItems = useSelector(selectCartItems);

    // Sync server data to Redux
    useEffect(() => {
        if (serverCarts) {
            dispatch(setCartItems(serverCarts));
        }
    }, [serverCarts, dispatch]);

    const [selectedItems, setSelectedItems] = useState(new Set());
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const updateQueue = useRef(new Map());
    const isProcessing = useRef(false);

    const safeCartItems = useMemo(
        () => (Array.isArray(cartItems) ? cartItems : []),
        [cartItems]
    );

    // Separate items by status
    const { validItems, disabledItems } = useMemo(() => {
        const valid = [];
        const disabled = [];

        safeCartItems.forEach((item) => {
            const status = checkItemStatus(item);
            if (status.disabled) {
                disabled.push({ ...item, statusInfo: status });
            } else {
                valid.push(item);
            }
        });

        return { validItems: valid, disabledItems: disabled };
    }, [safeCartItems]);

    const processQueue = useCallback(async () => {
        if (isProcessing.current || updateQueue.current.size === 0) return;

        isProcessing.current = true;
        const updates = Array.from(updateQueue.current.entries());
        updateQueue.current.clear();

        try {
            await Promise.all(
                updates.map(([cartId, qty]) =>
                    axios
                        .put(`/cart/${cartId}`, { item_qty: qty })
                        .catch((err) => {
                            console.error(
                                `Failed to update cart ${cartId}:`,
                                err
                            );
                            if (err.response?.status === 409) {
                                const errorData = err.response.data;
                                toast.error(
                                    errorData.error === "INSUFFICIENT_QUOTA"
                                        ? errorData.message
                                        : "Item tidak tersedia"
                                );
                            }
                            // Rollback
                            const original = safeCartItems.find(
                                (item) => item.id === cartId
                            );
                            if (original) {
                                dispatch(
                                    updateCartQuantity({
                                        cart_id: cartId,
                                        quantity: original.item_qty,
                                    })
                                );
                            }
                        })
                )
            );
        } finally {
            isProcessing.current = false;
            if (updateQueue.current.size > 0) {
                setTimeout(processQueue, 300);
            }
        }
    }, [safeCartItems, dispatch]);

    const handleQtyChange = useCallback(
        (cartId, newQty) => {
            if (newQty < 1) return;

            const item = safeCartItems.find((i) => i.id === cartId);
            if (item) {
                const status = checkItemStatus(item);
                if (
                    status.disabled &&
                    !["ticket_sold", "event_banned", "already_booked_by_me"].includes(status.type)
                ) {
                    toast.error(status.reason);
                    return;
                }
                if (status.type === "ticket_sold")
                    toast.warning("Tiket sudah habis terjual. Silakan hapus.");
                if (status.type === "event_banned")
                    toast.warning("Event ini dilarang. Silakan hapus.");
                if (status.type === "already_booked_by_me")
                    toast.warning("Item ini sudah dibooking. Silakan hapus.");
            }

            dispatch(updateCartQuantity({ cart_id: cartId, quantity: newQty }));
            updateQueue.current.set(cartId, newQty);
            setTimeout(() => processQueue(), 500);
        },
        [processQueue, safeCartItems, dispatch]
    );

    const handleDeleteCart = useCallback(
        async (cartId) => {
            const originalCarts = [...safeCartItems];
            dispatch(removeFromCart({ cart_id: cartId }));
            setSelectedItems((prev) => {
                const newSet = new Set(prev);
                newSet.delete(cartId);
                return newSet;
            });
            updateQueue.current.delete(cartId);

            try {
                await axios.delete(`/cart/${cartId}`);
                toast.success("Item berhasil dihapus");
                router.reload({ only: ["carts"], preserveScroll: true, preserveState: true });
        } catch (error) {
                dispatch(setCartItems(originalCarts));
                toast.error("Gagal menghapus item");
            }
        },
        [safeCartItems, dispatch]
    );

    const handleSelectItem = useCallback(
        (cartId) => {
            const item = safeCartItems.find((i) => i.id === cartId);
            if (item) {
                const status = checkItemStatus(item);
                if (
                    status.disabled &&
                    !["ticket_sold", "event_banned", "already_booked_by_me"].includes(status.type)
                ) {
                    toast.error(status.reason);
                    return;
                }
            }

            setSelectedItems((prev) => {
                const newSet = new Set(prev);
                newSet.has(cartId) ? newSet.delete(cartId) : newSet.add(cartId);
                return newSet;
            });
        },
        [safeCartItems]
    );

    const handleSelectAll = useCallback(() => {
        setSelectedItems((prev) => {
            if (prev.size === validItems.length && validItems.length > 0) {
                return new Set();
            } else {
                return new Set(validItems.map((item) => item.id));
            }
        });
    }, [validItems]);

    const handleBulkDelete = useCallback(
        async (items) => {
            const itemIds = items.map((item) => item.id);
            const originalCarts = [...safeCartItems];
            dispatch(removeBulkFromCart({ cart_ids: itemIds }));
            setSelectedItems((prev) => {
                const newSet = new Set(prev);
                itemIds.forEach((id) => newSet.delete(id));
                return newSet;
            });

            try {
                await Promise.all(itemIds.map((id) => axios.delete(`/cart/${id}`)));
                toast.success(`${items.length} item berhasil dihapus`);
                router.reload({ only: ["carts"], preserveScroll: true, preserveState: true });
            } catch (error) {
                dispatch(setCartItems(originalCarts));
                toast.error("Gagal menghapus beberapa item");
            }
        },
        [safeCartItems, dispatch]
    );

    const selectedCartItems = useMemo(
        () => validItems.filter((item) => selectedItems.has(item.id)),
        [validItems, selectedItems]
    );

    const selectedTotal = useMemo(
        () =>
            selectedCartItems.reduce(
                (sum, item) => sum + (item.item?.price || 0) * (item.item_qty || 0),
                0
            ),
        [selectedCartItems]
    );

    const taxAmount = useMemo(() => {
        if (!taxInfo) return 0;
        return taxInfo.type === "percent"
            ? Math.round(selectedTotal * (taxInfo.value / 100))
            : parseFloat(taxInfo.value);
    }, [taxInfo, selectedTotal]);

    const totalWithTax = useMemo(() => selectedTotal + taxAmount, [selectedTotal, taxAmount]);

    const handleCheckout = useCallback(() => {
        if (selectedItems.size === 0) {
            toast.error("Pilih minimal satu item untuk checkout");
            return;
        }

        setIsCheckingOut(true);

        const checkoutData = {
            cart_ids: Array.from(selectedItems),
            items: selectedCartItems.map((item) => ({
                cart_id: item.id,
                id: item.item_id,
                name: item.type === "ticket" ? item.item?.event.name : item.item?.name,
                ticket_name: item.type === "ticket" ? item.item?.name : null,
                type: item.type,
                price: item.item?.price,
                quantity: item.item_qty,
                rent_days: item.rent_days || null,
                delivery_type: item?.delivery_type || null,
                is_unavailable: item.is_unavailable || false,
                thumbnail: item?.item?.event?.thumbnail?.includes("default-event-images")
                    ? item?.item?.event?.thumbnail?.replace(/^\/+/, "")
                    : item?.type === "ticket"
                    ? item?.item?.event?.thumbnail?.replace(/^\/+/, "")
                    : item?.item?.thumbnail?.replace(/^\/+/, ""),
            })),
            total: selectedTotal,
        };

        router.visit("/checkout", {
            method: "post",
            data: checkoutData,
            onError: (errors) => {
                console.error("Checkout error:", errors);
                toast.error(errors.message || "Terjadi kesalahan saat checkout");
            },
            onFinish: () => setIsCheckingOut(false),
        });
    }, [selectedItems, selectedCartItems, selectedTotal]);

    // Auto-refresh cart
    useEffect(() => {
        const intervalId = setInterval(() => {
            router.reload({ only: ["carts"], preserveScroll: true, preserveState: true });
        }, 10000);
        return () => clearInterval(intervalId);
    }, []);



    // Auto-remove disabled items from selection
    useEffect(() => {
        setSelectedItems((prev) => {
            const newSet = new Set(prev);
            let changed = false;
            disabledItems.forEach((item) => {
                if (newSet.has(item.id)) {
                    newSet.delete(item.id);
                    changed = true;
                }
            });
            return changed ? newSet : prev;
        });
    }, [disabledItems]);

    const handleDeliveryChange = useCallback(
        async (cartId, deliveryType) => {
            try {
                const response = await axios.post("/cart/update-delivery-type", {
                    cart_id: cartId,
                    delivery_type: deliveryType,
                });

                if (response.data.success) {
                    const item = safeCartItems.find((i) => i.id === cartId);
                    if (item) {
                        dispatch(
                            updateCartQuantity({
                                cart_id: cartId,
                                quantity: item.item_qty,
                                delivery_type: deliveryType,
                            })
                        );
                    }
                    toast.success("Pilihan pengiriman diperbarui");
                }
            } catch (error) {
                console.error("Failed to update delivery option:", error);
                toast.error("Gagal memperbarui pilihan pengiriman");
            }
        },
        [safeCartItems, dispatch]
    );

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 300);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return (
            <MainLayout>
                <div className="container mx-auto px-4 py-8">
                    <CartSkeleton />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <Head title="Keranjang Belanja" />
            <div className="min-h-screen bg-gray-50/50">
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ChevronLeft className="w-6 h-6" />
                            </Button>
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900">Keranjang Belanja</h1>
                    </div>

                    <ErrorBoundary FallbackComponent={ErrorFallback}>
                        <Suspense fallback={<CartSkeleton />}>
                            {safeCartItems.length === 0 ? (
                                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <ChevronLeft className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                        Keranjang Anda Kosong
                                    </h2>
                                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                                        Sepertinya Anda belum menambahkan item apapun. Yuk mulai jelajahi layanan kami!
                                    </p>
                                    <Link href="/">
                                        <Button size="lg" className="rounded-full px-8">
                                            Mulai Belanja
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-6">
                                        {/* Header Selection */}
                                        <Card className="border-gray-200 shadow-sm">
                                            <CardHeader className="py-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <Checkbox
                                                            checked={
                                                                selectedItems.size === validItems.length &&
                                                                validItems.length > 0
                                                            }
                                                            onCheckedChange={handleSelectAll}
                                                            disabled={validItems.length === 0}
                                                        />
                                                        <span className="font-medium text-gray-700">
                                                            Pilih Semua ({validItems.length})
                                                        </span>
                                                    </div>
                                                    {selectedItems.size > 0 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() =>
                                                                handleBulkDelete(
                                                                    safeCartItems.filter((i) =>
                                                                        selectedItems.has(i.id)
                                                                    )
                                                                )
                                                            }
                                                        >
                                                            Hapus Dipilih
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardHeader>
                                        </Card>

                                        {/* Valid Items */}
                                        <Card className="border-gray-200 shadow-sm overflow-hidden">
                                            <CardContent className="p-0">
                                                
                                                    {validItems.map((item) => (
                                                        <CartItem
                                                            key={item.id}
                                                            item={item}
                                                            isSelected={selectedItems.has(item.id)}
                                                            onSelect={handleSelectItem}
                                                            onQtyChange={handleQtyChange}
                                                            onDelete={handleDeleteCart}
                                                            onDeliveryChange={handleDeliveryChange}
                                                            baseUrl={ziggy.url}
                                                        />
                                                    ))}
                                                    {validItems.length === 0 && (
                                                        <div className="p-8 text-center text-gray-500">
                                                            Tidak ada item yang tersedia
                                                        </div>
                                                    )}
                                                
                                            </CardContent>
                                        </Card>

                                        {/* Disabled Items */}
                                        {disabledItems.length > 0 && (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-semibold text-gray-900">
                                                        Item Tidak Tersedia ({disabledItems.length})
                                                    </h3>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600"
                                                        onClick={() => handleBulkDelete(disabledItems)}
                                                    >
                                                        Hapus Semua
                                                    </Button>
                                                </div>
                                                <Card className="border-gray-200 shadow-sm bg-gray-50">
                                                    <CardContent className="p-0">
                                                        {disabledItems.map((item) => (
                                                            <CartItem
                                                                key={item.id}
                                                                item={item}
                                                                isSelected={selectedItems.has(item.id)}
                                                                onSelect={handleSelectItem}
                                                                onQtyChange={handleQtyChange}
                                                                onDelete={handleDeleteCart}
                                                                onDeliveryChange={handleDeliveryChange}
                                                                baseUrl={ziggy.url}
                                                            />
                                                        ))}
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        )}
                                    </div>

                                    {/* Summary */}
                                    <CartSummary
                                        selectedCount={selectedItems.size}
                                        subtotal={selectedTotal}
                                        taxAmount={taxAmount}
                                        totalWithTax={totalWithTax}
                                        taxInfo={taxInfo}
                                        onCheckout={handleCheckout}
                                        isCheckingOut={isCheckingOut}
                                    />
                                </div>
                            )}
                        </Suspense>
                    </ErrorBoundary>
                </div>
            </div>
        </MainLayout>
    );
}
