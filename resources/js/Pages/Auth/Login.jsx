import { usePage } from "@inertiajs/react";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import Checkbox from "@/Components/Checkbox.jsx";
import GuestLayout from "@/Layouts/GuestLayout.jsx";
import InputError from "@/Components/InputError.jsx";
import { Head, Link, useForm } from "@inertiajs/react";
import { LoaderCircle, Eye, EyeOff, Mail, Lock } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useCsrfToken } from "@/hooks/useCsrfToken";

export default function Login({ status, canResetPassword }) {
    const { url, props } = usePage();

    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get("redirect") || "";

    const [showPassword, setShowPassword] = useState(false);
    const [authError, setAuthError] = useState("");
    const { csrfToken, refreshToken } = useCsrfToken();

    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
        redirect: redirectUrl,
    });

    // Handle session errors from backend
    useEffect(() => {
        // Only set auth error if we're not currently processing
        if (!processing) {
            if (props.errors && Object.keys(props.errors).length > 0) {
                const firstError = Object.values(props.errors)[0];
                setAuthError(firstError);
            }

            if (props.error) {
                setAuthError(props.error);
            }
        }
    }, [props.errors, props.error, processing]);

    const submit = (e) => {
        e.preventDefault();
        setAuthError(""); // Clear previous auth errors

        console.log("Login submit started", {
            email: data.email,
            redirect: data.redirect,
        });

        // Refresh CSRF token first, then proceed with login
        refreshToken()
            .then(() => {
                console.log("CSRF token refreshed successfully");

                // Now proceed with login after token is refreshed
                post(route("login"), {
                    onFinish: () => {
                        console.log("Login request finished");
                        reset("password");
                    },
                    onError: (errors) => {
                        console.error("Login error received:", errors);
                        handleLoginErrors(errors);
                    },
                    onSuccess: () => {
                        console.log("Login successful");
                        setAuthError(""); // Clear any existing auth errors on successful login
                    },
                    onCancel: () => {
                        console.log("Login request cancelled");
                        setAuthError("Login dibatalkan. Silakan coba lagi.");
                    },
                    onTimeout: () => {
                        console.error("Login request timed out");
                        setAuthError(
                            "Request timeout. Periksa koneksi internet Anda dan coba lagi."
                        );
                    },
                });
            })
            .catch((error) => {
                console.error("Failed to refresh CSRF token:", error);
                setAuthError(
                    "Terjadi kesalahan saat memperbarui token keamanan. Silakan refresh halaman dan coba lagi."
                );
            });
    };

    // Helper function to handle login errors
    const handleLoginErrors = (errors) => {
        console.log("Handling login errors:", errors);

        // Don't show error if errors object is empty
        if (!errors || Object.keys(errors).length === 0) {
            console.log("No errors to handle");
            return;
        }

        // Handle CSRF errors specifically
        if (errors.csrf || errors._token) {
            console.log("CSRF error detected, refreshing token and retrying");
            refreshToken()
                .then(() => {
                    // Retry the login request after refreshing token
                    post(route("login"), {
                        onFinish: () => reset("password"),
                        onError: (retryErrors) => {
                            console.error(
                                "Retry login also failed:",
                                retryErrors
                            );
                            handleLoginErrors(retryErrors);
                        },
                        onSuccess: () => {
                            console.log("Retry login successful");
                            setAuthError(""); // Clear any existing auth errors on successful retry
                        },
                    });
                })
                .catch((tokenError) => {
                    console.error(
                        "Failed to refresh CSRF token on retry:",
                        tokenError
                    );
                    setAuthError(
                        "Terjadi kesalahan keamanan. Silakan refresh halaman dan coba lagi."
                    );
                });
            return; // Don't process other errors yet
        }

        // Set general authentication error if email error exists
        if (errors.email) {
            setAuthError(errors.email);
        } else if (errors.password) {
            setAuthError(errors.password);
        } else {
            // Handle other errors that might not be field-specific
            const errorMessages = Object.values(errors);
            if (errorMessages.length > 0) {
                setAuthError(errorMessages[0]);
            } else {
                setAuthError(
                    "Terjadi kesalahan saat login. Silakan periksa email dan password Anda."
                );
            }
        }
    };

    return (
        <GuestLayout centered={false}>
            <Head title="Masuk" />
            <div className="flex min-h-screen">
                {/* Left side - Form */}
                <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
                    <div className="w-full max-w-md">
                        <div className="mb-10">
                            <h1 className="text-3xl font-bold tracking-tight">
                                Selamat Datang Kembali
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                Masuk untuk mengelola event Anda
                            </p>
                        </div>

                        {status && (
                            <div className="mb-6 p-4 rounded-lg bg-green-50 text-green-700 text-sm">
                                {status}
                            </div>
                        )}
                        {authError && (
                            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                                {authError}
                            </div>
                        )}
                        {errors.csrf && (
                            <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 text-sm">
                                {errors.csrf}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-6">
                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="pl-10"
                                        autoComplete="username"
                                        onChange={(e) => {
                                            setData("email", e.target.value);
                                            setAuthError(""); // Clear auth error when user types
                                        }}
                                        required
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        name="password"
                                        value={data.password}
                                        className="pl-10 pr-10"
                                        autoComplete="current-password"
                                        onChange={(e) => {
                                            setData("password", e.target.value);
                                            setAuthError(""); // Clear auth error when user types
                                        }}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-gray-500" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-gray-500" />
                                        )}
                                    </button>
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            {/* Remember me */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData("remember", e.target.checked)
                                    }
                                />
                                <Label
                                    htmlFor="remember"
                                    className="text-sm text-gray-600"
                                >
                                    Ingat saya
                                </Label>
                            </div>

                            {/* Submit button */}
                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                                        Loading...
                                    </>
                                ) : (
                                    "Masuk"
                                )}
                            </Button>

                            {/* Forgot Password link (positioned after button but visually placed near password) */}
                            {canResetPassword && (
                                <div className="flex justify-end -mt-2">
                                    <Link
                                        href={route("password.request")}
                                        className="text-sm text-primary hover:underline"
                                    >
                                        Lupa password?
                                    </Link>
                                </div>
                            )}

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-gray-500">
                                        Atau
                                    </span>
                                </div>
                            </div>

                            {/* Google Login */}
                            <a href="/auth/google" className="w-full">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    size="lg"
                                >
                                    <svg
                                        className="w-4 h-4 mr-2"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Masuk dengan Google
                                </Button>
                            </a>

                            {/* Sign up link */}
                            <div className="text-center text-sm text-muted-foreground pt-4">
                                Belum punya akun?{" "}
                                <Link
                                    href="/register"
                                    className="text-primary font-medium hover:underline"
                                >
                                    Daftar
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right side - Visuals */}
                <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-black/40 z-10" />
                    {/* Background pattern or image placeholder */}
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-30"
                        style={{
                            backgroundImage:
                                "url('https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
                        }}
                    />
                    {/* Content overlay */}
                    <div className="relative z-20 flex flex-col justify-center p-12 text-white">
                        <div className="max-w-md">
                            <h2 className="text-4xl font-bold leading-tight">
                                Eventnusa
                            </h2>
                            <p className="mt-4 text-xl">
                                Platform Event Terbaik untuk Mengatur Jadwalmu
                            </p>
                            <p className="mt-6 text-slate-300">
                                Ribuan organizer telah mempercayakan event
                                mereka kepada kami. Bergabunglah dan kelola
                                event Anda dengan mudah.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
