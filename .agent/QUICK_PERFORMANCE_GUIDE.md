# Quick Performance Optimization Guide

## 🚀 Cara Test Performance

### 1. Build Production
```bash
npm run build
```

### 2. Test dengan Lighthouse
1. Buka website di Chrome
2. Tekan F12 (DevTools)
3. Pilih tab "Lighthouse"
4. Pilih "Performance" category
5. Klik "Analyze page load"

### 3. Lihat Hasil
- **Performance Score**: Target 90+
- **First Contentful Paint**: Target <1.5s
- **Largest Contentful Paint**: Target <2.5s
- **Time to Interactive**: Target <3.5s
- **Cumulative Layout Shift**: Target <0.1

## 📊 Optimasi yang Diterapkan

### ✅ JavaScript
- Code splitting (vendor chunks terpisah)
- Lazy loading untuk Echo/Pusher
- Minification dengan Terser
- Remove console.log di production

### ✅ CSS
- Lazy loading untuk Leaflet & Quill CSS
- CSS code splitting
- Minification

### ✅ Images
- LazyImage component (load saat visible)
- Native lazy loading
- Intersection Observer

### ✅ Caching
- 1 year cache untuk static assets
- Gzip & Brotli compression
- Cache-Control headers

### ✅ Fonts
- Preconnect ke fonts.bunny.net
- font-display: swap

## 🔧 Cara Menggunakan Komponen Baru

### LazyImage
```jsx
import LazyImage from '@/components/LazyImage';

<LazyImage 
  src="/path/to/image.jpg"
  alt="Description"
  className="w-full h-auto"
/>
```

### Lazy Load Components
```jsx
import { LazyMap, LazyEditor, LazyChart } from '@/utils/lazyLoad';

// Gunakan seperti komponen biasa
<LazyMap {...props} />
<LazyEditor {...props} />
<LazyChart {...props} />
```

### Dynamic CSS Loading
```jsx
import { loadLeafletCSS, loadQuillCSS } from '@/utils/loadCSS';

// Di component yang menggunakan Leaflet
useEffect(() => {
  loadLeafletCSS();
}, []);
```

### Initialize Echo Manually
```jsx
import { initializeEcho } from '@/bootstrap';

// Jika butuh Echo lebih awal
useEffect(() => {
  initializeEcho().then(echo => {
    // Use echo
  });
}, []);
```

## 📈 Expected Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Performance Score | 39 | 85-95 | +118-144% |
| Bundle Size | ~2MB | ~1MB | -50% |
| FCP | ~3-4s | ~1-1.5s | -60-70% |
| TTI | ~5-7s | ~2-3s | -50-60% |

## ⚠️ Important Notes

1. **Clear Cache**: Selalu test di incognito mode atau clear cache
2. **Production Build**: Performance optimization hanya terlihat di production build
3. **Server Config**: Pastikan Apache modules enabled:
   - mod_deflate (compression)
   - mod_expires (caching)
   - mod_headers (cache headers)

## 🐛 Troubleshooting

### Build Error
```bash
# Clear cache dan rebuild
rm -rf node_modules/.vite
npm run build
```

### Performance Tidak Meningkat
1. Pastikan sudah build production (`npm run build`)
2. Clear browser cache
3. Test di incognito mode
4. Verify .htaccess rules aktif

### Images Tidak Lazy Load
1. Check browser support untuk IntersectionObserver
2. Verify LazyImage component digunakan
3. Check console untuk errors

## 📝 Checklist

- [x] Install dependencies (vite-plugin-compression2, terser)
- [x] Update vite.config.js
- [x] Update app.blade.php
- [x] Update app.jsx
- [x] Update bootstrap.js
- [x] Update .htaccess
- [x] Create LazyImage component
- [x] Create lazyLoad utilities
- [x] Build production
- [ ] Test dengan Lighthouse
- [ ] Compress hero.jpg manually
- [ ] Deploy ke production

## 🎯 Next Actions

1. **Build Production**: `npm run build`
2. **Test Performance**: Lighthouse di Chrome DevTools
3. **Compress Images**: Gunakan TinyPNG atau Squoosh
4. **Monitor**: Track performance over time

## 📞 Support

Jika ada issues:
1. Check build logs untuk errors
2. Verify all dependencies installed
3. Test di browser lain
4. Check server configuration
