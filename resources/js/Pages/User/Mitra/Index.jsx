import React, { useState, useEffect } from "react";
import { useForm, usePage, router, Head } from "@inertiajs/react";
import { toast } from "sonner";
import { useCsrfToken } from "@/hooks/useCsrfToken";
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

import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card.jsx";
import { Stepper } from "@/components/stepper.jsx";
import GuestLayout from "@/Layouts/GuestLayout.jsx";

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
        <div className="max-w-2xl mx-auto">
            <Head title="Gabung jadi mitra" />
            <div className="py-4 px-3">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-4 sm:mb-6 lg:mb-10 xl:mb-12">
                        <div className="flex items-center justify-center mb-3">
                            <div className="bg-primary/10 p-3 rounded-full">
                                <Building2 className="h-10 w-10 text-primary" />
                            </div>
                        </div>
                        <h1 className="font-bold text-slate-800 mb-1 px-4 leading-tight text-xl">
                            Pendaftaran Mitra Bisnis
                        </h1>
                        <p className="text-slate-600 px-4 max-w-3xl mx-auto text-base">
                            Bergabunglah bersama kami dan kembangkan bisnis Anda
                            ke tingkat yang lebih tinggi
                        </p>
                    </div>

                    {/* Stepper */}
                    <div className="mb-6">
                        <Stepper steps={steps} currentStep={currentStep} />
                    </div>

                    {/* Step Content */}
                    <div className="mt-4">
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
        </div>
    );
}

