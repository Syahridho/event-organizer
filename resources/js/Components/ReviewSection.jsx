import React, { useState, useEffect, useCallback } from "react";
import { Star, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/avatar";
import { cn } from "@/Lib/utils";
import axios from "axios";
import { toast } from "sonner";

/**
 * ReviewSection - Responsive review component with purchase validation
 * Features:
 * - Only purchased users can review
 * - One review per product per user
 * - Star rating (1-5)
 * - Optimized with pagination and indexing
 * - Fully responsive design
 */
export default function ReviewSection({
    itemType,
    itemId,
    user,
    className,
    transactionItemId = null,
}) {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ average_rating: 0, total_reviews: 0 });
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [canReview, setCanReview] = useState(false);
    const [hasPurchased, setHasPurchased] = useState(false);
    const [alreadyReviewed, setAlreadyReviewed] = useState(false);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
    });

    // Fetch reviews
    const fetchReviews = useCallback(
        async (page = 1) => {
            setIsLoading(true);
            try {
                const response = await axios.get("/reviews", {
                    params: {
                        item_type: itemType,
                        item_id: itemId,
                        page: page,
                    },
                });
                console.log("Full Response:", response);
                // console.log("Reviews Data:", response?.data);

                // Handle nested data structure from API
                const apiData = response.data.data || response.data;

                setReviews(apiData.reviews.data);
                setStats(apiData.stats);
                setPagination({
                    current_page: apiData.reviews.current_page,
                    last_page: apiData.reviews.last_page,
                });
            } catch (error) {
                console.error("Error fetching reviews:", error);
                toast.error("Gagal memuat review");
            } finally {
                setIsLoading(false);
            }
        },
        [itemType, itemId]
    );

    // Check if user can review
    const checkCanReview = useCallback(async () => {
        if (!user) return;

        try {
            const response = await axios.get("/reviews/can-review", {
                params: {
                    item_type: itemType,
                    item_id: itemId,
                },
            });

            setCanReview(response.data.can_review);
            setHasPurchased(response.data.has_purchased);
            setAlreadyReviewed(response.data.already_reviewed);
        } catch (error) {
            console.error("Error checking review permission:", error);
        }
    }, [user, itemType, itemId]);

    useEffect(() => {
        fetchReviews();
        if (user) {
            checkCanReview();
        }
    }, [fetchReviews, checkCanReview, user]);

    // Load more reviews
    const loadMore = () => {
        if (pagination.current_page < pagination.last_page) {
            fetchReviews(pagination.current_page + 1);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 7) {
            return date.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });
        } else if (days > 0) {
            return `${days} hari lalu`;
        } else if (hours > 0) {
            return `${hours} jam lalu`;
        } else if (minutes > 0) {
            return `${minutes} menit lalu`;
        } else {
            return "Baru saja";
        }
    };

    // Star Rating Component
    const StarRating = ({ value, onChange, size = 24, readonly = false }) => {
        const [hover, setHover] = useState(0);

        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                        key={star}
                        type="button"
                        disabled={readonly}
                        className={cn(
                            "transition-colors bg-white shadow-none w-0 h-0",
                            !readonly && "hover:scale-110 cursor-pointer"
                        )}
                        onClick={() => !readonly && onChange(star)}
                        onMouseEnter={() => !readonly && setHover(star)}
                        onMouseLeave={() => !readonly && setHover(0)}
                    >
                        <Star
                            size={size}
                            className={cn(
                                "transition-colors",
                                (hover || value) >= star
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                            )}
                        />
                    </Button>
                ))}
            </div>
        );
    };

    // Review Item Component
    const ReviewItem = ({ review }) => {
        // Debug: log review data
        console.log("Review Item:", review);

        return (
            <div className="space-y-3 pb-4 border-b last:border-b-0">
                <div className="flex gap-3">
                    <Avatar
                        name={review.user?.name || "User"}
                        size="sm"
                        className="flex-shrink-0"
                        src={review?.user?.profile_photo}
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm md:text-base text-slate-900 truncate">
                                    {review.user?.name || "User"}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <StarRating
                                        value={review.rating}
                                        size={16}
                                        readonly
                                    />
                                    <span className="text-xs text-slate-500">
                                        {formatDate(review.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Always show comment section for debugging */}
                        <div className="mt-2">
                            <p className="text-sm md:text-base text-slate-700 whitespace-pre-wrap break-words">
                                {review.comment || (
                                    <span className="text-slate-400 italic">
                                        Tidak ada komentar
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={cn("w-full space-y-6", className)}>
            {/* Header with stats */}
            <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-slate-600" />
                    <div>
                        <h3 className="text-lg md:text-xl font-semibold text-slate-900">
                            Review ({stats.total_reviews})
                        </h3>
                        {stats.total_reviews > 0 && (
                            <div className="flex items-center gap-2 mt-1">
                                <StarRating
                                    value={Math.round(stats.average_rating)}
                                    size={16}
                                    readonly
                                />
                                <span className="text-sm text-slate-600">
                                    {parseFloat(
                                        stats?.average_rating ?? 0
                                    ).toFixed(1)}{" "}
                                    dari {stats?.total_reviews}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Already reviewed message */}
            {user && alreadyReviewed && !canReview && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                        Anda sudah memberikan review untuk produk ini.
                    </p>
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
                {isLoading && reviews.length === 0 ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500 text-sm">
                            Belum ada review
                        </p>
                    </div>
                ) : (
                    <>
                        {reviews?.map((review) => (
                            <ReviewItem key={review.id} review={review} />
                        ))}

                        {pagination.current_page < pagination.last_page && (
                            <div className="flex justify-center pt-4">
                                <Button
                                    variant="outline"
                                    onClick={loadMore}
                                    disabled={isLoading}
                                    className="w-full sm:w-auto"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Memuat...
                                        </>
                                    ) : (
                                        "Muat Lebih Banyak"
                                    )}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
