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

import Checkbox from "@/components/Checkbox";
import GuestLayout from "@/Layouts/GuestLayout";
import InputError from "@/components/InputError";
import { Head, Link, useForm } from "@inertiajs/react";
import { LoaderCircle } from "lucide-react";

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route("login"), {
            onFinish: () => reset("password"),
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
                                                className="underline text-sm italic"
                                            >
                                                Lupa Password?
                                            </Link>
                                        )}
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        className="mt-1 block w-full"
                                        autoComplete="current-password"
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                        required
                                    />
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
                                        <span className="ml-2 text-sm">
                                            ingat saya
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
