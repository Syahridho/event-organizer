import React from "react";
import { useForm, usePage } from "@inertiajs/react";
import { toast } from "sonner";
import {
    CircleCheck,
    AlertTriangle,
    Clock,
    UserCheck,
    FileText,
    UploadCloud,
    XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function PartnerRegistrationForm({ status }) {
    const currentStatus = status && status.length > 0 ? status[0].status : null;

    if (currentStatus) {
        const isPending = currentStatus === "pending";
        const isApproved = currentStatus === "approved";
        const isRejected = currentStatus === "rejected";

        if (isPending || isApproved || isRejected) {
            return (
                <div className="max-w-4xl mx-auto my-16 p-8 bg-white shadow-xl rounded-xl border border-gray-100">
                    <StatusDisplay
                        status={currentStatus}
                        isPending={isPending}
                        isApproved={isApproved}
                        isRejected={isRejected}
                    />
                </div>
            );
        }
    }

    const { props } = usePage();
    const { user } = props.auth;

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
                toast.success("Pengajuan Berhasil", {
                    description:
                        "Pengajuan mitra Anda telah dikirim dan akan segera diulas Admin.",
                });
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
        <form
            onSubmit={handleSubmit}
            className="p-8 md:p-12 bg-white shadow-2xl rounded-2xl max-w-4xl mx-auto my-12 border border-gray-200"
        >
            <div className="text-center mb-10">
                <UserCheck
                    className={`h-12 w-12 mx-auto text-slate-600 mb-3`}
                />
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800">
                    Daftar Mitra Bisnis
                </h2>
                <p className="text-gray-500 mt-2">
                    Lengkapi data dan legalitas untuk menjadi mitra resmi kami.
                </p>
            </div>

            {/* BLOK 1: Informasi Dasar Mitra */}
            <section className="mb-8 p-6 bg-slate-50 rounded-lg border-l-4 border-slate-600 transition-shadow hover:shadow-md">
                <div className="flex items-center mb-5">
                    <FileText className="h-6 w-6 text-slate-600 mr-3" />
                    <h3 className="text-xl font-bold text-slate-700">
                        Informasi Perusahaan
                    </h3>
                </div>

                {/* Data User yang sudah ada sebagai informasi */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <InfoBox label="Nama Pengguna" value={user.name} />
                    <InfoBox label="Email" value={user.email} />
                    <InfoBox
                        label="Nomor Kontak"
                        value={user.phone ?? "Belum tersedia"}
                    />
                </div>

                <div className="mt-6">
                    <Label htmlFor="address" className="text-base">
                        Alamat Kantor/Domisili Lengkap{" "}
                        <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                        id="address"
                        value={data.address}
                        onChange={(e) => setData("address", e.target.value)}
                        className="mt-2 border-gray-300 focus:border-slate-500 focus:ring-slate-500"
                        rows={3}
                        placeholder="Contoh: Jalan Merdeka No. 10, Kota Jakarta Pusat..."
                    />
                    {errors.address && (
                        <p className="text-red-500 text-xs mt-1">
                            {errors.address}
                        </p>
                    )}
                </div>

                <div className="mt-4">
                    <Label htmlFor="description" className="text-base">
                        Deskripsi Layanan (Jelaskan bidang usaha dan layanan
                        Anda) <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                        id="description"
                        rows={4}
                        value={data.description}
                        onChange={(e) => setData("description", e.target.value)}
                        placeholder="Contoh: Kami menyediakan jasa katering premium, dekorasi outdoor, dan penyewaan properti..."
                        className="mt-2 border-gray-300 focus:border-slate-500 focus:ring-slate-500"
                    />
                    {errors.description && (
                        <p className="text-red-500 text-xs mt-1">
                            {errors.description}
                        </p>
                    )}
                </div>
            </section>

            {/* BLOK 2: Dokumen Legalitas */}
            <section className="mb-8 p-6 bg-red-50 rounded-lg border-l-4 border-red-600 transition-shadow hover:shadow-md">
                <div className="flex items-center mb-5">
                    <UploadCloud className="h-6 w-6 text-red-600 mr-3" />
                    <h3 className="text-xl font-bold text-red-700">
                        Dokumen Legalitas
                    </h3>
                </div>
                <p className="text-sm text-red-700 mb-6 p-3 bg-red-100 rounded-md border border-red-200">
                    <AlertTriangle className="inline h-4 w-4 mr-1 mb-1" />{" "}
                    Wajib: Dokumen akan diverifikasi oleh tim kami. Pastikan
                    file jelas dan valid.
                </p>

                {/* Nomor NPWP */}
                <FormField
                    id="npwp_number"
                    label="Nomor NPWP"
                    type="text"
                    value={data.npwp_number}
                    onChange={(e) => setData("npwp_number", e.target.value)}
                    error={errors.npwp_number}
                    required
                    placeholder="Masukkan 15-20 digit Nomor NPWP"
                    color={"slate"}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* File NPWP */}
                    <FileField
                        id="npwp_file"
                        label="Scan Kartu NPWP (Maks 2MB, JPG/PDF)"
                        onChange={(e) =>
                            setData("npwp_file", e.target.files[0])
                        }
                        error={errors.npwp_file}
                        required
                        color={"slate"}
                        progress={progress && data.npwp_file ? progress : null}
                    />
                    {/* File Berkas Usaha */}
                    <FileField
                        id="business_file"
                        label="Berkas Izin Usaha/Akta Pendirian (Maks 2MB, PDF)"
                        onChange={(e) =>
                            setData("business_file", e.target.files[0])
                        }
                        error={errors.business_file}
                        required
                        color={"slate"}
                        progress={
                            progress && data.business_file ? progress : null
                        }
                    />
                </div>
            </section>

            <Button
                type="submit"
                disabled={processing}
                className={`w-full mt-8 bg-slate-600 hover:bg-slate-700 text-slate-800 border py-3 font-semibold tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl`}
            >
                {processing ? (
                    <>
                        <Clock className="h-5 w-5 mr-2 animate-spin" /> Sedang
                        Mengirim Data...
                    </>
                ) : (
                    "Ajukan Pendaftaran Sekarang"
                )}
            </Button>
            {/* Tampilkan pesan error umum jika ada */}
            {Object.keys(errors).length > 0 && (
                <p className="text-red-500 text-sm mt-4 text-center">
                    Terdapat {Object.keys(errors).length} kesalahan pada
                    formulir. Silakan periksa kembali.
                </p>
            )}
        </form>
    );
}

