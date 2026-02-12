import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { useEffect, useState } from "react";
import GuestLayout from "@/Layouts/GuestLayout.jsx";
import InputError from "@/components/InputError.jsx";
import { Head, Link, useForm } from "@inertiajs/react";
import {
    LoaderCircle,
    Eye,
    EyeOff,
    Mail,
    Lock,
    User,
    UserCircle,
} from "lucide-react";
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
    });

    useEffect(() => {
        return () => {
            reset("password", "password_confirmation");
        };
    }, []);

    const submit = async (e) => {
        e.preventDefault();

        await refreshToken();

        post(route("register"), {
            onFinish: () => reset("password", "password_confirmation"),
            onError: async (errors) => {
                if (errors.csrf || errors._token) {
                    await refreshToken();
                }
            },
        });
    };

    return (
        <GuestLayout centered={false}>
            <Head title="Daftar" />
            <div className="flex min-h-screen">
                {/* Left side - Form */}
                <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
                    <div className="w-full max-w-md">
                        <div className="mb-10">
                            <h1 className="text-3xl font-bold tracking-tight">
                                Bergabung dengan Eventnusa
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                Buat akun untuk mulai mengelola event Anda
                            </p>
                        </div>

                        {errors.csrf && (
                            <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 text-sm">
                                {errors.csrf}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-6">
                            {/* Nama Lengkap */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Lengkap</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={data.name}
                                        className="pl-10"
                                        autoComplete="name"
                                        onChange={(e) =>
                                            setData("name", e.target.value)
                                        }
                                        required
                                    />
                                </div>
                                <InputError message={errors.name} />
                            </div>

                            {/* Nama Panggilan */}
                            <div className="space-y-2">
                                <Label htmlFor="username">Nama Panggilan</Label>
                                <div className="relative">
                                    <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="username"
                                        type="text"
                                        name="username"
                                        value={data.username}
                                        className="pl-10"
                                        autoComplete="username"
                                        onChange={(e) =>
                                            setData("username", e.target.value)
                                        }
                                        required
                                    />
                                </div>
                                <InputError message={errors.username} />
                            </div>

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
                                        onChange={(e) =>
                                            setData("email", e.target.value)
                                        }
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
                                        autoComplete="new-password"
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
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

                            {/* Konfirmasi Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">
                                    Konfirmasi Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="password_confirmation"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        className="pl-10 pr-10"
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
                                <InputError
                                    message={errors.password_confirmation}
                                />
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
                                    "Daftar"
                                )}
                            </Button>

                            {/* Google Signup (placeholder) */}
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                size="lg"
                                disabled
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
                                Daftar dengan Google
                            </Button>

                            {/* Sign in link */}
                            <div className="text-center text-sm text-muted-foreground pt-4">
                                Sudah punya akun?{" "}
                                <Link
                                    href="/login"
                                    className="text-primary font-medium hover:underline"
                                >
                                    Masuk
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
