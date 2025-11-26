# Image Optimization Guide

## Current Issues
- `hero.jpg` is 310KB (too large)
- No WebP format support
- No responsive images

## Solutions

### 1. Compress Existing Images
Use online tools or command line:
```bash
# Using ImageMagick (if installed)
magick convert hero.jpg -quality 85 -strip hero-optimized.jpg

# Using cwebp for WebP conversion
cwebp -q 80 hero.jpg -o hero.webp
```

### 2. Use Responsive Images
```jsx
<picture>
  <source srcset="hero.webp" type="image/webp">
  <source srcset="hero.jpg" type="image/jpeg">
  <img src="hero.jpg" alt="Hero" loading="lazy" decoding="async">
</picture>
```

### 3. Use LazyImage Component
```jsx
import LazyImage from '@/components/LazyImage';

<LazyImage 
  src="/hero.jpg" 
  alt="Hero" 
  className="w-full h-auto"
/>
```

### 4. Recommended Image Sizes
- Hero images: max 1920x1080, 80-85% quality
- Thumbnails: max 400x400, 75-80% quality
- Icons: SVG preferred, or PNG max 200x200

### 5. Use CDN (Optional)
Consider using image CDN services like:
- Cloudinary
- imgix
- Cloudflare Images

## Implementation Checklist
- [ ] Compress all images to WebP format
- [ ] Add responsive image tags
- [ ] Implement lazy loading
- [ ] Set proper width/height attributes
- [ ] Use CDN for static assets