// -------------------------------------------------------------------
// KOMPONEN PEMBANTU BARU (Untuk tampilan status)
// -------------------------------------------------------------------

const StatusDisplay = ({ status, isPending, isApproved, isRejected }) => {
    let icon, title, description, colorClass;

    if (isApproved) {
        icon = CircleCheck;
        title = "SELAMAT! Anda Mitra Resmi Kami 🎉";
        description =
            "Pengajuan mitra Anda telah disetujui. Anda kini memiliki akses penuh ke fitur dan keuntungan mitra. Silakan lanjutkan ke halaman dashboard Anda.";
        colorClass = "text-green-600 border-green-500 bg-green-50";
    } else if (isRejected) {
        icon = XCircle;
        title = "Pengajuan Ditolak 😔";
        description =
            "Mohon maaf, pengajuan mitra Anda ditolak. Silakan periksa email Anda untuk alasan penolakan dan perbaiki data/dokumen sebelum mengajukan kembali.";
        colorClass = "text-red-600 border-red-500 bg-red-50";
    } else {
        // Pending
        icon = Clock;
        title = "Pengajuan Sedang Diulas Admin";
        description =
            "Terima kasih telah mendaftar. Dokumen Anda sedang kami verifikasi. Proses ini mungkin memakan waktu 1-3 hari kerja. Anda akan menerima notifikasi email setelah status diperbarui.";
        colorClass = `text-slate-600 border-slate-500 bg-slate-50`;
    }

    const IconComponent = icon;

    return (
        <div
            className={`p-8 rounded-xl text-center shadow-lg ${colorClass} transition-all duration-300`}
        >
            <IconComponent className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-3">{title}</h1>
            <p className="text-lg text-gray-700">{description}</p>

            {isRejected && (
                <Button className="mt-6 bg-red-600 hover:bg-red-700">
                    Ajukan Kembali
                </Button>
            )}
            {isApproved && (
                <Button className={`mt-6 bg-slate-600 hover:bg-slate-700`}>
                    Menuju Dashboard Mitra
                </Button>
            )}
        </div>
    );
};

// Komponen Pembantu untuk Menampilkan Info User
const InfoBox = ({ label, value }) => (
    <div className="p-3 bg-white rounded-md border border-gray-200 shadow-sm">
        <strong className="text-xs font-semibold uppercase text-gray-500 block">
            {label}
        </strong>
        <span className="text-base font-medium text-gray-800 break-words">
            {value}
        </span>
    </div>
);

// -------------------------------------------------------------------
// KOMPONEN PEMBANTU Shadcn/ui Wrapper (Diperbarui dengan prop warna)
// -------------------------------------------------------------------

// Komponen Pembantu untuk Input Teks/Email/Telp
const FormField = ({
    id,
    label,
    type,
    value,
    onChange,
    error,
    required = false,
    placeholder = "",
    color = "indigo", // Warna default
}) => (
    <div className="space-y-1">
        <Label htmlFor={id} className="text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <Input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={
                error
                    ? "border-red-500 focus-visible:ring-red-500"
                    : `border-gray-300 focus:border-${color}-500 focus:ring-${color}-500`
            }
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
);

// Komponen Pembantu untuk File Input
// Komponen Pembantu untuk File Input
const FileField = ({
    id,
    label,
    onChange,
    error,
    required = false,
    color = "indigo", // Warna default
    progress, // TAMBAHKAN PROPS PROGRESS DI SINI
}) => (
    <div className="space-y-1">
        <Label htmlFor={id} className="text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
        </Label>
        {/* 3. TAMPILKAN PROGRESS BAR */}
        {progress && (
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                <div
                    className={`h-full bg-slate-600 transition-all duration-100 ease-linear`}
                    style={{
                        width: `${progress.percentage}%`,
                    }}
                ></div>
            </div>
        )}
        <Input
            id={id}
            type="file"
            onChange={onChange}
            className={
                error
                    ? "border-red-500 focus-visible:ring-red-500"
                    : `border-gray-300 file:text-${color}-600 file:bg-${color}-50 hover:file:bg-${color}-100`
            }
        />
        {progress && progress.percentage && (
            <p className="text-xs text-gray-500 mt-1">
                Mengunggah: {progress.percentage}%
            </p>
        )}
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
);
