import { usePage } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import Checkbox from "@/Components/Checkbox";
import GuestLayout from "@/Layouts/GuestLayout";
import InputError from "@/Components/InputError";
import { Head, Link, useForm, router } from "@inertiajs/react";
import { LoaderCircle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useCsrfToken } from "@/hooks/useCsrfToken";

export default function Login({ status, canResetPassword }) {
    const { url, props } = usePage();

    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get("redirect") || "";

    const [showPassword, setShowPassword] = useState(false);
    const { csrfToken, refreshToken } = useCsrfToken();

    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
        redirect: redirectUrl,
        // Don't add _token here - global handler in app.jsx will add it automatically
    });

    const submit = (e) => {
        e.preventDefault();

        // Ensure we have the latest CSRF token in meta tag before submitting
        refreshToken();

        post(route("login"), {
            onFinish: () => reset("password"),
            onError: (errors) => {
                // If there's a CSRF error, refresh the token
                if (errors.csrf || errors._token) {
                    refreshToken();
                }
            },
        });
    };

    return (
        <GuestLayout>
            <Head title="Masuk" />
            <div className={"flex flex-col gap-6"}>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Masuk</CardTitle>
                        <CardDescription>
                            Masukkan email Anda di bawah ini untuk masuk ke akun
                            Anda
                        </CardDescription>
                        {status && (
                            <div className="mb-4 font-medium text-sm text-green-600">
                                {status}
                            </div>
                        )}
                        {errors.csrf && (
                            <div className="mb-4 font-medium text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                                {errors.csrf}
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit}>
                            <div className="flex flex-col gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="email" value="email">
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="mt-1 block w-full"
                                        autoComplete="username"
                                        onChange={(e) =>
                                            setData("email", e.target.value)
                                        }
                                        required
                                    />
                                    <InputError
                                        message={errors.email}
                                        className="mt-2"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label
                                            htmlFor="password"
                                            value="password"
                                        >
                                            Password
                                        </Label>
                                        {canResetPassword && (
                                            <Link
                                                href={route("password.request")}
                                                className="text-sm underline underline-offset-4"
                                            >
                                                Lupa password?
                                            </Link>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            name="password"
                                            value={data.password}
                                            className="mt-1 block w-full pr-10"
                                            autoComplete="current-password"
                                            onChange={(e) =>
                                                setData(
                                                    "password",
                                                    e.target.value
                                                )
                                            }
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                        >
                                            {showPassword ? (
                                                <Eye className="h-4 w-4 text-gray-500" />
                                            ) : (
                                                <EyeOff className="h-4 w-4 text-gray-500" />
                                            )}
                                        </button>
                                    </div>
                                    <InputError
                                        message={errors.password}
                                        className="mt-2"
                                    />
                                </div>

                                <div className="block">
                                    <label className="flex items-center">
                                        <Checkbox
                                            name="remember"
                                            checked={data.remember}
                                            onChange={(e) =>
                                                setData(
                                                    "remember",
                                                    e.target.checked
                                                )
                                            }
                                        />
                                        <span className="ms-2 text-sm text-gray-600">
                                            Ingat saya
                                        </span>
                                    </label>
                                </div>

                                <div className="flex items-center justify-end mt-4">
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <>
                                                <LoaderCircle className="h-4 w-4 animate-spin" />
                                                Loading...
                                            </>
                                        ) : (
                                            "Masuk"
                                        )}
                                    </Button>
                                </div>
                            </div>
                            <div className="mt-4 text-center text-sm">
                                Belum punya akun?{" "}
                                <Link
                                    href="/register"
                                    className="underline underline-offset-4"
                                >
                                    Daftar
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </GuestLayout>
    );
}
