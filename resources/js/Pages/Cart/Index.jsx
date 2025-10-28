import { usePage, router, Head, Link } from "@inertiajs/react";
import axios from "axios";
import { formatRupiah } from "@/Utils/formatRupiah";
import React, {
    useEffect,
    useMemo,
    useCallback,
    useRef,
    useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
    Trash2,
    Calendar,
    Minus,
    Plus,
    AlertCircle,
    ShoppingCart,
    Clock,
    XCircle,
    ChevronLeft,
    Package,
    Wrench,
    Building2,
    Home,
    Ticket,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
    addToCart,
    updateCartQuantity,
    removeFromCart,
    removeBulkFromCart,
    setCartItems,
    selectCartItems,
} from "@/Store/cartSlice";
import { ErrorBoundary } from "react-error-boundary";
import MainLayout from "@/Layouts/Main";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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

// OPTIMIZED: Format date without timezone conversion to prevent date shift
const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
        // Parse YYYY-MM-DD directly without timezone manipulation
        const [year, month, day] = dateString.split("T")[0].split("-");
        const date = new Date(year, month - 1, day);

        return date.toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    } catch (e) {
        console.error("Error formatting date:", e, dateString);
        return dateString;
    }
};

const TYPE_LABELS = {
    ticket: "Tiket Event",
    service: "Jasa",
    building: "Gedung",
    property: "Properti",
};

const TYPE_COLORS = {
    ticket: "bg-purple-100 text-purple-700 border-purple-200",
    service: "bg-blue-100 text-blue-700 border-blue-200",
    building: "bg-green-100 text-green-700 border-green-200",
    property: "bg-orange-100 text-orange-700 border-orange-200",
};

const getTypeLabel = (type) => TYPE_LABELS[type] || type;
const getTypeColor = (type) =>
    TYPE_COLORS[type] || "bg-gray-100 text-gray-700 border-gray-200";

const getTypeIcon = (type) => {
    const TYPE_ICONS = {
        ticket: Ticket,
        service: Wrench,
        building: Building2,
        property: Home,
    };
    return TYPE_ICONS[type] || Package;
};

const getDetailUrl = (type, eventId, itemId) => {
    const urlMap = {
        ticket: `/events/${eventId}`,
        service: `/services/${itemId}`,
        building: `/buildings/${itemId}`,
        property: `/propertys/${itemId}`,
    };
    return urlMap[type] || "#";
};

/**
 * COMPLEX LOGIC: Check item availability status with multiple validation rules
 *
 * Rules:
 * 1. Sold Out Detection: Check if item.is_sold_out is true
 * 2. Booked by Other User: Check if item.is_booked_by_other is true (for service/building/property)
 * 3. Rent Date Expiry: For rentable items (service/building/property), check if rent_date has passed
 * 4. Ticket Date Validation: For tickets, check both event end date and ticket sales end date
 * 5. Backend Unavailability: Check if item.is_unavailable flag is set
 */
