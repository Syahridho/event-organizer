"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { router, usePage, Head } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
    pin: z.string().regex(/^\d{6}$/, {
        message: "OTP harus terdiri dari 6 angka.",
    }),
});

export default function OtpPage() {
    const { user_email: emailFromProps, flash } = usePage().props;

    const [uiError, setUiError] = useState({
        pin: false,
        loading: false,
        sendAgain: false,
        errorMessage: "",
        resendLoading: false,
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
        setUiError((prev) => ({
            ...prev,
            loading: true,
            sendAgain: false,
        }));
        router.post(
            route("otp.verify"),
            { otp: values.pin },
            {
                onSuccess: (page) => {
                    setUiError({
                        pin: false,
                        loading: false,
                        sendAgain: false,
                        resendLoading: false,
                        errorMessage: "",
                    });
                    // Show success toast from flash message
                    if (page.props.flash?.success) {
                        toast.success(page.props.flash.success);
                    }
                },
                onError: (errors) => {
                    setUiError((prev) => ({
                        ...prev,
                        pin: true,
                        loading: false,
                    }));
                    // Show error toast from flash message if available
                    if (errors.flash?.error) {
                        toast.error(errors.flash.error);
                    }
                },
            }
        );
    }

    function resendOtp() {
        // Prevent multiple clicks if already loading
        if (uiError.resendLoading) {
            return;
        }

        setUiError((prev) => ({
            ...prev,
            resendLoading: true,
        }));
        router.post(
            route("otp.resend"),
            { email: email },
            {
                onSuccess: (page) => {
                    setUiError({
                        pin: false,
                        loading: false,
                        sendAgain: true,
                        resendLoading: false,
                        errorMessage: "",
                    });
                    // Show success toast from flash message
                    if (page.props.flash?.success) {
                        toast.success(page.props.flash.success);
                    }
                },
                onError: (errors) => {
                    setUiError({
                        pin: false,
                        loading: false,
                        sendAgain: false,
                        resendLoading: false,
                        errorMessage: "",
                    });
                    // Show error toast from flash message if available
                    if (errors.flash?.error) {
                        toast.error(errors.flash.error);
                    } else {
                        toast.error("Gagal mengirim OTP. Silakan coba lagi.");
                    }
                },
            }
        );
    }

    useEffect(() => {
        if (emailFromProps) {
            localStorage.setItem("user_email", emailFromProps);
        }
    }, [emailFromProps]);

    // Show flash messages as toasts on component mount
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

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

    // Auto-submit when OTP is complete (6 digits)
    useEffect(() => {
        const currentValue = form.getValues().pin;
        if (
            currentValue &&
            currentValue.length === 6 &&
            currentValue.match(/^\d{6}$/)
        ) {
            form.handleSubmit(onSubmit)();
        }
    }, [form.watch("pin")]);

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-background">
            <Head title="OTP" />
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
                                            <InputOTP
                                                maxLength={6}
                                                pattern="\d*"
                                                {...field}
                                            >
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
                                        {uiError.errorMessage && (
                                            <FormDescription className="text-red-500">
                                                {uiError.errorMessage}
                                            </FormDescription>
                                        )}
                                        <FormMessage />
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

                    <div className="mt-2 text-right">
                        <Button
                            type="button"
                            variant="link"
                            className="text-xs text-blue-500 p-0"
                            onClick={resendOtp}
                            disabled={uiError.loading || uiError.resendLoading}
                        >
                            {uiError.resendLoading ? (
                                <>
                                    <Loader2 className="animate-spin mr-1" />
                                    Mengirim...
                                </>
                            ) : (
                                "Kirim Ulang OTP"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
