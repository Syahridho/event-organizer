import { usePage } from "@inertiajs/react";

export default function Guest({ children }) {
    const { auth } = usePage().props;
    const isAuthenticated = auth?.user;

    // Jika user sudah login, gunakan layout tanpa centering untuk halaman seperti partner registration
    if (isAuthenticated) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100">
                {children}
            </div>
        );
    }

    // Jika user belum login, gunakan layout dengan centering untuk login/register
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="w-full max-w-md sm:max-w-sm">{children}</div>
        </div>
    );
}
