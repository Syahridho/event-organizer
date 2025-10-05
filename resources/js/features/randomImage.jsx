let imagePool = [];
let currentIndex = 0;

function shuffleImages(images) {
    const array = [...images];
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function getNextImage() {
    if (currentIndex >= imagePool.length) {
        imagePool = shuffleImages([
            "1.webp",
            "2.webp",
            "3.webp",
            "4.webp",
            "5.webp",
        ]);
        currentIndex = 0;
    }

    const image = imagePool[currentIndex];
    currentIndex++;
    return image;
}
