import GuestLayout from "@/Layouts/GuestLayout.jsx";
import InputError from "@/Components/InputError.jsx";
import { Head, useForm, Link } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Button } from "@/components/ui/button.jsx";
import { LoaderCircle } from "lucide-react";
import { useCsrfToken } from "@/hooks/useCsrfToken";
import { useEffect } from "react";

export default function ForgotPassword({ status }) {
    const { csrfToken, refreshToken } = useCsrfToken();
    const { data, setData, post, processing, errors } = useForm({
        email: "",
    });

    const submit = (e) => {
        e.preventDefault();

        refreshToken();

        post(route("password.email"), {
            onError: (errors) => {
                if (errors.csrf || errors._token) {
                    refreshToken();
                }
            },
        });
    };

    return (
        <GuestLayout>
            <Head title="Lupa Password" />
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Lupa Password</CardTitle>
                    <CardDescription>
                        Masukkan email Anda di bawah ini untuk mereset password
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
                                    "Reset"
                                )}
                            </Button>
                        </div>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        Sudah ganti password?{" "}
                        <Link
                            href="/login"
                            className="underline underline-offset-4"
                        >
                            Masuk
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </GuestLayout>
    );
}
