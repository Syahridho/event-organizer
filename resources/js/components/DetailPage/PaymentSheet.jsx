import React, { lazy, Suspense } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { FaShoppingCart, FaMapMarkerAlt } from "react-icons/fa";
import { Loader2 } from "lucide-react";

const CustomCalendar = lazy(() => import("@/components/custom-calendar"));

const CalendarSkeleton = () => (
    <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
    </div>
);

const PaymentSheet = ({
    isOpen,
    onOpenChange,
    service,
    selectedDate,
    setSelectedDate,
    bookedDatesWithUser,
    disabledLeaves,
    user,
    cartDates,
    pendingDates,
    addresses,
    selectedAddressId,
    setIsAddressListOpen,
    isLoadingAddresses,
    note,
    setNote,
    handleAddToCart,
    setIsConfirmOpen,
    isLoading,
}) => {
    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="md:!max-w-xl w-full flex flex-col max-h-screen">
                <SheetHeader className="flex-shrink-0 pb-4 border-b">
                    <SheetTitle>Sewa Jasa - {service.name}</SheetTitle>
                    <SheetDescription>
                        Pilih tanggal untuk jadwal datang
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-6">
                    <div className="flex justify-center">
                        <Suspense fallback={<CalendarSkeleton />}>
                            <CustomCalendar
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={(date) => date < new Date()}
                                bookedDatesWithUser={bookedDatesWithUser}
                                disabledLeaves={disabledLeaves}
                                currentUserId={user?.id}
                                cartDates={cartDates}
                                pendingDates={pendingDates}
                                itemId={service.id}
                                itemType="service"
                            />
                        </Suspense>
                    </div>

                    <div className="space-y-3">
                        <h1 className="font-semibold text-slate-800">
                            Lokasi Anda
                        </h1>
                        <Button
                            variant="outline"
                            className="w-full py-4 text-left justify-start"
                            onClick={() => setIsAddressListOpen(true)}
                            disabled={isLoadingAddresses}
                        >
                            {isLoadingAddresses ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Memuat Alamat...
                                </div>
                            ) : (() => {
                                const filtered = addresses.filter(
                                    (address) => address.id === selectedAddressId
                                );

                                if (filtered.length === 0) {
                                    return (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <FaMapMarkerAlt />
                                            Masukkan Alamat
                                        </div>
                                    );
                                }

                                return filtered.map((address) => (
                                    <div
                                        key={address.id}
                                        className="flex items-center gap-2 text-slate-800"
                                    >
                                        <FaMapMarkerAlt />
                                        {address.label || address.recipient_name}
                                    </div>
                                ));
                            })()}
                        </Button>
                    </div>

                    <div className="space-y-3">
                        <Label
                            htmlFor="note"
                            className="font-semibold text-slate-800"
                        >
                            Catatan (Opsional)
                        </Label>
                        <Textarea
                            id="note"
                            placeholder="Catatan untuk abangnya (opsional)"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <SheetFooter className="grid grid-cols-10 gap-4 w-full">
                    <Button
                        variant="outline"
                        onClick={handleAddToCart}
                        className="col-span-1"
                        disabled={!selectedDate || isLoading.cart}
                    >
                        {isLoading.cart ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <FaShoppingCart className="w-4 h-4" />
                        )}
                    </Button>
                    <Button
                        onClick={() => {
                            onOpenChange(false);
                            setIsConfirmOpen(true);
                        }}
                        className="col-span-9"
                    >
                        Bayar
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default PaymentSheet;
