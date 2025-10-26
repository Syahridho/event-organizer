import React, { useState, useEffect } from "react";
import { useForm, usePage, router } from "@inertiajs/react";
import { toast } from "sonner";
import {
    CircleCheck,
    AlertTriangle,
    Clock,
    UserCheck,
    FileText,
    UploadCloud,
    XCircle,
    Building2,
    ArrowRight,
    CheckCircle2,
    Mail,
    Phone,
    MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Stepper } from "@/Components/stepper";
import GuestLayout from "@/Layouts/GuestLayout";

export default function PartnerRegistration({ existingMitra }) {
    const { props } = usePage();
    const { user } = props.auth;

    // Determine current step based on user authentication and mitra status
    const getCurrentStep = () => {
        if (!user) return 1; // Not logged in - show registration form
        if (!existingMitra) return 2; // Logged in but no mitra record - show partner form
        return 3; // Has mitra record - show status
    };

    const [currentStep, setCurrentStep] = useState(getCurrentStep());

    const steps = [
        {
            id: 1,
            label: "Buat Akun",
            description: "Daftar atau login",
        },
        {
            id: 2,
            label: "Data Mitra",
            description: "Lengkapi formulir",
        },
        {
            id: 3,
            label: "Verifikasi",
            description: "Tunggu persetujuan",
        },
    ];

    return (
        <GuestLayout>
            <div className="py-4 sm:py-6 lg:py-10 xl:py-12 px-3 sm:px-4 lg:px-6 xl:px-8 2xl:px-12">
                <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto">
                    {/* Header */}
                    <div className="text-center mb-4 sm:mb-6 lg:mb-10 xl:mb-12">
                        <div className="flex items-center justify-center mb-3 sm:mb-4 lg:mb-6">
                            <div className="bg-primary/10 p-3 sm:p-4 lg:p-5 xl:p-6 rounded-full">
                                <Building2 className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 xl:h-20 xl:w-20 text-primary" />
                            </div>
                        </div>
                        <h1 className="text-2xl sm:text-3xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-slate-800 mb-1 sm:mb-2 lg:mb-3 px-4 leading-tight">
                            Pendaftaran Mitra Bisnis
                        </h1>
                        <p className="text-slate-600 text-xs sm:text-sm lg:text-lg xl:text-xl px-4 max-w-3xl mx-auto">
                            Bergabunglah bersama kami dan kembangkan bisnis Anda ke tingkat yang lebih tinggi
                        </p>
                    </div>

                    {/* Stepper */}
                    <div className="mb-6 sm:mb-8 lg:mb-12">
                        <Stepper steps={steps} currentStep={currentStep} />
                    </div>

                    {/* Step Content */}
                    <div className="mt-4 sm:mt-6 lg:mt-8 xl:mt-10">
                        {currentStep === 1 && <Step1RegisterAccount />}
                        {currentStep === 2 && (
                            <Step2PartnerForm
                                user={user}
                                onSuccess={() => setCurrentStep(3)}
                            />
                        )}
                        {currentStep === 3 && (
                            <Step3Status existingMitra={existingMitra} />
                        )}
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}

// ==================== STEP 1: Register Account ====================
function Step1RegisterAccount() {
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

    const submit = (e) => {
        e.preventDefault();
        post(route("register"), {
            onSuccess: () => {
                toast.success("Akun berhasil dibuat!", {
                    description: "Silakan lengkapi data mitra Anda.",
                });
            },
            onError: () => {
                toast.error("Gagal membuat akun", {
                    description: "Periksa kembali data yang Anda masukkan.",
                });
            },
        });
    };

    return (
        <Card className="max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-auto shadow-xl border-2 hover:shadow-2xl transition-shadow duration-300">
            <CardHeader className="space-y-1 pb-4 sm:pb-6 lg:pb-8 xl:pb-10">
                <CardTitle className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold text-center px-2">
                    Buat Akun Terlebih Dahulu
                </CardTitle>
                <CardDescription className="text-center text-xs sm:text-sm lg:text-base xl:text-lg px-2">
                    Sudah punya akun?{" "}
                    <a
                        href="/login"
                        className="text-primary hover:underline font-medium"
                    >
                        Login di sini
                    </a>
                </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 lg:px-8 xl:px-12 pb-6 sm:pb-8 lg:pb-10 xl:pb-12">
                <form
                    onSubmit={submit}
                    className="space-y-3 sm:space-y-4 lg:space-y-6"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
                        <div className="space-y-2">
                            <Label
                                htmlFor="name"
                                className="text-sm lg:text-base xl:text-lg"
                            >
                                Nama Lengkap{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                placeholder="John Doe"
                                required
                                className={
                                    errors.name
                                        ? "border-red-500 text-sm lg:text-base xl:text-lg h-10 lg:h-12 xl:h-14"
                                        : "text-sm lg:text-base xl:text-lg h-10 lg:h-12 xl:h-14"
                                }
                            />
                            {errors.name && (
                                <p className="text-red-500 text-xs lg:text-sm">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="username"
                                className="text-sm lg:text-base xl:text-lg"
                            >
                                Nama Panggilan{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="username"
                                type="text"
                                value={data.username}
                                onChange={(e) =>
                                    setData("username", e.target.value)
                                }
                                placeholder="johndoe"
                                required
                                className={
                                    errors.username
                                        ? "border-red-500 text-sm lg:text-base xl:text-lg h-10 lg:h-12 xl:h-14"
                                        : "text-sm lg:text-base xl:text-lg h-10 lg:h-12 xl:h-14"
                                }
                            />
                            {errors.username && (
                                <p className="text-red-500 text-xs lg:text-sm">
                                    {errors.username}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label
                            htmlFor="email"
                            className="text-sm lg:text-base xl:text-lg"
                        >
                            Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                            placeholder="john@example.com"
                            required
                            className={
                                errors.email
                                    ? "border-red-500 text-sm lg:text-base xl:text-lg h-10 lg:h-12 xl:h-14"
                                    : "text-sm lg:text-base xl:text-lg h-10 lg:h-12 xl:h-14"
                            }
                        />
                        {errors.email && (
                            <p className="text-red-500 text-xs lg:text-sm">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
                        <div className="space-y-2">
                            <Label
                                htmlFor="password"
                                className="text-sm lg:text-base xl:text-lg"
                            >
                                Password <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                                placeholder="••••••••"
                                required
                                className={
                                    errors.password
                                        ? "border-red-500 text-sm lg:text-base xl:text-lg h-10 lg:h-12 xl:h-14"
                                        : "text-sm lg:text-base xl:text-lg h-10 lg:h-12 xl:h-14"
                                }
                            />
                            {errors.password && (
                                <p className="text-red-500 text-xs lg:text-sm">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="password_confirmation"
                                className="text-sm lg:text-base xl:text-lg"
                            >
                                Konfirmasi Password{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) =>
                                    setData(
                                        "password_confirmation",
                                        e.target.value
                                    )
                                }
                                placeholder="••••••••"
                                required
                                className={
                                    errors.password_confirmation
                                        ? "border-red-500 text-sm lg:text-base xl:text-lg h-10 lg:h-12 xl:h-14"
                                        : "text-sm lg:text-base xl:text-lg h-10 lg:h-12 xl:h-14"
                                }
                            />
                            {errors.password_confirmation && (
                                <p className="text-red-500 text-xs lg:text-sm">
                                    {errors.password_confirmation}
                                </p>
                            )}
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={processing}
                        className="w-full mt-4 sm:mt-6 lg:mt-8 h-11 lg:h-13 xl:h-16 text-sm sm:text-base lg:text-lg xl:text-xl"
                        size="lg"
                    >
                        {processing ? (
                            <>
                                <Clock className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-2 animate-spin" />
                                <span>Mendaftar...</span>
                            </>
                        ) : (
                            <>
                                <span>Daftar & Lanjutkan</span>
                                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ml-2" />
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

// ==================== STEP 2: Partner Form ====================
function Step2PartnerForm({ user, onSuccess }) {
    const { data, setData, post, processing, errors, progress } = useForm({
        address: "",
        description: "",
        npwp_number: "",
        npwp_file: null,
        business_file: null,
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        post(route("partner.store"), {
            forceFormData: true,
            onSuccess: () => {
                toast.success("Pengajuan Berhasil!", {
                    description:
                        "Pengajuan mitra Anda telah dikirim dan akan segera diulas Admin.",
                });
                onSuccess();
            },
            onError: (err) => {
                toast.error("Gagal Mengajukan", {
                    description: "Periksa kembali data yang Anda masukkan.",
                });
                console.error("Form Errors:", err);
            },
        });
    };

    return (
        <Card className="max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto shadow-xl border-2 hover:shadow-2xl transition-shadow duration-300">
            <CardHeader className="space-y-1 pb-4 sm:pb-6 lg:pb-8 xl:pb-10">
                <CardTitle className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold text-center px-2">
                    Lengkapi Data Mitra
                </CardTitle>
                <CardDescription className="text-center text-xs sm:text-sm lg:text-base xl:text-lg px-2">
                    Isi formulir di bawah ini untuk mendaftar sebagai mitra
                    resmi kami
                </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 lg:px-8 xl:px-12 2xl:px-16 pb-6 sm:pb-8 lg:pb-10 xl:pb-12">
                <form
                    onSubmit={handleSubmit}
                    className="space-y-4 sm:space-y-6 lg:space-y-8"
                >
                    {/* User Info Display */}
                    <div className="bg-slate-50 rounded-lg p-3 sm:p-4 lg:p-6 xl:p-8 border">
                        <h3 className="font-semibold text-slate-700 mb-2 sm:mb-3 lg:mb-4 flex items-center text-sm sm:text-base lg:text-lg xl:text-xl">
                            <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 mr-2" />
                            Informasi Akun
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 xl:gap-6">
                            <InfoItem
                                icon={
                                    <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                                }
                                label="Nama"
                                value={user.name}
                            />
                            <InfoItem
                                icon={
                                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                                }
                                label="Email"
                                value={user.email}
                            />
                            <InfoItem
                                icon={
                                    <Phone className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                                }
                                label="Telepon"
                                value={user.phone || "Belum tersedia"}
                            />
                        </div>
                    </div>

                    {/* Company Information */}
                    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                        <div className="flex items-center gap-2 lg:gap-3 pb-2 lg:pb-3 border-b">
                            <FileText className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 text-primary" />
                            <h3 className="font-semibold text-base sm:text-lg lg:text-xl xl:text-2xl">
                                Informasi Perusahaan
                            </h3>
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="address"
                                className="text-sm lg:text-base xl:text-lg flex items-center gap-1"
                            >
                                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 inline" />
                                Alamat Kantor/Domisili Lengkap{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="address"
                                value={data.address}
                                onChange={(e) =>
                                    setData("address", e.target.value)
                                }
                                rows={3}
                                placeholder="Contoh: Jalan Merdeka No. 10, RT 02/RW 05, Kelurahan Menteng, Kecamatan Menteng, Jakarta Pusat 10310"
                                className={
                                    errors.address
                                        ? "border-red-500 text-sm lg:text-base xl:text-lg"
                                        : "text-sm lg:text-base xl:text-lg"
                                }
                            />
                            {errors.address && (
                                <p className="text-red-500 text-xs lg:text-sm">
                                    {errors.address}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="description"
                                className="text-sm lg:text-base xl:text-lg"
                            >
                                Deskripsi Layanan{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="description"
                                rows={4}
                                value={data.description}
                                onChange={(e) =>
                                    setData("description", e.target.value)
                                }
                                placeholder="Jelaskan bidang usaha dan layanan yang Anda tawarkan (minimal 10 karakter)"
                                className={
                                    errors.description
                                        ? "border-red-500 text-sm lg:text-base xl:text-lg"
                                        : "text-sm lg:text-base xl:text-lg"
                                }
                            />
                            {errors.description && (
                                <p className="text-red-500 text-xs lg:text-sm">
                                    {errors.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Legal Documents */}
                    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                        <div className="flex items-center gap-2 lg:gap-3 pb-2 lg:pb-3 border-b">
                            <UploadCloud className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 text-primary" />
                            <h3 className="font-semibold text-base sm:text-lg lg:text-xl xl:text-2xl">
                                Dokumen Legalitas
                            </h3>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 lg:p-5 xl:p-6">
                            <div className="flex items-start gap-2 lg:gap-3">
                                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-amber-600 mt-0.5 shrink-0" />
                                <p className="text-xs sm:text-sm lg:text-base xl:text-lg text-amber-800">
                                    Dokumen akan diverifikasi oleh tim kami.
                                    Pastikan file jelas dan valid. Format yang
                                    diterima: JPG, PNG, PDF
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="npwp_number"
                                className="text-sm lg:text-base xl:text-lg"
                            >
                                Nomor NPWP{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="npwp_number"
                                type="text"
                                value={data.npwp_number}
                                onChange={(e) =>
                                    setData("npwp_number", e.target.value)
                                }
                                placeholder="Masukkan 15-20 digit Nomor NPWP"
                                className={
                                    errors.npwp_number
                                        ? "border-red-500 text-sm lg:text-base xl:text-lg h-10 lg:h-12 xl:h-14"
                                        : "text-sm lg:text-base xl:text-lg h-10 lg:h-12 xl:h-14"
                                }
                            />
                            {errors.npwp_number && (
                                <p className="text-red-500 text-xs lg:text-sm">
                                    {errors.npwp_number}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
                            <FileUploadField
                                id="npwp_file"
                                label="Scan Kartu NPWP"
                                sublabel="(Maks 2MB, JPG/PNG/PDF)"
                                onChange={(e) =>
                                    setData("npwp_file", e.target.files[0])
                                }
                                error={errors.npwp_file}
                                progress={
                                    progress && data.npwp_file ? progress : null
                                }
                            />
                            <FileUploadField
                                id="business_file"
                                label="Berkas Izin Usaha/Akta"
                                sublabel="(Maks 5MB, JPG/PNG/PDF)"
                                onChange={(e) =>
                                    setData("business_file", e.target.files[0])
                                }
                                error={errors.business_file}
                                progress={
                                    progress && data.business_file
                                        ? progress
                                        : null
                                }
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={processing}
                        className="w-full mt-4 sm:mt-6 lg:mt-8 h-11 lg:h-13 xl:h-16 text-sm sm:text-base lg:text-lg xl:text-xl"
                        size="lg"
                    >
                        {processing ? (
                            <>
                                <Clock className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-2 animate-spin" />
                                <span>Mengirim Data...</span>
                            </>
                        ) : (
                            <>
                                <span>Ajukan Pendaftaran</span>
                                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ml-2" />
                            </>
                        )}
                    </Button>

                    {Object.keys(errors).length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 lg:p-5">
                            <p className="text-red-800 text-xs sm:text-sm lg:text-base">
                                Terdapat {Object.keys(errors).length} kesalahan
                                pada formulir. Silakan periksa kembali.
                            </p>
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}

// ==================== STEP 3: Status ====================
function Step3Status({ existingMitra }) {
    if (!existingMitra) {
        return (
            <Card className="max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-auto shadow-xl border-2">
                <CardContent className="p-6 sm:p-8 lg:p-12 xl:p-16 text-center">
                    <Clock className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 xl:h-24 xl:w-24 mx-auto text-slate-400 mb-4 lg:mb-6 animate-pulse" />
                    <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-slate-700 mb-2">
                        Loading...
                    </h2>
                    <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-slate-600">
                        Sedang memuat status pengajuan Anda
                    </p>
                </CardContent>
            </Card>
        );
    }

    const status = existingMitra.status;
    const isPending = status === "pending";
    const isApproved = status === "approved";
    const isRejected = status === "rejected";

    let icon, title, description, bgColor, iconColor, buttonAction;

    if (isApproved) {
        icon = CircleCheck;
        title = "Selamat! Anda Mitra Resmi Kami";
        description =
            "Pengajuan mitra Anda telah disetujui. Anda kini memiliki akses penuh ke fitur dan keuntungan mitra. Silakan lanjutkan ke halaman dashboard Anda.";
        bgColor = "bg-green-50";
        iconColor = "text-green-600";
        buttonAction = (
            <Button
                size="lg"
                onClick={() => router.visit(route("mitra.dashboard"))}
                className="bg-green-600 hover:bg-green-700 text-sm sm:text-base lg:text-lg xl:text-xl h-11 lg:h-13 xl:h-16 px-6 lg:px-8 xl:px-10"
            >
                Menuju Dashboard Mitra
            </Button>
        );
    } else if (isRejected) {
        icon = XCircle;
        title = "Pengajuan Ditolak";
        description =
            "Mohon maaf, pengajuan mitra Anda ditolak. Silakan periksa email Anda untuk alasan penolakan dan perbaiki data/dokumen sebelum mengajukan kembali.";
        bgColor = "bg-red-50";
        iconColor = "text-red-600";
        buttonAction = (
            <Button
                size="lg"
                onClick={() => router.visit(route("partner.create"))}
                className="bg-red-600 hover:bg-red-700 text-sm sm:text-base lg:text-lg xl:text-xl h-11 lg:h-13 xl:h-16 px-6 lg:px-8 xl:px-10"
            >
                Ajukan Kembali
            </Button>
        );
    } else {
        // Pending
        icon = Clock;
        title = "Pengajuan Sedang Diulas";
        description =
            "Terima kasih telah mendaftar sebagai mitra. Dokumen Anda sedang kami verifikasi. Proses ini mungkin memakan waktu 1-3 hari kerja. Anda akan menerima notifikasi email setelah status diperbarui.";
        bgColor = "bg-blue-50";
        iconColor = "text-blue-600";
        buttonAction = null;
    }

    const IconComponent = icon;

    return (
        <Card
            className={`max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-auto shadow-xl border-2 ${bgColor} hover:shadow-2xl transition-shadow duration-300`}
        >
            <CardContent className="p-6 sm:p-8 lg:p-12 xl:p-16 2xl:p-20 text-center">
                <IconComponent
                    className={`h-16 w-16 sm:h-20 sm:w-20 lg:h-28 lg:w-28 xl:h-32 xl:w-32 2xl:h-40 2xl:w-40 mx-auto mb-4 sm:mb-6 lg:mb-8 xl:mb-10 ${iconColor} ${
                        isPending ? "animate-pulse" : ""
                    }`}
                />
                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-slate-800 mb-3 sm:mb-4 lg:mb-6 px-2">
                    {title}
                </h2>
                <p className="text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl text-slate-700 mb-6 sm:mb-8 lg:mb-10 xl:mb-12 leading-relaxed px-2 max-w-3xl mx-auto">
                    {description}
                </p>

                {isPending && (
                    <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 xl:p-10 shadow-md">
                        <div className="flex items-center justify-center gap-2 lg:gap-3 text-slate-600">
                            <Clock className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 animate-pulse" />
                            <span className="font-medium text-sm sm:text-base lg:text-lg xl:text-xl">
                                Status: Menunggu Verifikasi
                            </span>
                        </div>
                    </div>
                )}

                {buttonAction && (
                    <div className="mt-4 sm:mt-6 lg:mt-8 xl:mt-10">
                        {buttonAction}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ==================== Helper Components ====================
const InfoItem = ({ icon, label, value }) => (
    <div className="bg-white rounded-md p-2 sm:p-3 lg:p-4 xl:p-5 border shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-1 sm:gap-2 text-slate-500 text-[10px] sm:text-xs lg:text-sm xl:text-base mb-1">
            {icon}
            <span className="font-medium uppercase">{label}</span>
        </div>
        <p className="text-slate-800 font-medium truncate text-xs sm:text-sm lg:text-base xl:text-lg">
            {value}
        </p>
    </div>
);

const FileUploadField = ({
    id,
    label,
    sublabel,
    onChange,
    error,
    progress,
}) => (
    <div className="space-y-2">
        <Label htmlFor={id} className="block text-sm lg:text-base xl:text-lg">
            {label} <span className="text-red-500">*</span>
            <br />
            <span className="text-[10px] sm:text-xs lg:text-sm text-slate-500 font-normal">
                {sublabel}
            </span>
        </Label>
        {progress && progress.percentage && (
            <div className="w-full h-1.5 sm:h-2 lg:h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                />
            </div>
        )}
        <Input
            id={id}
            type="file"
            onChange={onChange}
            accept=".jpg,.jpeg,.png,.pdf"
            className={
                error
                    ? "border-red-500 text-xs sm:text-sm lg:text-base cursor-pointer"
                    : "text-xs sm:text-sm lg:text-base cursor-pointer"
            }
        />
        {progress && progress.percentage && (
            <p className="text-[10px] sm:text-xs lg:text-sm text-slate-500">
                Mengunggah: {progress.percentage}%
            </p>
        )}
        {error && <p className="text-red-500 text-xs lg:text-sm">{error}</p>}
    </div>
);
