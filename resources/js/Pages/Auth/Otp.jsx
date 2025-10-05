"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { router, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2 } from "lucide-react";

const FormSchema = z.object({
    pin: z.string().min(6, {
        message: "OTP harus terdiri dari 6 angka.",
    }),
});

export default function OtpPage() {
    const { user_email: emailFromProps } = usePage().props;
    console.log(usePage().props);

    const [uiError, setUiError] = useState({
        pin: false,
        loading: false,
        sendAgain: false,
    });

    const [email, setEmail] = useState(() => {
        return emailFromProps ?? localStorage.getItem("user_email") ?? "";
    });

    const form = useForm({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            pin: "",
        },
    });

    function onSubmit(values) {
        setUiError({
            pin: false,
            loading: true,
            sendAgain: false,
        });
        router.post(
            route("otp.verify"),
            { otp: values.pin },
            {
                onSuccess: () => {
                    console.log("OTP valid ✅");
                    setUiError({
                        pin: false,
                        loading: false,
                        sendAgain: false,
                    });
                },
                onError: (errors) => {
                    console.error("OTP tidak valid ❌", errors);
                    setUiError({
                        pin: true,
                        loading: false,
                        sendAgain: false,
                    });
                },
            }
        );
    }

    function resendOtp() {
        setUiError({
            pin: false,
            loading: true,
            sendAgain: false,
        });
        router.post(
            route("otp.resend"),
            { email: email },
            {
                onSuccess: () => {
                    console.log("OTP baru telah dikirim ke email kamu.");
                    setUiError({
                        pin: false,
                        loading: false,
                        sendAgain: true,
                    });
                },
                onError: (errors) => {
                    console.error("Gagal mengirim OTP baru:", errors);
                    setUiError({
                        pin: false,
                        loading: false,
                        sendAgain: false,
                    });
                },
            }
        );
    }

    useEffect(() => {
        if (emailFromProps) {
            localStorage.setItem("user_email", emailFromProps);
        }
    }, [emailFromProps]);

    useEffect(() => {
        const subscription = form.watch((value) => {
            if (uiError.pin && value.pin.length !== 6) {
                setUiError((prev) => ({
                    ...prev,
                    pin: false,
                }));
            }
        });

        return () => subscription.unsubscribe();
    }, [form, uiError.pin]);

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-background">
            <div className="w-full max-w-md p-6 shadow-md">
                <div className="mb-6">
                    <h1 className="text-2xl mb-2 font-bold">Verifikasi OTP</h1>
                    <p className="text-xs text-muted-foreground">
                        Kode OTP telah dikirim{" "}
                        {uiError.sendAgain && (
                            <span className="text-green-500">ulang</span>
                        )}{" "}
                        ke
                    </p>
                    <p className="font-semibold text-xs text-foreground">
                        {email}
                    </p>
                </div>

                <div className="flex flex-col justify-center">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-6"
                        >
                            <FormField
                                control={form.control}
                                name="pin"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>One-Time Password</FormLabel>
                                        <FormControl>
                                            <InputOTP maxLength={12} {...field}>
                                                <InputOTPGroup>
                                                    <InputOTPSlot index={0} />
                                                    <InputOTPSlot index={1} />
                                                    <InputOTPSlot index={2} />
                                                    <InputOTPSlot index={3} />
                                                    <InputOTPSlot index={4} />
                                                    <InputOTPSlot index={5} />
                                                </InputOTPGroup>
                                            </InputOTP>
                                        </FormControl>
                                        {uiError.pin && (
                                            <FormDescription className="text-red-500">
                                                OTP tidak valid. Silakan coba
                                                lagi.
                                            </FormDescription>
                                        )}
                                        <FormMessage />
                                        <div className="mt-2 text-right">
                                            <Button
                                                type="button"
                                                variant="link"
                                                className="text-xs text-blue-500 p-0"
                                                onClick={resendOtp}
                                            >
                                                Kirim Ulang OTP
                                            </Button>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <Button type="submit">
                                {uiError.loading ? (
                                    <>
                                        <Loader2 className="animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    "Kirim"
                                )}
                            </Button>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
}
