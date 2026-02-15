import React, { memo } from "react";
import { Button } from "@/components/ui/button.jsx";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";

const ItemNoteModal = memo(
    ({
        isOpen,
        onOpenChange,
        itemName,
        noteValue,
        onNoteChange,
        onSave,
        onCancel,
    }) => {
        return (
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Catatan untuk {itemName}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="item_note">Catatan Item</Label>
                            <Textarea
                                id="item_note"
                                value={noteValue}
                                onChange={(e) => onNoteChange(e.target.value)}
                                placeholder="Tambahkan catatan khusus untuk item ini (opsional)"
                                rows={4}
                                maxLength={500}
                            />
                            <p className="text-xs text-gray-500">
                                {noteValue.length}/500 karakter
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                        >
                            Batal
                        </Button>
                        <Button type="button" onClick={onSave}>
                            Simpan Catatan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }
);

ItemNoteModal.displayName = "ItemNoteModal";

export default ItemNoteModal;