const checkItemStatus = (item) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Rule 1: Sold Out Detection
    if (item.is_sold_out || item.item?.is_sold_out) {
        return {
            disabled: true,
            reason: "Item ini sudah habis terjual",
            type: "sold_out",
            severity: "error",
        };
    }

    // Rule 2: Booked by Other User (NEW RULE)
    if (
        item.is_booked_by_other &&
        ["service", "building", "property"].includes(item.type)
    ) {
        return {
            disabled: true,
            reason: "Tanggal ini sudah dibooking oleh user lain. Silakan hapus atau pilih tanggal lain.",
            type: "booked_by_other",
            severity: "error",
        };
    }

    // Rule 3: Backend Unavailability Flag
    if (item.is_unavailable == "unavailable") {
        if (item.type === "ticket") {
            return {
                disabled: true,
                reason: "Kuota tiket sudah habis atau tidak mencukupi",
                type: "unavailable",
                severity: "error",
            };
        } else {
            return {
                disabled: true,
                reason: "Tanggal ini sudah dibooking oleh orang lain",
                type: "booked",
                severity: "error",
            };
        }
    }

    // Rule 4: Rent Date Expiry for Rentable Items
    if (
        ["service", "building", "property"].includes(item.type) &&
        item.rent_days
    ) {
        const rentDate = new Date(item.rent_days);
        rentDate.setHours(0, 0, 0, 0);

        if (rentDate < now) {
            return {
                disabled: true,
                reason: "Tanggal sewa sudah terlewat. Silakan pilih tanggal baru.",
                type: "rent_expired",
                severity: "warning",
            };
        }
    }

    // Rule 5: Ticket Date Validation
    if (item.type === "ticket" && item.item?.event) {
        const event = item.item.event;

        // Check event end date
        const eventDateEnd = event.event_date_end
            ? new Date(event.event_date_end)
            : null;

        // Check ticket sales end date
        const ticketDateEnd = event.ticket_date_end
            ? new Date(event.ticket_date_end)
            : null;

        if (eventDateEnd) {
            eventDateEnd.setHours(23, 59, 59, 999);
            if (eventDateEnd < now) {
                return {
                    disabled: true,
                    reason: "Event sudah berakhir",
                    type: "event_ended",
                    severity: "error",
                };
            }
        }

        if (ticketDateEnd) {
            ticketDateEnd.setHours(23, 59, 59, 999);
            if (ticketDateEnd < now) {
                return {
                    disabled: true,
                    reason: "Periode penjualan tiket sudah berakhir",
                    type: "sales_ended",
                    severity: "error",
                };
            }
        }
    }

    return { disabled: false, reason: null, type: null, severity: null };
};

/**
 * Get severity icon component based on status
 */
const getSeverityIcon = (severity) => {
    switch (severity) {
        case "error":
            return <XCircle className="w-4 h-4" />;
        case "warning":
            return <AlertCircle className="w-4 h-4" />;
        default:
            return <AlertCircle className="w-4 h-4" />;
    }
};

/**
 * Get severity color classes
 */
const getSeverityColors = (severity) => {
    switch (severity) {
        case "error":
            return {
                bg: "bg-red-50",
                border: "border-red-200",
                text: "text-red-900",
                icon: "text-red-600",
            };
        case "warning":
            return {
                bg: "bg-amber-50",
                border: "border-amber-200",
                text: "text-amber-900",
                icon: "text-amber-600",
            };
        default:
            return {
                bg: "bg-gray-50",
                border: "border-gray-200",
                text: "text-gray-900",
                icon: "text-gray-600",
            };
    }
};

