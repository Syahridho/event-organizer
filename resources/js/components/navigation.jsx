"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import {
    ShoppingCart,
    Menu,
    User,
    Home,
    Package,
    MessageCircle,
    CircleUserRound,
    LogOut,
    Search,
    Bell,
    LayoutDashboardIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet.jsx";
import { useDispatch, useSelector } from "react-redux";
import {
    setCartItems,
    selectCartItemCount,
    clearCart,
} from "@/Store/cartSlice";

export default function Navigation() {
    const { auth, ziggy, counts } = usePage().props;
    const dispatch = useDispatch();


    const cartItemCount = useSelector(selectCartItemCount);

    const [searchKeyword, setSearchKeyword] = useState("");
    const [mobileSearchKeyword, setMobileSearchKeyword] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const unreadNotifications = counts?.unread_notifications || 0;
    const unreadChats = counts?.unread_chats || 0;
    // ✅ Gunakan cartItemCount dari Redux
    const cartItems = cartItemCount;

    // ✅ Initialize Redux dari Inertia props saat pertama load
    useEffect(() => {
        const initialCartItems = counts?.cart_items;

        if (initialCartItems && initialCartItems.length > 0) {
            
            

            dispatch(setCartItems(initialCartItems));
        } else if (initialCartItems && initialCartItems.length === 0) {
            dispatch(clearCart());
        }
    }, [counts?.cart_items, dispatch]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const keyword = params.get("keyword") || "";
            setSearchKeyword(keyword);
            setMobileSearchKeyword(keyword);
        }
    }, [ziggy.url]);

    const isActive = (path) => {
        return ziggy.url === path || ziggy.url.startsWith(path + "/");
    };

    // Function to handle logout with proper CSRF token handling
    const handleLogout = useCallback((e) => {
        e.preventDefault();

        // Get current CSRF token
        const token = document.head.querySelector('meta[name="csrf-token"]');
        const currentToken = token ? token.content : "";

        // Perform logout with current token
        router.post(
            route("logout"),
            {
                _token: currentToken,
            },
            {
                onError: (errors) => {
                    // If there's a CSRF error, try to refresh token and retry
                    if (errors.csrf || errors._token) {
                        // Try to get a fresh token
                        fetch("/csrf-token", {
                            method: "GET",
                            headers: {
                                "X-Requested-With": "XMLHttpRequest",
                                Accept: "application/json",
                            },
                        })
                            .then((response) => response.json())
                            .then((data) => {
                                if (data.token) {
                                    // Update the meta tag
                                    const metaTag = document.head.querySelector(
                                        'meta[name="csrf-token"]'
                                    );
                                    if (metaTag) {
                                        metaTag.setAttribute(
                                            "content",
                                            data.token
                                        );
                                    }
                                    // Retry logout with new token
                                    router.post(route("logout"), {
                                        _token: data.token,
                                    });
                                }
                            })
                            .catch(() => {
                                // If token refresh fails, fall back to page reload
                                console.error(
                                    "Failed to refresh CSRF token for logout"
                                );
                                window.location.href = route("logout");
                            });
                    }
                },
            }
        );
    }, []);

    const handleDesktopSearch = (e) => {
        e.preventDefault();
        if (searchKeyword && searchKeyword.trim()) {
            router.visit(
                `/search?keyword=${encodeURIComponent(searchKeyword.trim())}`
            );
        }
    };

    const handleMobileSearch = (e) => {
        e.preventDefault();
        if (mobileSearchKeyword && mobileSearchKeyword.trim()) {
            setIsSheetOpen(false);
            router.visit(
                `/search?keyword=${encodeURIComponent(
                    mobileSearchKeyword.trim()
                )}`
            );
        }
    };

    const DesktopAuthButtons = () => {
        if (auth?.user) {
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <CircleUserRound className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        sideOffset={8}
                        className="w-56"
                    >
                        <DropdownMenuLabel className="capitalize">
                            {auth.user.name}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/profile">
                                <User className="mr-2 h-4 w-4" />
                                Profil
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/purchase">
                                <Package className="mr-2 h-4 w-4" />
                                Pesanan Saya
                            </Link>
                        </DropdownMenuItem>
                        {auth?.user?.role === "admin" ? (
                            <DropdownMenuItem asChild>
                                <Link
                                    href="/admin/dashboard"
                                    className="flex items-center"
                                >
                                    <LayoutDashboardIcon className="mr-2 h-4 w-4" />
                                    Dashboard Admin
                                </Link>
                            </DropdownMenuItem>
                        ) : auth?.user?.role === "mitra" ? (
                            <DropdownMenuItem asChild>
                                <Link
                                    href="/dashboard"
                                    className="flex items-center"
                                >
                                    <LayoutDashboardIcon className="mr-2 h-4 w-4" />
                                    Dashboard Mitra
                                </Link>
                            </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full text-left text-destructive focus:text-destructive flex items-center"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Keluar
                            </button>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }

        return (
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.get("/login")}
                    className="border-primary text-primary hover:bg-primary/10"
                >
                    Masuk
                </Button>
                <Button
                    size="sm"
                    onClick={() => router.get("/register")}
                    className="bg-primary hover:bg-primary/90"
                >
                    Daftar
                </Button>
            </div>
        );
    };

    return (
        <>
            {/* Top Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between px-4 md:max-w-6xl mx-auto md:px-6">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-xl md:text-2xl font-bold text-primary">
                            Eventnusa
                        </span>
                      
                    </Link>

                    <div className="hidden md:flex flex-1 max-w-md mx-6">
                        <form
                            onSubmit={handleDesktopSearch}
                            className="flex w-full"
                        >
                            <input
                                type="text"
                                value={searchKeyword}
                                onChange={(e) =>
                                    setSearchKeyword(e.target.value)
                                }
                                placeholder="Cari event, venue, atau vendor..."
                                className="w-full border border-r-0 rounded-l-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                            <button
                                type="submit"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 rounded-r-lg transition-colors"
                            >
                                <Search className="h-4 w-4" />
                            </button>
                        </form>
                    </div>

                    <div className="flex items-center gap-2">
                        {auth?.user && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hidden md:flex relative"
                                asChild
                            >
                                <Link href="/notifications">
                                    <Bell className="w-5 h-5" />
                                    {unreadNotifications > 0 && (
                                        <Badge className="absolute top-1 right-1 h-4 min-w-4 p-0.5 rounded-full bg-slate-800 text-xs flex items-center justify-center">
                                            {unreadNotifications > 99
                                                ? "99+"
                                                : unreadNotifications}
                                        </Badge>
                                    )}
                                </Link>
                            </Button>
                        )}

                        {auth?.user && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hidden md:flex relative"
                                asChild
                            >
                                <Link href="/chat">
                                    <MessageCircle className="h-5 w-5" />
                                    {unreadChats > 0 && (
                                        <Badge className="absolute top-1 right-1 h-4 min-w-4 p-0.5 rounded-full bg-slate-800 text-xs flex items-center justify-center">
                                            {unreadChats > 99
                                                ? "99+"
                                                : unreadChats}
                                        </Badge>
                                    )}
                                </Link>
                            </Button>
                        )}

                        {auth?.user && (
                            <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                className="hidden md:flex relative"
                            >
                                <Link href="/cart">
                                    <ShoppingCart className="h-5 w-5" />
                                    {cartItems > 0 && (
                                        <Badge className="absolute top-1 right-1 h-4 min-w-4 p-0.5 rounded-full bg-slate-800 text-xs flex items-center justify-center">
                                            {cartItems > 99 ? "99+" : cartItems}
                                        </Badge>
                                    )}
                                </Link>
                            </Button>
                        )}

                        <div className="hidden md:flex">
                            <DesktopAuthButtons />
                        </div>

                        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent>
                                <div className="flex flex-col space-y-4 mt-6">
                                    <form
                                        onSubmit={handleMobileSearch}
                                        className="flex w-full mb-4"
                                    >
                                        <input
                                            type="text"
                                            value={mobileSearchKeyword}
                                            onChange={(e) =>
                                                setMobileSearchKeyword(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Cari..."
                                            className="w-full border border-r-0 rounded-l-lg px-3 py-2 text-sm"
                                        />
                                        <button
                                            type="submit"
                                            className="bg-primary text-primary-foreground px-3 rounded-r-lg"
                                        >
                                            <Search className="h-4 w-4" />
                                        </button>
                                    </form>

                                    {auth?.user && (
                                        <Button
                                            variant="ghost"
                                            className="justify-start relative"
                                            asChild
                                        >
                                            <Link
                                                href="/notifications"
                                                className="flex items-center w-full"
                                            >
                                                <Bell className="mr-2 h-4 w-4" />
                                                Notifikasi
                                                {unreadNotifications > 0 && (
                                                    <Badge className="ml-auto h-4 min-w-4 p-0.5 rounded-full bg-slate-800 text-xs flex items-center justify-center">
                                                        {unreadNotifications >
                                                        99
                                                            ? "99+"
                                                            : unreadNotifications}
                                                    </Badge>
                                                )}
                                            </Link>
                                        </Button>
                                    )}

                                    {auth?.user && (
                                        <Button
                                            variant="ghost"
                                            className="justify-start relative"
                                            asChild
                                        >
                                            <Link
                                                href="/chat"
                                                className="flex items-center w-full"
                                            >
                                                <MessageCircle className="mr-2 h-4 w-4" />
                                                Chat
                                                {unreadChats > 0 && (
                                                    <Badge className="ml-auto h-4 min-w-4 p-0.5 rounded-full bg-slate-800 text-xs flex items-center justify-center">
                                                        {unreadChats > 99
                                                            ? "99+"
                                                            : unreadChats}
                                                    </Badge>
                                                )}
                                            </Link>
                                        </Button>
                                    )}

                                    {auth?.user ? (
                                        <>
                                            <div className="border-t pt-4 mt-4">
                                                <p className="text-sm font-medium mb-3">
                                                    Halo, {auth.user.name}
                                                </p>
                                                <Button
                                                    variant="ghost"
                                                    className="justify-start w-full"
                                                    asChild
                                                >
                                                    <Link href="/profile">
                                                        <User className="mr-2 h-4 w-4" />
                                                        Profil
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    className="justify-start w-full"
                                                    asChild
                                                >
                                                    <Link href="/purchase">
                                                        <Package className="mr-2 h-4 w-4" />
                                                        Pesanan Saya
                                                    </Link>
                                                </Button>
                                                {/* <Button
                                                        variant="ghost"
                                                        className="justify-start w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => {
                                                                "Logout clicked - mobile"
                                                            );
                                                            router.post(
                                                                route("logout"),
                                                                {},
                                                                {
                                                                    onStart: () => {
                                                                            "Logout request started"
                                                                        );
                                                                    },
                                                                    onSuccess:
                                                                        () => {
                                                                                "Logout successful"
                                                                            );
                                                                            window.location.href =
                                                                                "/";
                                                                        },
                                                                    onError: (
                                                                        errors
                                                                    ) => {
                                                                        console.error(
                                                                            "Logout error:",
                                                                            errors
                                                                        );
                                                                    },
                                                                }
                                                            );
                                                        }}
                                                    >
                                                        <LogOut className="mr-2 h-4 w-4" />
                                                        Keluar
                                                    </Button> */}
                                                <Button
                                                    variant="ghost"
                                                    className="justify-start w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={handleLogout}
                                                >
                                                    <LogOut className="mr-2 h-4 w-4" />
                                                    Keluar
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="border-t pt-4 mt-4 space-y-2">
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={() =>
                                                    router.get("/login")
                                                }
                                            >
                                                Masuk
                                            </Button>
                                            <Button
                                                className="w-full"
                                                onClick={() =>
                                                    router.get("/register")
                                                }
                                            >
                                                Daftar
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>

            {/* Bottom Navigation - Mobile Only */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
                <div className="grid grid-cols-3 h-16">
                    <Link
                        href="/"
                        className={`flex flex-col items-center justify-center text-xs transition-colors ${
                            isActive("/")
                                ? "text-primary bg-primary/10"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Home className={`h-5 w-5 mb-1`} />
                        <span className="font-medium">Home</span>
                    </Link>

                    <Link
                        href="/cart"
                        className={`flex flex-col items-center justify-center text-xs transition-colors relative ${
                            isActive("/cart")
                                ? "text-primary bg-primary/10"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <div className="relative">
                            <ShoppingCart className={`h-5 w-5 mb-1`} />
                            {cartItems > 0 && (
                                <Badge className="absolute -top-1 -right-2 h-4 min-w-4 p-0.5 rounded-full bg-slate-800 text-xs flex items-center justify-center">
                                    {cartItems > 99 ? "99+" : cartItems}
                                </Badge>
                            )}
                        </div>
                        <span className="font-medium">Keranjang</span>
                    </Link>

                    <Link
                        href={auth?.user ? "/profile" : "/login"}
                        className={`flex flex-col items-center justify-center text-xs transition-colors ${
                            isActive("/profile")
                                ? "text-primary bg-primary/10"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <User className={`h-5 w-5 mb-1`} />
                        <span className="font-medium">
                            {auth?.user ? "Akun" : "Login"}
                        </span>
                    </Link>
                </div>
            </nav>
        </>
    );
}
