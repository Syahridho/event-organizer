import React, { lazy, Suspense } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { FaShoppingCart } from "react-icons/fa";
import { MapPin, Loader2 } from "lucide-react";

const CustomCalendar = lazy(() => import("@/components/custom-calendar"));

const CalendarSkeleton = () => (
    <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
    </div>
);

const BuildingPaymentSheet = ({
    isOpen,
    onOpenChange,
    building,
    selectedDate,
    setSelectedDate,
    bookedDatesWithUser,
    disabledLeaves,
    user,
    cartDates,
    pendingDates,
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
                    <SheetTitle>Sewa Gedung - {building.name}</SheetTitle>
                    <SheetDescription>
                        Pilih tanggal untuk penyewaan gedung
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
                                itemId={building.id}
                                itemType="building"
                            />
                        </Suspense>
                    </div>

                    <div className="space-y-3">
                        <h1 className="font-semibold text-slate-800">
                            Lokasi Gedung
                        </h1>
                        <div className="border rounded-lg p-4 bg-slate-50">
                            <div className="flex items-center gap-2 text-slate-700">
                                <MapPin className="h-4 w-4" />
                                <span className="text-sm">
                                    {building.location}
                                </span>
                            </div>
                        </div>
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
                            placeholder="Catatan tambahan untuk penyewaan gedung"
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

export default BuildingPaymentSheet;
