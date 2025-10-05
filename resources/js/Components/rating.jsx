import { Star } from "lucide-react";

const Rating = ({ value = 0, max = 5, size = 16, showValue = true }) => {
    const stars = [];

    for (let i = 1; i <= max; i++) {
        stars.push(
            <Star
                key={i}
                size={size}
                className={`${
                    i <= value
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-gray-200 text-gray-200"
                } transition-colors`}
            />
        );
    }

    return (
        <div className="flex items-center gap-1">
            {stars}
            {showValue && (
                <span className="text-sm text-slate-600 ml-1">
                    ({value.toFixed(1)})
                </span>
            )}
        </div>
    );
};

export default Rating;
