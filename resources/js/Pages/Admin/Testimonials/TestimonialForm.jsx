import React from "react";
import { useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button.jsx";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Label } from "@/components/ui/label.jsx";
import { toast } from "sonner";

export default function TestimonialForm({
    isOpen,
    onClose,
    testimonial = null,
    onSuccess,
}) {
    const isEditing = !!testimonial;

    const { data, setData, post, put, processing, errors, reset } = useForm({
        author_name: testimonial?.author_name || "",
        author_title: testimonial?.author_title || "",
        quote: testimonial?.quote || "",
        star_rating: testimonial?.star_rating || 5,
        author_image: null,
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const formData = new FormData();
        Object.keys(data).forEach((key) => {
            if (data[key] !== null) {
                formData.append(key, data[key]);
            }
        });

        const options = {
            data: formData,
            onSuccess: () => {
                toast.success(
                    isEditing
                        ? "Testimonial updated successfully"
                        : "Testimonial created successfully"
                );
                reset();
                onClose();
                onSuccess?.();
            },
            onError: () => {
                toast.error(
                    isEditing
                        ? "Failed to update testimonial"
                        : "Failed to create testimonial"
                );
            },
        };

        if (isEditing) {
            put(route("admin.testimonials.update", testimonial.id), options);
        } else {
            post(route("admin.testimonials.store"), options);
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit Testimonial" : "Add New Testimonial"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="author_name">Author Name</Label>
                        <Input
                            id="author_name"
                            placeholder="Enter author name"
                            value={data.author_name}
                            onChange={(e) =>
                                setData("author_name", e.target.value)
                            }
                            required
                        />
                        {errors.author_name && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.author_name}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="author_title">Author Title</Label>
                        <Input
                            id="author_title"
                            placeholder="Enter author title"
                            value={data.author_title}
                            onChange={(e) =>
                                setData("author_title", e.target.value)
                            }
                            required
                        />
                        {errors.author_title && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.author_title}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="quote">Quote</Label>
                        <Textarea
                            id="quote"
                            placeholder="Enter testimonial quote"
                            value={data.quote}
                            onChange={(e) => setData("quote", e.target.value)}
                            rows={3}
                            required
                        />
                        {errors.quote && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.quote}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="star_rating">Star Rating</Label>
                        <select
                            id="star_rating"
                            value={data.star_rating}
                            onChange={(e) =>
                                setData("star_rating", parseInt(e.target.value))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            {[1, 2, 3, 4, 5].map((num) => (
                                <option key={num} value={num}>
                                    {num} Star{num > 1 ? "s" : ""}
                                </option>
                            ))}
                        </select>
                        {errors.star_rating && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.star_rating}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="author_image">
                            Author Image (Optional)
                        </Label>
                        <Input
                            id="author_image"
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setData("author_image", e.target.files[0])
                            }
                        />
                        {errors.author_image && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.author_image}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end space-x-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? "Saving..."
                                : isEditing
                                ? "Update"
                                : "Create"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
