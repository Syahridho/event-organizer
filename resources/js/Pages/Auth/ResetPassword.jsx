import { useEffect } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import InputError from "@/components/InputError";
import { Head, useForm } from "@inertiajs/react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { LoaderCircle } from "lucide-react";
import { useCsrfToken } from "@/hooks/useCsrfToken";

export default function ResetPassword({ token, email }) {
    const { csrfToken, refreshToken } = useCsrfToken();
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: "",
        password_confirmation: "",
        // Don't add _token here - global handler in app.jsx will add it automatically
    });

    useEffect(() => {
        return () => {
            reset("password", "password_confirmation");
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();

        // Ensure we have the latest CSRF token in meta tag before submitting
        refreshToken();

        post(route("password.store"), {
            onFinish: () => reset("password", "password_confirmation"),
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
            <Head title="Reset Password" />
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Reset Password</CardTitle>
                    {errors.csrf && (
                        <div className="mb-4 font-medium text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                            {errors.csrf}
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit}>
                        <div className="grid gap-2 mb-4">
                            <Label htmlFor="email" value="email">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                autoComplete="username"
                                className="mt-1 block w-full"
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

                        <div className="grid gap-2 mb-4">
                            <Label htmlFor="password" value="password">
                                Password
                            </Label>

                            <Input
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="mt-1 block w-full"
                                autoComplete="new-password"
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

                        <div className="grid gap-2">
                            <Label
                                htmlFor="password_confirmation"
                                value="Konfimasi Password"
                            >
                                Konfirmasi Password
                            </Label>

                            <Input
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                className="mt-1 block w-full"
                                autoComplete="new-password"
                                onChange={(e) =>
                                    setData(
                                        "password_confirmation",
                                        e.target.value
                                    )
                                }
                                required
                            />
                            <InputError
                                message={errors.password_confirmation}
                                className="mt-2"
                            />
                        </div>

                        <div className="flex items-center justify-end mt-4">
                            <Button
                                type="submit"
                                className="ml-4"
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    "Reset Password"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </GuestLayout>
    );
}
