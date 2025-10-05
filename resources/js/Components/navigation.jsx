"use client";

import React, { useEffect, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import {
    ShoppingCart,
    Menu,
    User,
    Home,
    Package,
    Heart,
    MessageCircle,
    CircleUserRound,
    LogOut,
    Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "next-themes";

export default function Navigation() {
    const { auth, ziggy } = usePage().props;
    const { setTheme, theme } = useTheme();

    // State untuk search input dan mobile menu
    const [searchKeyword, setSearchKeyword] = useState("");
    const [mobileSearchKeyword, setMobileSearchKeyword] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Ambil keyword dari URL saat component mount atau URL berubah
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

    // Desktop Auth Component
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
                            <Link href="/account">
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => router.post(route("logout"))}
                            className="text-destructive focus:text-destructive"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Keluar
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
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-xl md:text-2xl font-bold text-primary">
                            Eventnusa
                        </span>
                        <Badge
                            variant="secondary"
                            className="hidden sm:inline-flex text-xs"
                        >
                            Beta
                        </Badge>
                    </Link>

                    {/* Search (Desktop) */}
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

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Chat */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden md:flex"
                        >
                            <Link href="/chat">
                                <MessageCircle className="h-5 w-5" />
                            </Link>
                        </Button>

                        {/* Cart */}
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/cart">
                                <ShoppingCart className="h-5 w-5" />
                            </Link>
                        </Button>

                        {/* Desktop Auth */}
                        <div className="hidden md:flex">
                            <DesktopAuthButtons />
                        </div>

                        {/* Mobile Menu */}
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
                                    {/* Mobile Search */}
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

                                    {/* Mobile Navigation Links */}
                                    <Button
                                        variant="ghost"
                                        className="justify-start"
                                        asChild
                                    >
                                        <Link href="/">
                                            <Home className="mr-2 h-4 w-4" />
                                            Home
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="justify-start"
                                        asChild
                                    >
                                        <Link href="/products">
                                            <Package className="mr-2 h-4 w-4" />
                                            Produk
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="justify-start"
                                        asChild
                                    >
                                        <Link href="/wishlist">
                                            <Heart className="mr-2 h-4 w-4" />
                                            Wishlist
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="justify-start"
                                    >
                                        <MessageCircle className="mr-2 h-4 w-4" />
                                        Chat
                                    </Button>

                                    {/* Mobile Auth */}
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
                                                    <Link href="/account">
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
                                                <Button
                                                    variant="ghost"
                                                    className="justify-start w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() =>
                                                        router.post(
                                                            route("logout")
                                                        )
                                                    }
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
                <div className="grid grid-cols-5 h-16">
                    {/* Home */}
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

                    {/* Products */}
                    <Link
                        href="/products"
                        className={`flex flex-col items-center justify-center text-xs transition-colors ${
                            isActive("/products")
                                ? "text-primary bg-primary/10"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Package className={`h-5 w-5 mb-1`} />
                        <span className="font-medium">Produk</span>
                    </Link>

                    {/* Cart */}
                    <Link
                        href="/cart"
                        className={`flex flex-col items-center justify-center text-xs transition-colors ${
                            isActive("/cart")
                                ? "text-primary bg-primary/10"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <div className="relative">
                            <ShoppingCart className={`h-5 w-5 mb-1`} />
                        </div>
                        <span className="font-medium">Keranjang</span>
                    </Link>

                    {/* Wishlist */}
                    <Link
                        href="/wishlist"
                        className={`flex flex-col items-center justify-center text-xs transition-colors ${
                            isActive("/wishlist")
                                ? "text-primary bg-primary/10"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Heart className={`h-5 w-5 mb-1`} />
                        <span className="font-medium">Wishlist</span>
                    </Link>

                    {/* Profile/Account */}
                    <Link
                        href={auth?.user ? "/account" : "/login"}
                        className={`flex flex-col items-center justify-center text-xs transition-colors ${
                            isActive("/account")
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