export default function CartPage({ carts: serverCarts, taxInfo }) {
    const { ziggy } = usePage().props;
    const dispatch = useDispatch();

    // OPTIMIZED: Use Redux store as single source of truth
    // Redux with normalized state provides O(1) access/delete/update
    const cartItems = useSelector(selectCartItems);

    // CRITICAL: Sync server data to Redux on mount and when server data changes
    useEffect(() => {
        if (serverCarts) {
            dispatch(setCartItems(serverCarts));
        }
    }, [serverCarts, dispatch]);

    console.log("Cart Items from Redux Store:", cartItems);

    const [selectedItems, setSelectedItems] = useState(new Set());
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const updateQueue = useRef(new Map());
    const isProcessing = useRef(false);

    const safeCartItems = Array.isArray(cartItems) ? cartItems : [];

    // Separate items by status with detailed categorization
    const { validItems, disabledItems, itemsByStatus } = useMemo(() => {
        const valid = [];
        const disabled = [];
        const statusGroups = {
            sold_out: [],
            unavailable: [],
            booked: [],
            booked_by_other: [],
            rent_expired: [],
            event_ended: [],
            sales_ended: [],
        };

        safeCartItems.forEach((item) => {
            const status = checkItemStatus(item);
            if (status.disabled) {
                disabled.push({ ...item, statusInfo: status });
                if (status.type && statusGroups[status.type]) {
                    statusGroups[status.type].push(item);
                }
            } else {
                valid.push(item);
            }
        });

        return {
            validItems: valid,
            disabledItems: disabled,
            itemsByStatus: statusGroups,
        };
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
                                if (errorData.error === "INSUFFICIENT_QUOTA") {
                                    toast.error(errorData.message);
                                } else {
                                    toast.error("Item tidak tersedia");
                                }
                            }

                            // ROLLBACK: Restore original quantity on error using Redux
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
                if (status.disabled) {
                    toast.error(status.reason);
                    return;
                }
            }

            // OPTIMIZED: Update Redux state instantly (O(1) access)
            dispatch(
                updateCartQuantity({
                    cart_id: cartId,
                    quantity: newQty,
                })
            );

            updateQueue.current.set(cartId, newQty);

            setTimeout(() => {
                processQueue();
            }, 500);
        },
        [processQueue, safeCartItems, dispatch]
    );

    const handleDeleteCart = useCallback(
        async (cartId) => {
            // Save original carts for rollback
            const originalCarts = [...safeCartItems];

            // OPTIMIZED: Optimistic update using Redux (O(1) delete)
            dispatch(removeFromCart({ cart_id: cartId }));

            // Remove from selection instantly
            setSelectedItems((prev) => {
                const newSet = new Set(prev);
                newSet.delete(cartId);
                return newSet;
            });

            // Clear from update queue
            updateQueue.current.delete(cartId);

            try {
                // Send delete request to backend
                await axios.delete(`/cart/${cartId}`);
                toast.success("Item berhasil dihapus dari keranjang");

                // CRITICAL FIX: Reload cart from server to ensure sync
                // This prevents race condition with auto-refresh
                router.reload({
                    only: ["carts"],
                    preserveScroll: true,
                    preserveState: true,
                });
            } catch (error) {
                // ROLLBACK: Restore original data if failed
                dispatch(setCartItems(originalCarts));
                toast.error("Gagal menghapus item");
                console.error(error);
            }
        },
        [safeCartItems, dispatch]
    );

    const handleSelectItem = useCallback(
        (cartId) => {
            const item = safeCartItems.find((i) => i.id === cartId);
            if (item) {
                const status = checkItemStatus(item);
                if (status.disabled) {
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

            // Save original cart for rollback
            const originalCarts = [...safeCartItems];

            // OPTIMIZED: Optimistic update using Redux bulk remove (O(k))
            dispatch(removeBulkFromCart({ cart_ids: itemIds }));

            // Remove all from selection instantly
            setSelectedItems((prev) => {
                const newSet = new Set(prev);
                itemIds.forEach((id) => newSet.delete(id));
                return newSet;
            });

            try {
                // Send bulk delete request
                await Promise.all(
                    itemIds.map((id) => axios.delete(`/cart/${id}`))
                );
                toast.success(
                    `${items.length} item berhasil dihapus dari keranjang`
                );

                // CRITICAL FIX: Reload cart from server to ensure sync
                // This prevents race condition with auto-refresh
                router.reload({
                    only: ["carts"],
                    preserveScroll: true,
                    preserveState: true,
                });
            } catch (error) {
                // ROLLBACK: Restore original data if failed
                dispatch(setCartItems(originalCarts));
                toast.error("Gagal menghapus beberapa item");
                console.error(error);
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
                (sum, item) =>
                    sum + (item.item?.price || 0) * (item.item_qty || 0),
                0
            ),
        [selectedCartItems]
    );

    // OPTIMIZED: Calculate tax dynamically using taxInfo from backend (O(1) complexity)
    const taxAmount = useMemo(() => {
        if (!taxInfo || !selectedTotal) return 0;

        if (taxInfo.type === "percent") {
            // Percentage-based tax (e.g., 11% = 0.11 * subtotal)
            return Math.round(selectedTotal * (taxInfo.value / 100));
        } else {
            // Fixed tax amount
            return taxInfo.value;
        }
    }, [taxInfo, selectedTotal]);

    const totalWithTax = useMemo(() => {
        return selectedTotal + taxAmount;
    }, [selectedTotal, taxAmount]);

    const handleCheckout = useCallback(async () => {
        if (selectedItems.size === 0) {
            toast.error("Pilih minimal satu item untuk checkout");
            return;
        }

        setIsCheckingOut(true);

        console.log(selectedCartItems);

        try {
            console.log(selectedCartItems);
            const checkoutData = {
                cart_ids: Array.from(selectedItems),
                items: selectedCartItems.map((item) => ({
                    cart_id: item.id,
                    id: item.item_id,
                    name: item.item?.name,
                    ticket_name:
                        item.type === "ticket" ? item.item?.name : null,
                    type: item.type,
                    price: item.item?.price,
                    quantity: item.item_qty,
                    rent_days: item.rent_days || null,
                    delivery_type: item?.delivery_type || null,
                    is_unavailable: item.is_unavailable || false,
                    thumbnail: item?.item?.event?.thumbnail?.includes("randoms")
                        ? item?.item?.event?.thumbnail?.replace(/^\/+/, "")
                        : item?.type === "ticket"
                        ? item?.item?.event?.thumbnail?.replace(/^\/+/, "")
                        : item?.item?.thumbnail?.replace(/^\/+/, ""),
                })),
                total: selectedTotal,
            };
            console.log(checkoutData);

            router.visit("/checkout", {
                method: "post",
                data: checkoutData,
                onError: (errors) => {
                    console.error("Checkout error:", errors);
                    toast.error(
                        errors.message ||
                            "Terjadi kesalahan saat menuju halaman checkout"
                    );
                },
                onFinish: () => setIsCheckingOut(false),
            });
        } catch (error) {
            console.error("Checkout error:", error);
            toast.error("Terjadi kesalahan saat checkout");
            setIsCheckingOut(false);
        }
    }, [selectedItems, selectedCartItems, selectedTotal]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, []);

    // CRITICAL: Auto-refresh cart every 10 seconds to check sold-out status
    // This ensures real-time sold-out detection when another user books the same item
    useEffect(() => {
        const intervalId = setInterval(() => {
            // Silently fetch updated cart data from server
            router.reload({
                only: ["carts"],
                preserveScroll: true,
                preserveState: true,
            });
        }, 10000); // Refresh every 10 seconds

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        return () => {
            if (updateQueue.current.size > 0) {
                processQueue();
            }
        };
    }, [processQueue]);

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
    const renderCartItem = useCallback(
        (item) => {
            const status = checkItemStatus(item);
            const colors = status.severity
                ? getSeverityColors(status.severity)
                : null;

            // --- Asumsi getThumbnailSrc tersedia di sini ---
            const getThumbnailSrc = (cartItem) => {
                const thumbnailPath =
                    cartItem.type === "ticket"
                        ? cartItem.item?.event?.thumbnail
                        : cartItem.item?.thumbnail;

                if (!thumbnailPath) {
                    return `https://placehold.co/96x96/e5e7eb/7f8388?text=${(
                        cartItem.type || "I"
                    )
                        .charAt(0)
                        .toUpperCase()}`;
                }

                // Logika untuk menangani path yang mungkin sudah lengkap atau perlu penambahan
                const path = thumbnailPath.replace(/^\/+/, "");
                if (path.includes("randoms") || path.includes("storage")) {
                    return `${ziggy.url}/${path}`;
                }
                return `${ziggy.url}/storage/thumbnails/${path}`;
            };

            const thumbnailUrl = getThumbnailSrc(item);
            // ----------------------------------------------------

            return (
                <Card
                    key={item.id}
                    className={`transition-all duration-300 hover:shadow-lg ${
                        status.disabled
                            ? "opacity-70 bg-gray-50/50"
                            : "hover:border-primary/50"
                    }`}
                >
                    <CardContent className="p-4 md:p-6">
                        <div className="flex items-start gap-4">
                            <Checkbox
                                checked={selectedItems.has(item.id)}
                                onCheckedChange={() =>
                                    handleSelectItem(item.id)
                                }
                                disabled={status.disabled}
                                className="mt-1 flex-shrink-0"
                            />

                            {/* Image Section (KODE DIPERSINGKAT MENGGUNAKAN thumbnailUrl) */}
                            <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 border-gray-200">
                                <img
                                    src={thumbnailUrl}
                                    alt={item.item?.name || "Item"}
                                    onError={(e) => {
                                        e.currentTarget.src = `https://placehold.co/96x96/e5e7eb/7f8388?text=${(
                                            item.type || "I"
                                        )
                                            .charAt(0)
                                            .toUpperCase()}`;
                                    }}
                                    className="w-full h-full object-cover"
                                />
                                {status.disabled && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <XCircle className="w-8 h-8 text-white" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={getDetailUrl(
                                                item.type,
                                                item.type === "ticket"
                                                    ? item.item?.event_id
                                                    : null,
                                                item.item_id
                                            )}
                                            className="font-semibold text-base md:text-lg capitalize hover:text-primary transition-colors block line-clamp-2"
                                        >
                                            {item.type === "ticket"
                                                ? `${item.item?.event?.name} - ${item.item?.name}`
                                                : item.item?.name}
                                        </Link>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <Badge
                                                variant="outline"
                                                className={`capitalize ${getTypeColor(
                                                    item.type
                                                )}`}
                                            >
                                                {React.createElement(
                                                    getTypeIcon(item.type),
                                                    {
                                                        className:
                                                            "w-3 h-3 mr-1",
                                                    }
                                                )}
                                                {getTypeLabel(item.type)}
                                            </Badge>
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            handleDeleteCart(item.id)
                                        }
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0 h-9 w-9"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Status Alert */}
                                {status.disabled && colors && (
                                    <Alert
                                        className={`mb-3 ${colors.bg} ${colors.border}`}
                                    >
                                        <div className={colors.icon}>
                                            {getSeverityIcon(status.severity)}
                                        </div>
                                        <AlertDescription
                                            className={`${colors.text} font-medium text-sm`}
                                        >
                                            {status.reason}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Rent Date Info */}
                                {item.rent_days &&
                                    [
                                        "service",
                                        "building",
                                        "property",
                                    ].includes(item.type) &&
                                    !status.disabled && (
                                        <div className="flex items-center gap-2 mb-3 text-sm bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                                            <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                            <span className="font-medium text-blue-900">
                                                Tanggal Sewa:{" "}
                                                {formatDate(item.rent_days)}
                                            </span>
                                        </div>
                                    )}

                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    {item.type !== "property" && (
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-500 mb-1">
                                                    Harga Satuan
                                                </span>
                                                <span className="text-lg md:text-xl font-bold text-primary">
                                                    Rp{" "}
                                                    {formatRupiah(
                                                        item.item?.price || 0
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* FASTEST ALGORITHM: Simplified Delivery Options (KODE BARU) */}
                                    {item.type === "property" &&
                                        !status.disabled && (
                                            <div className="mb-4">
                                                <label className="text-sm font-semibold text-gray-900 block mb-2">
                                                    Pilihan Pengiriman
                                                </label>
                                                <Select
                                                    value={
                                                        item.delivery_type ||
                                                        "pickup"
                                                    }
                                                    onValueChange={async (
                                                        value
                                                    ) => {
                                                        try {
                                                            const response =
                                                                await axios.post(
                                                                    "/cart/update-delivery-type",
                                                                    {
                                                                        cart_id:
                                                                            item.id,
                                                                        delivery_type:
                                                                            value,
                                                                    }
                                                                );

                                                            if (
                                                                response.data
                                                                    .success
                                                            ) {
                                                                // Update local Redux state
                                                                dispatch(
                                                                    updateCartQuantity(
                                                                        {
                                                                            cart_id:
                                                                                item.id,
                                                                            quantity:
                                                                                item.item_qty,
                                                                            delivery_type:
                                                                                value,
                                                                        }
                                                                    )
                                                                );
                                                            }
                                                        } catch (error) {
                                                            console.error(
                                                                "Failed to update delivery option:",
                                                                error
                                                            );
                                                            toast.error(
                                                                "Gagal memperbarui pilihan pengiriman"
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Pilih jenis pengiriman" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pickup">
                                                            Ambil di Tempat
                                                        </SelectItem>
                                                        <SelectItem value="delivery">
                                                            Antar ke Alamat
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                    {/* Quantity Selector (Ticket only in this block) */}
                                    {item.type === "ticket" &&
                                        !status.disabled && (
                                            <div className="flex items-center border rounded-lg shadow-sm bg-white">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        handleQtyChange(
                                                            item.id,
                                                            item.item_qty - 1
                                                        )
                                                    }
                                                    disabled={
                                                        item.item_qty <= 1 ||
                                                        status.disabled
                                                    }
                                                    className="h-9 w-9"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </Button>
                                                <span className="px-4 font-semibold min-w-[50px] text-center text-gray-900">
                                                    {item.item_qty}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        handleQtyChange(
                                                            item.id,
                                                            item.item_qty + 1
                                                        )
                                                    }
                                                    disabled={status.disabled}
                                                    className="h-9 w-9"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}

                                    {/* Subtotal Display */}
                                    <div className="text-left md:text-right">
                                        <p className="text-xs text-gray-500 mb-1">
                                            Subtotal
                                        </p>
                                        <p className="text-xl md:text-2xl font-bold text-gray-900">
                                            Rp{" "}
                                            {formatRupiah(
                                                (item.item?.price || 0) *
                                                    item.item_qty
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        },
        [
            selectedItems,
            handleSelectItem,
            handleDeleteCart,
            handleQtyChange,
            ziggy.url,
            // Tambahkan dependency lain jika ada (misal: updateCartQuantity, dll.)
        ]
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm text-gray-600 font-medium">
                        Memuat keranjang...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Head title="Keranjang Belanja" />

            <main className="container mx-auto px-4 py-6 md:py-8">
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <Button
                                    variant="ghost"
                                    onClick={() => window.history.back()}
                                    className="mb-2 -ml-2"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Kembali
                                </Button>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                                        <ShoppingCart className="w-6 h-6 text-primary-foreground" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                            Keranjang Belanja
                                        </h1>
                                        <p className="text-sm text-gray-600">
                                            {safeCartItems.length} item dalam
                                            keranjang
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {safeCartItems.length === 0 ? (
                            <Card className="shadow-lg">
                                <CardContent className="py-16">
                                    <div className="text-center space-y-4">
                                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                                            <ShoppingCart className="w-12 h-12 text-gray-400" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900">
                                            Keranjang Masih Kosong
                                        </h3>
                                        <p className="text-gray-600 max-w-md mx-auto">
                                            Mulai berbelanja dan tambahkan item
                                            ke keranjang Anda
                                        </p>
                                        <Button
                                            asChild
                                            size="lg"
                                            className="mt-4"
                                        >
                                            <Link href="/">
                                                Mulai Belanja Sekarang
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Cart Items */}
                                <div className="lg:col-span-2 space-y-4">
                                    {/* Global Alert for Disabled Items */}
                                    {disabledItems.length > 0 && (
                                        <Alert className="bg-red-50 border-red-200">
                                            <AlertCircle className="w-5 h-5 text-red-600" />
                                            <AlertTitle className="text-red-900 font-semibold">
                                                {disabledItems.length} item
                                                tidak tersedia
                                            </AlertTitle>
                                            <AlertDescription className="text-red-700 text-sm">
                                                Item yang tidak tersedia tidak
                                                dapat dipilih untuk checkout.
                                                Silakan hapus dari keranjang
                                                atau perbarui tanggal sewa.
                                            </AlertDescription>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                                                onClick={() =>
                                                    handleBulkDelete(
                                                        disabledItems
                                                    )
                                                }
                                            >
                                                Hapus Semua Item Tidak Tersedia
                                            </Button>
                                        </Alert>
                                    )}

                                    {/* Select All */}
                                    {validItems.length > 0 && (
                                        <Card className="shadow-md">
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Checkbox
                                                            id="selectAll"
                                                            checked={
                                                                selectedItems.size ===
                                                                    validItems.length &&
                                                                validItems.length >
                                                                    0
                                                            }
                                                            onCheckedChange={
                                                                handleSelectAll
                                                            }
                                                        />
                                                        <label
                                                            htmlFor="selectAll"
                                                            className="text-sm font-semibold cursor-pointer select-none"
                                                        >
                                                            Pilih Semua Item
                                                            Tersedia
                                                        </label>
                                                    </div>
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-sm"
                                                    >
                                                        {selectedItems.size}/
                                                        {validItems.length}{" "}
                                                        dipilih
                                                    </Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Valid Items */}
                                    {validItems.length > 0 && (
                                        <div className="space-y-4">
                                            {validItems.map(renderCartItem)}
                                        </div>
                                    )}

                                    {/* Disabled Items Section */}
                                    {disabledItems.length > 0 && (
                                        <div className="space-y-4 pt-6">
                                            <div className="flex items-center gap-2">
                                                <Separator className="flex-1" />
                                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                                    Item Tidak Tersedia
                                                </h3>
                                                <Separator className="flex-1" />
                                            </div>
                                            {disabledItems.map(renderCartItem)}
                                        </div>
                                    )}
                                </div>

                                {/* Summary Sidebar */}
                                <div className="lg:sticky lg:top-6 h-fit">
                                    <Card className="shadow-lg border-2">
                                        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                                            <CardTitle className="text-xl font-bold">
                                                Ringkasan Belanja
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6 space-y-6">
                                            {/* Price Details */}
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">
                                                        Subtotal (
                                                        {selectedItems.size}{" "}
                                                        item)
                                                    </span>
                                                    <span className="font-semibold text-gray-900">
                                                        Rp{" "}
                                                        {formatRupiah(
                                                            selectedTotal
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">
                                                        Biaya Aplikasi
                                                    </span>
                                                    <span className="font-semibold text-green-600">
                                                        Gratis
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">
                                                        {taxInfo?.label ||
                                                            "Pajak"}
                                                    </span>
                                                    <span className="font-semibold text-gray-900">
                                                        Rp{" "}
                                                        {formatRupiah(
                                                            taxAmount
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            <Separator />

                                            {/* Total */}
                                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
                                                <span className="text-lg font-bold text-gray-900">
                                                    Total Pembayaran
                                                </span>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black text-primary">
                                                        Rp{" "}
                                                        {formatRupiah(
                                                            totalWithTax
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Checkout Button */}
                                            <Button
                                                className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                                                onClick={handleCheckout}
                                                disabled={
                                                    isCheckingOut ||
                                                    selectedItems.size === 0
                                                }
                                                size="lg"
                                            >
                                                {isCheckingOut ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        Memproses...
                                                    </div>
                                                ) : (
                                                    <>
                                                        <ShoppingCart className="w-5 h-5 mr-2" />
                                                        Checkout (
                                                        {selectedItems.size}{" "}
                                                        item)
                                                    </>
                                                )}
                                            </Button>

                                            {selectedItems.size === 0 && (
                                                <p className="text-xs text-center text-gray-500">
                                                    Pilih minimal 1 item untuk
                                                    melanjutkan checkout
                                                </p>
                                            )}

                                            {/* Trust Badges */}
                                            <div className="pt-4 border-t">
                                                <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                            <svg
                                                                className="w-4 h-4 text-green-600"
                                                                fill="currentColor"
                                                                viewBox="0 0 20 20"
                                                            >
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </div>
                                                        <span>
                                                            Pembayaran Aman
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                            <Clock className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <span>
                                                            Proses Cepat
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </div>
                </ErrorBoundary>
            </main>
        </div>
    );
}

CartPage.layout = (page) => <MainLayout>{page}</MainLayout>;
