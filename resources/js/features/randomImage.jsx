let imagePool = [];
let currentIndex = 0;
let cachedDefaultImages = null;

function shuffleImages(images) {
    const array = [...images];
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getDefaultImages(adminSettings = null) {
    // Use cached images if already loaded
    if (cachedDefaultImages) {
        return cachedDefaultImages.map((img) => img.filename);
    }

    try {
        const defaultImages = adminSettings?.default_event_images || [];

        if (defaultImages.length > 0) {
            cachedDefaultImages = defaultImages;
            return defaultImages.map((img) => img.filename);
        }
    } catch (error) {
        console.warn(
            "Failed to get default images from admin settings:",
            error
        );
    }

    // Fallback to hardcoded images if admin settings are not available
    const fallbackImages = ["1.webp", "2.webp", "3.webp", "4.webp", "5.webp"];
    cachedDefaultImages = fallbackImages.map((img) => ({ filename: img }));
    return fallbackImages;
}

export function getNextImage(adminSettings = null) {
    if (currentIndex >= imagePool.length) {
        const defaultImages = getDefaultImages(adminSettings);

        if (defaultImages.length === 0) {
            console.warn("No default images available");
            return null;
        }

        imagePool = shuffleImages(defaultImages);
        currentIndex = 0;
    }

    const image = imagePool[currentIndex];
    currentIndex++;
    return image;
}

export function getImageUrl(imageFilename, adminSettings = null) {
    if (!imageFilename) {
        return null;
    }

    try {
        const defaultImages = adminSettings?.default_event_images || [];
        const imageData = defaultImages.find(
            (img) => img.filename === imageFilename
        );

        if (imageData) {
            return `/storage/default-event-images/${imageFilename}`;
        }
    } catch (error) {
        console.warn("Failed to get image URL:", error);
    }

    // Fallback to default-event-images folder
    return `/storage/default-event-images/${imageFilename}`;
}

export function handleImageError(event) {
    // Set a placeholder or remove the image on error
    const target = event.target;
    target.style.display = "none";

    // Optionally show a placeholder text
    const placeholder = document.createElement("div");
    placeholder.textContent = "Gambar tidak tersedia";
    placeholder.className =
        "flex items-center justify-center h-full w-full bg-gray-200 text-gray-500 text-sm";
    placeholder.style.minHeight = target.style.minHeight || "200px";

    if (target.parentNode) {
        target.parentNode.appendChild(placeholder);
    }
}
