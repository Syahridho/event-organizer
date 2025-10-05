import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Minus, Plus } from "lucide-react";
import { formatRupiah } from "@/Utils/formatRupiah";

export const TicketItem = ({ ticket, count, onCountChange, disabled }) => {
    return (
        <div className="flex items-center justify-between py-2" key={ticket.id}>
            <Label className="grid gap-0.5 flex-1">
                <span className="font-medium">{ticket.name}</span>
                <span className="text-muted-foreground text-xs">
                    Rp. {formatRupiah(ticket.price)}
                </span>
                <span className="text-muted-foreground/70 text-xs">
                    Sisa Tiket {ticket.remaining}
                </span>
            </Label>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onCountChange(ticket.id, -1)}
                    disabled={disabled || count <= 0}
                    className="h-8 w-8 p-0"
                >
                    <Minus className="h-4 w-4" />
                </Button>
                <Input
                    type="number"
                    min={0}
                    max={ticket.quota}
                    value={count}
                    readOnly
                    className="w-16 text-center h-8"
                />
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onCountChange(ticket.id, 1)}
                    disabled={disabled || count >= ticket.remaining}
                    className="h-8 w-8 p-0"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};
