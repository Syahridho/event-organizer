import { Loader2 } from "lucide-react";

const PaymentLoading = ({
    isVisible,
    title = "Memproses pembayaran...",
    subtitle = "Mohon tunggu sebentar",
}) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
        </div>
    );
};

export default PaymentLoading;
