import React, { useState } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table.jsx";
import { Button } from "@/components/ui/button.jsx";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.jsx";
import { Plus, Edit, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/Layouts/App/AppSidebarLayout";
import TestimonialForm from "./TestimonialForm";
import { Switch } from "@/components/ui/switch.jsx";

const breadcrumbs = [
    {
        title: "Dashboard Admin",
        href: "/admin/dashboard",
    },
    {
        title: "Testimoni",
        href: "/admin/testimonials",
    },
];

export default function Index() {
    const { auth, testimonials } = usePage().props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTestimonial, setEditingTestimonial] = useState(null);

    const handleDelete = (testimonial) => {
        router.delete(route("admin.testimonials.destroy", testimonial.id), {
            onSuccess: () => {
                toast.success("Testimonial deleted successfully");
            },
            onError: () => {
                toast.error("Failed to delete testimonial");
            },
        });
    };

    const handleEdit = (testimonial) => {
        setEditingTestimonial(testimonial);
        setDialogOpen(true);
    };

    const handleFormSuccess = () => {
        // Refresh the page to get updated testimonials
        router.reload();
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setEditingTestimonial(null);
    };

    const handleToggleFeatured = (testimonial) => {
        router.patch(route("admin.testimonials.toggle-featured", testimonial.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Status featured berhasil diperbarui");
            },
            onError: (errors) => {
                toast.error(errors.error || "Gagal memperbarui status");
            },
        });
    };

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`w-4 h-4 ${
                    i < rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                }`}
            />
        ));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Testimonials" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Testimonials Management
                        </h1>
                        <Button onClick={() => setDialogOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Testimonial
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>All Testimonials</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Author</TableHead>
                                        <TableHead>Quote</TableHead>
                                        <TableHead>Rating</TableHead>
                                        <TableHead className="text-center">Featured</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {testimonials.map((testimonial) => (
                                        <TableRow key={testimonial.id}>
                                            <TableCell>
                                                <div className="flex items-center space-x-3">
                                                    <Avatar>
                                                        <AvatarImage
                                                            src={
                                                                testimonial.author_image_url
                                                            }
                                                        />
                                                        <AvatarFallback>
                                                            {testimonial.author_name.charAt(
                                                                0
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">
                                                            {
                                                                testimonial.author_name
                                                            }
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {
                                                                testimonial.author_title
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {testimonial.quote}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex">
                                                    {renderStars(
                                                        testimonial.star_rating
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Switch
                                                    checked={testimonial.is_featured}
                                                    onCheckedChange={() => handleToggleFeatured(testimonial)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleEdit(
                                                                testimonial
                                                            )
                                                        }
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>
                                                                    Are you
                                                                    sure?
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action
                                                                    cannot be
                                                                    undone. This
                                                                    will
                                                                    permanently
                                                                    delete the
                                                                    testimonial.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>
                                                                    Cancel
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            testimonial
                                                                        )
                                                                    }
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <TestimonialForm
                isOpen={dialogOpen}
                onClose={handleDialogClose}
                testimonial={editingTestimonial}
                onSuccess={handleFormSuccess}
            />
        </AppLayout>
    );
}
