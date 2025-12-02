import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import InputError from "@/Components/InputError";
import { Head, Link, useForm } from "@inertiajs/react";
import { LoaderCircle, Eye, EyeOff } from "lucide-react";
import { useCsrfToken } from "@/hooks/useCsrfToken";

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const { refreshToken } = useCsrfToken();

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        username: "",
        email: "",
        password: "",
        password_confirmation: "",
        // Don't add _token here - global handler in app.jsx will add it automatically
    });

    useEffect(() => {
        return () => {
            reset("password", "password_confirmation");
        };
    }, []);

    const submit = async (e) => {
        e.preventDefault();

        // Ensure we have the latest CSRF token in meta tag before submitting
        await refreshToken();

        post(route("register"), {
            onFinish: () => reset("password", "password_confirmation"),
            onError: async (errors) => {
                // If there's a CSRF error, refresh the token
                if (errors.csrf || errors._token) {
                    await refreshToken();
                }
            },
        });
    };

    return (
        <GuestLayout>
            <Head title="Daftar" />
            <div className={"flex flex-col gap-6"}>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Daftar</CardTitle>
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
                                    <Label htmlFor="name" value="name">
                                        Nama Lengkap
                                    </Label>
                                    <Input
                                        id="name"
                                        type="name"
                                        name="name"
                                        value={data.name}
                                        className="mt-1 block w-full"
                                        autoComplete="name"
                                        onChange={(e) =>
                                            setData("name", e.target.value)
                                        }
                                        required
                                    />
                                    <InputError
                                        message={errors.name}
                                        className="mt-2"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="username" value="username">
                                        Nama Panggilan
                                    </Label>
                                    <Input
                                        id="username"
                                        type="username"
                                        name="username"
                                        value={data.username}
                                        className="mt-1 block w-full"
                                        autoComplete="username"
                                        onChange={(e) =>
                                            setData("username", e.target.value)
                                        }
                                        required
                                    />
                                    <InputError
                                        message={errors.username}
                                        className="mt-2"
                                    />
                                </div>
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
                                    <Label htmlFor="password" value="password">
                                        Password
                                    </Label>

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
                                            autoComplete="new-password"
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
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="password_confirmation"
                                        value="Konfimasi Password"
                                    >
                                        Konfirmasi Password
                                    </Label>

                                    <div className="relative">
                                        <Input
                                            id="password_confirmation"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            name="password_confirmation"
                                            value={data.password_confirmation}
                                            className="mt-1 block w-full pr-10"
                                            autoComplete="new-password"
                                            onChange={(e) =>
                                                setData(
                                                    "password_confirmation",
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
                                        message={errors.password_confirmation}
                                        className="mt-2"
                                    />
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
                                            "Daftar"
                                        )}
                                    </Button>
                                </div>
                            </div>
                            <div className="mt-4 text-center text-sm">
                                Sudah punya akun?{" "}
                                <Link
                                    href="/login"
                                    className="underline underline-offset-4"
                                >
                                    Masuk
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </GuestLayout>
    );
}
