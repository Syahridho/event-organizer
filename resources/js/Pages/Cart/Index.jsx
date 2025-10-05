import { usePage, router, Head } from "@inertiajs/react";
import axios from "axios";
import { formatRupiah } from "@/Utils/formatRupiah";
import {
    Fragment,
    useEffect,
    useMemo,
    useCallback,
    useRef,
    useState,
} from "react";
import { Button } from "@/components/ui/button";
import { FaTrash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
    addToCart,
    updateCartQuantity,
    removeFromCart,
    setCartItems,
} from "@/Store/cartSlice";
import { ErrorBoundary } from "react-error-boundary";
import Navigation from "@/components/navigation";
import { Link } from "@inertiajs/react";

const ErrorFallback = ({ error }) => (
    <div className="text-center py-10">
        <p className="text-red-500">Terjadi kesalahan: {error.message}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
            Coba Lagi
        </Button>
    </div>
);

export default function CartPage() {
    const { carts = [], ziggy } = usePage().props; // Default to empty array
    console.log(carts);

    const dispatch = useDispatch();
    const cartItems = useSelector((state) => state.cart.items);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Ref untuk mencegah multiple API calls
    const pendingUpdates = useRef(new Set());
    const updateTimeouts = useRef(new Map());

    // Memoized cart items untuk performa
    const cartItemsMap = useMemo(() => {
        return cartItems.reduce((map, item) => {
            map[item.cart_id] = item;
            return map;
        }, {});
    }, [cartItems]);

    // Debounced quantity update untuk mengurangi API calls
    const debouncedQtyUpdate = useCallback(
        (cartId, newQty) => {
            if (updateTimeouts.current.has(cartId)) {
                clearTimeout(updateTimeouts.current.get(cartId));
            }

            const timeoutId = setTimeout(async () => {
                if (pendingUpdates.current.has(cartId)) return;

                pendingUpdates.current.add(cartId);

                try {
                    await axios.put(`/cart/${cartId}`, { item_qty: newQty });
                    pendingUpdates.current.delete(cartId);
                } catch (error) {
                    const originalItem = cartItemsMap[cartId];
                    if (originalItem) {
                        dispatch(
                            updateCartQuantity({
                                cart_id: cartId,
                                quantity: originalItem.quantity,
                            })
                        );
                    }
                    alert("Gagal update qty");
                    console.error(error);
                    pendingUpdates.current.delete(cartId);
                }
            }, 500);

            updateTimeouts.current.set(cartId, timeoutId);
        },
        [cartItemsMap, dispatch]
    );

    const handleQtyChange = useCallback(
        (cartId, newQty) => {
            if (newQty < 1) return;

            dispatch(updateCartQuantity({ cart_id: cartId, quantity: newQty }));
            debouncedQtyUpdate(cartId, newQty);
        },
        [dispatch, debouncedQtyUpdate]
    );

    const handleDeleteCart = useCallback(
        async (cartId) => {
            try {
                dispatch(removeFromCart({ cart_id: cartId }));

                setSelectedItems((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(cartId);
                    return newSet;
                });

                await axios.delete(`/cart/${cartId}`);

                if (updateTimeouts.current.has(cartId)) {
                    clearTimeout(updateTimeouts.current.get(cartId));
                    updateTimeouts.current.delete(cartId);
                }
            } catch (error) {
                const originalCart = carts.find((cart) => cart.id === cartId);
                if (originalCart) {
                    dispatch(
                        addToCart({
                            cart_id: originalCart.id,
                            id: originalCart.item.id,
                            name:
                                originalCart.item.event?.name ||
                                originalCart.item.name,
                            type: originalCart.type,
                            price: originalCart.item.price,
                            quantity: originalCart.item_qty,
                            rent_days: originalCart.rent_days || null, // Fixed: add rent_days
                            is_unavailable:
                                originalCart.is_unavailable || false, // Fixed: add is_unavailable
                            thumbnail:
                                originalCart.item.event?.thumbnail ||
                                originalCart.item.thumbnail,
                        })
                    );
                }
                console.error("Gagal menghapus item:", error);
                alert("Gagal menghapus item.");
            }
        },
        [dispatch, carts]
    );

    const handleSelectItem = useCallback((cartId) => {
        setSelectedItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(cartId)) {
                newSet.delete(cartId);
            } else {
                newSet.add(cartId);
            }
            return newSet;
        });
    }, []);

    const handleSelectAll = useCallback(() => {
        if (selectedItems.size === cartItems.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(cartItems.map((item) => item.cart_id)));
        }
    }, [selectedItems.size, cartItems]);

    const selectedCartItems = useMemo(() => {
        return cartItems.filter((item) => selectedItems.has(item.cart_id));
    }, [cartItems, selectedItems]);

    const selectedTotal = useMemo(() => {
        return selectedCartItems.reduce((sum, item) => {
            return sum + item.price * item.quantity;
        }, 0);
    }, [selectedCartItems]);

    const total = useMemo(() => {
        return cartItems.reduce((sum, item) => {
            return sum + item.price * item.quantity;
        }, 0);
    }, [cartItems]);

    const handleCheckout = useCallback(async () => {
        if (selectedItems.size === 0) {
            alert("Pilih minimal satu item untuk checkout!");
            return;
        }

        setIsCheckingOut(true);

        try {
            const checkoutData = {
                cart_ids: Array.from(selectedItems),
                items: selectedCartItems.map((item) => ({
                    cart_id: item.cart_id,
                    id: item.id,
                    name: item.name,
                    type: item.type,
                    price: item.price,
                    quantity: item.quantity,
                    rent_days: item.rent_days || null, // Fixed: include rent_days
                    is_unavailable: item.is_unavailable || false, // Fixed: include is_unavailable
                    thumbnail: item.thumbnail,
                })),
                total: selectedTotal,
            };

            router.visit("/checkout", {
                method: "post",
                data: checkoutData,
                onError: (errors) => {
                    console.error("Checkout error:", errors);
                    if (errors.message) {
                        alert(errors.message);
                    } else {
                        alert(
                            "Terjadi kesalahan saat menuju halaman checkout. Silakan coba lagi."
                        );
                    }
                    setIsCheckingOut(false);
                },
                onFinish: () => {
                    setIsCheckingOut(false);
                },
            });
        } catch (error) {
            console.error("Checkout error:", error);
            alert("Terjadi kesalahan saat checkout. Silakan coba lagi.");
            setIsCheckingOut(false);
        }
    }, [selectedItems, selectedCartItems, selectedTotal, router]);

    useEffect(() => {
        const cartData = carts.map((cart) => ({
            cart_id: cart.id,
            id: cart.item.id,
            name: cart.item.event?.name || cart.item.name,
            type: cart.type, // Use cart.type for clarity ("service" or "ticket")
            price: cart.item.price,
            quantity: cart.item_qty,
            rent_days: cart.rent_days || 0, // Fixed: add rent_days with default value
            is_unavailable: cart.is_unavailable || false, // Fixed: add is_unavailable with default value
            thumbnail: cart.item.event?.thumbnail || cart.item.thumbnail,
        }));

        dispatch(setCartItems(cartData));
        setIsLoading(false);
    }, [carts, dispatch]);

    useEffect(() => {
        return () => {
            updateTimeouts.current.forEach((timeoutId) =>
                clearTimeout(timeoutId)
            );
        };
    }, []);

    if (isLoading) {
        return <div className="text-center py-10">Loading...</div>;
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Navigation />

            <main className="flex-1 container mx-auto px-4 py-6">
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                    <Head title="Keranjang" />
                    <div className="max-w-5xl mx-auto px-4">
                        <Button
                            variant="outline"
                            onClick={() => router.visit(window.history.back())}
                            className="mb-4"
                            size="sm"
                        >
                            Kembali
                        </Button>

                        <h1 className="text-2xl font-bold mb-6">
                            Keranjang Belanja
                        </h1>

                        {cartItems.length === 0 ? (
                            <p className="text-slate-500 text-center">
                                Keranjang masih kosong.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 space-y-6">
                                    <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-md">
                                        <input
                                            type="checkbox"
                                            id="selectAll"
                                            checked={
                                                selectedItems.size ===
                                                    cartItems.length &&
                                                cartItems.length > 0
                                            }
                                            onChange={handleSelectAll}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <label
                                            htmlFor="selectAll"
                                            className="text-sm font-medium text-gray-700"
                                        >
                                            Pilih Semua ({selectedItems.size}/
                                            {cartItems.length})
                                        </label>
                                    </div>

                                    {cartItems.map((item) => (
                                        <Fragment key={item.cart_id}>
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.has(
                                                        item.cart_id
                                                    )}
                                                    onChange={() =>
                                                        handleSelectItem(
                                                            item.cart_id
                                                        )
                                                    }
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />

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
                                                        className="w-20 h-20 object-cover rounded-md border"
                                                    />
                                                </div>

                                                <div className="flex-1">
                                                    <h4 className="font-semibold capitalize">
                                                        {item.name}
                                                    </h4>
                                                    {item.type && (
                                                        <p className="text-sm text-gray-400 mb-1">
                                                            {item.type}
                                                        </p>
                                                    )}

                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-500">
                                                            Rp.{" "}
                                                            {formatRupiah(
                                                                item.price
                                                            )}
                                                        </span>

                                                        {item.type ===
                                                            "ticket" && (
                                                            <div className="flex items-center border rounded px-2">
                                                                <button
                                                                    onClick={() =>
                                                                        handleQtyChange(
                                                                            item.cart_id,
                                                                            item.quantity -
                                                                                1
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        item.quantity <=
                                                                        1
                                                                    }
                                                                    className="text-lg px-2 py-1 hover:bg-gray-100 disabled:opacity-50"
                                                                >
                                                                    −
                                                                </button>
                                                                <span className="px-2 w-8 text-center">
                                                                    {
                                                                        item.quantity
                                                                    }
                                                                </span>
                                                                <button
                                                                    onClick={() =>
                                                                        handleQtyChange(
                                                                            item.cart_id,
                                                                            item.quantity +
                                                                                1
                                                                        )
                                                                    }
                                                                    className="text-lg px-2 py-1 hover:bg-gray-100"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        )}

                                                        <button
                                                            type="button"
                                                            className="ml-2 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer border border-red-200"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleDeleteCart(
                                                                    item.cart_id
                                                                );
                                                            }}
                                                            title="Hapus item"
                                                        >
                                                            <FaTrash className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    {/* Display unavailable status if needed */}
                                                    {item.is_unavailable && (
                                                        <div className="mt-2">
                                                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                                                Tidak Tersedia
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="text-right font-bold">
                                                    Rp.{" "}
                                                    {formatRupiah(
                                                        item.price *
                                                            item.quantity
                                                    )}
                                                </div>
                                            </div>
                                            <hr />
                                        </Fragment>
                                    ))}
                                </div>

                                <div className="border p-4 rounded-md sticky top-4">
                                    <h2 className="text-lg font-bold mb-4">
                                        Ringkasan
                                    </h2>

                                    <div className="mb-4 p-3 bg-blue-50 rounded">
                                        <p className="text-sm text-blue-800">
                                            {selectedItems.size} item dipilih
                                            dari {cartItems.length} item
                                        </p>
                                    </div>

                                    <div className="flex justify-between mb-2">
                                        <span>
                                            Subtotal ({selectedItems.size} item)
                                        </span>
                                        <span>
                                            Rp. {formatRupiah(selectedTotal)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span>Biaya Aplikasi</span>
                                        <span>Rp. {formatRupiah(0)}</span>
                                    </div>
                                    <hr className="my-2" />
                                    <div className="flex justify-between font-bold mb-4">
                                        <span>Total</span>
                                        <span>
                                            Rp. {formatRupiah(selectedTotal)}
                                        </span>
                                    </div>

                                    <Button
                                        className="w-full"
                                        onClick={handleCheckout}
                                        disabled={
                                            isCheckingOut ||
                                            selectedItems.size === 0
                                        }
                                    >
                                        {isCheckingOut ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Memproses...
                                            </div>
                                        ) : (
                                            `Checkout (${selectedItems.size} item)`
                                        )}
                                    </Button>

                                    {selectedItems.size === 0 && (
                                        <p className="text-xs text-gray-500 text-center mt-2">
                                            Pilih item untuk checkout
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </ErrorBoundary>
            </main>
        </div>
    );
}