// ==================== STEP 1: Register Account ====================
function Step1RegisterAccount() {
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

        // Refresh CSRF token before submitting
        await refreshToken();

        post(route("register"), {
            onSuccess: () => {
                toast.success("Akun berhasil dibuat!", {
                    description: "Silakan lengkapi data mitra Anda.",
                });
            },
            onError: async (err) => {
                // If there's a CSRF error, refresh the token
                if (err.csrf || err._token) {
                    await refreshToken();
                }
                toast.error("Gagal membuat akun", {
                    description: "Periksa kembali data yang Anda masukkan.",
                });
            },
        });
    };

    return (
        <Card className="max-w-3xl mx-auto shadow-xl border-2 hover:shadow-2xl transition-shadow duration-300">
            <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-lg font-bold text-center px-2">
                    Buat Akun Terlebih Dahulu
                </CardTitle>
                <CardDescription className="text-center text-sm px-2">
                    Sudah punya akun?{" "}
                    <a
                        href="/login"
                        className="text-primary hover:underline font-medium"
                    >
                        Login di sini
                    </a>
                </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-6">
                <form onSubmit={submit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm">
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
                                        ? "border-red-500 text-sm h-10"
                                        : "text-sm h-10"
                                }
                            />
                            {errors.name && (
                                <p className="text-red-500 text-sm">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-sm">
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
                                        ? "border-red-500 text-sm h-10"
                                        : "text-sm h-10"
                                }
                            />
                            {errors.username && (
                                <p className="text-red-500 text-sm">
                                    {errors.username}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm">
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
                                    ? "border-red-500 text-sm h-10"
                                    : "text-sm h-10"
                            }
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm">
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
                                        ? "border-red-500 text-sm h-10"
                                        : "text-sm h-10"
                                }
                            />
                            {errors.password && (
                                <p className="text-red-500 text-sm">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="password_confirmation"
                                className="text-sm"
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
                                        ? "border-red-500 text-sm h-10"
                                        : "text-sm h-10"
                                }
                            />
                            {errors.password_confirmation && (
                                <p className="text-red-500 text-sm">
                                    {errors.password_confirmation}
                                </p>
                            )}
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={processing}
                        className="w-full mt-4 text-sm"
                        size="lg"
                    >
                        {processing ? (
                            <>
                                <Clock className="h-4 w-4 mr-2 animate-spin" />
                                <span>Mendaftar...</span>
                            </>
                        ) : (
                            <>
                                <span>Daftar & Lanjutkan</span>
                                <ArrowRight className="h-4 w-4 ml-2" />
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
    const { refreshToken } = useCsrfToken();

    const { data, setData, post, processing, errors, progress } = useForm({
        address: "",
        description: "",
        npwp_number: "",
        npwp_file: null,
        business_file: null,
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Refresh CSRF token before submitting to ensure it's valid
        await refreshToken();

        post(route("partner.store"), {
            forceFormData: true,
            onSuccess: () => {
                toast.success("Pengajuan Berhasil!", {
                    description:
                        "Pengajuan mitra Anda telah dikirim dan akan segera diulas Admin.",
                });
                onSuccess();
            },
            onError: async (err) => {
                // If there's a CSRF error, refresh the token and show specific error
                if (err.csrf || err._token) {
                    await refreshToken();
                    toast.error("Sesi Anda Telah Berakhir", {
                        description: "Silakan coba kirim formulir kembali.",
                    });
                } else {
                    toast.error("Gagal Mengajukan", {
                        description: "Periksa kembali data yang Anda masukkan.",
                    });
                }
                console.error("Form Errors:", err);
            },
        });
    };

    return (
        <Card className="max-w-5xl mx-auto shadow-xl border-2 hover:shadow-2xl transition-shadow duration-300">
            <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-lg font-bold text-center px-2">
                    Lengkapi Data Mitra
                </CardTitle>
                <CardDescription className="text-center text-sm px-2">
                    Isi formulir di bawah ini untuk mendaftar sebagai mitra
                    resmi kami
                </CardDescription>
            </CardHeader>
            <CardContent className="px-3 pb-6">
                <form
                    onSubmit={handleSubmit}
                    className="space-y-4 sm:space-y-6 lg:space-y-8"
                >
                    {/* User Info Display */}
                    <div className="bg-slate-50 rounded-lg p-3 border">
                        <h3 className="font-semibold text-slate-700 mb-2 sm:mb-3 lg:mb-4 flex items-center text-base">
                            <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                            Informasi Akun
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b">
                            <FileText className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-base">
                                Informasi Perusahaan
                            </h3>
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="address"
                                className="text-sm flex items-center gap-1"
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
                                        ? "border-red-500 text-sm "
                                        : "text-sm "
                                }
                            />
                            {errors.address && (
                                <p className="text-red-500 text-xs lg:text-sm">
                                    {errors.address}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm">
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
                                        ? "border-red-500 text-sm "
                                        : "text-sm "
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
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b">
                            <UploadCloud className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-base">
                                Dokumen Legalitas
                            </h3>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                <p className="text-sm text-amber-800">
                                    Dokumen akan diverifikasi oleh tim kami.
                                    Pastikan file jelas dan valid. Format yang
                                    diterima: JPG, PNG, PDF
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="npwp_number" className="text-sm">
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
                                        ? "border-red-500 text-sm h-10"
                                        : "text-sm h-10"
                                }
                            />
                            {errors.npwp_number && (
                                <p className="text-red-500 text-sm">
                                    {errors.npwp_number}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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
                        className="w-full mt-4 text-sm"
                        size="lg"
                    >
                        {processing ? (
                            <>
                                <Clock className="h-4 w-4 mr-2 animate-spin" />
                                <span>Mengirim Data...</span>
                            </>
                        ) : (
                            <>
                                <span>Ajukan Pendaftaran</span>
                                <CheckCircle2 className="h-4 w-4 ml-2" />
                            </>
                        )}
                    </Button>

                    {Object.keys(errors).length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-red-800 text-base">
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
    const [showReapplyDialog, setShowReapplyDialog] = React.useState(false);
    const [isReapplying, setIsReapplying] = React.useState(false);

    const handleReapply = () => {
        setIsReapplying(true);

        router.post(
            route("partner.reapply"),
            {},
            {
                preserveState: false,
                onSuccess: () => {
                    setShowReapplyDialog(false);
                    setIsReapplying(false);
                    toast.success("Berhasil!", {
                        description:
                            "Data lama telah dihapus. Silakan lengkapi formulir kembali.",
                    });
                },
                onError: (errors) => {
                    setIsReapplying(false);
                    toast.error("Gagal", {
                        description:
                            errors.message ||
                            "Terjadi kesalahan saat menghapus data lama.",
                    });
                },
            }
        );
    };

    if (!existingMitra) {
        return (
            <Card className="max-w-3xl mx-auto shadow-xl border-2">
                <CardContent className="p-6 text-center">
                    <Clock className="h-12 w-12 mx-auto text-slate-400 mb-4 animate-pulse" />
                    <h2 className="text-xl font-bold text-slate-700 mb-2">
                        Loading...
                    </h2>
                    <p className="text-base text-slate-600">
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
                className="bg-green-600 hover:bg-green-700 text-base"
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
            <>
                <Button
                    size="lg"
                    onClick={() => setShowReapplyDialog(true)}
                    className="bg-red-600 hover:bg-red-700 text-base"
                    disabled={isReapplying}
                >
                    {isReapplying ? "Memproses..." : "Ajukan Kembali"}
                </Button>

                {/* Confirmation Dialog */}
                {showReapplyDialog && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="max-w-md w-full">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                                    Konfirmasi Ajukan Kembali
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-slate-600">
                                    Dengan mengajukan kembali, data pengajuan
                                    lama Anda akan{" "}
                                    <strong>dihapus permanen</strong> termasuk
                                    dokumen yang telah diupload.
                                </p>
                                <p className="text-sm text-slate-600">
                                    Anda akan kembali ke <strong>Step 2</strong>{" "}
                                    untuk mengisi formulir dari awal dengan data
                                    yang baru.
                                </p>
                                <p className="text-sm font-medium text-slate-800">
                                    Apakah Anda yakin ingin melanjutkan?
                                </p>
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setShowReapplyDialog(false)
                                        }
                                        className="flex-1"
                                        disabled={isReapplying}
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        onClick={handleReapply}
                                        className="flex-1 bg-red-600 hover:bg-red-700"
                                        disabled={isReapplying}
                                    >
                                        {isReapplying ? (
                                            <>
                                                <Clock className="h-4 w-4 mr-2 animate-spin" />
                                                Memproses...
                                            </>
                                        ) : (
                                            "Ya, Ajukan Kembali"
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </>
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
            className={`max-w-3xl mx-auto shadow-xl border-2 ${bgColor} hover:shadow-2xl transition-shadow duration-300`}
        >
            <CardContent className="p-6 text-center">
                <IconComponent
                    className={`h-16 w-16 mx-auto mb-4 ${iconColor} ${
                        isPending ? "animate-pulse" : ""
                    }`}
                />
                <h2 className="text-2xl font-bold text-slate-800 mb-3 px-2">
                    {title}
                </h2>
                <p className="text-base text-slate-700 mb-6 leading-relaxed px-2 max-w-3xl mx-auto">
                    {description}
                </p>

                {isPending && (
                    <div className="bg-white rounded-lg p-4 shadow-md">
                        <div className="flex items-center justify-center gap-2 text-slate-600">
                            <Clock className="h-4 w-4 animate-pulse" />
                            <span className="font-medium text-sm">
                                Status: Menunggu Verifikasi
                            </span>
                        </div>
                    </div>
                )}

                {buttonAction && <div className="mt-4">{buttonAction}</div>}
            </CardContent>
        </Card>
    );
}

// ==================== Helper Components ====================
const InfoItem = ({ icon, label, value }) => (
    <div className="bg-white rounded-md p-2 border shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-1 text-slate-500 text-sm mb-1">
            {icon}
            <span className="font-medium uppercase">{label}</span>
        </div>
        <p className="text-slate-800 font-medium truncate text-sm">{value}</p>
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
        <Label htmlFor={id} className="block text-sm">
            {label} <span className="text-red-500">*</span>
            <br />
            <span className="text-sm text-slate-500 font-normal">
                {sublabel}
            </span>
        </Label>
        {progress && progress.percentage && (
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
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
                    ? "border-red-500 text-sm cursor-pointer"
                    : "text-sm cursor-pointer"
            }
        />
        {progress && progress.percentage && (
            <p className="text-sm text-slate-500">
                Mengunggah: {progress.percentage}%
            </p>
        )}
        {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
);
